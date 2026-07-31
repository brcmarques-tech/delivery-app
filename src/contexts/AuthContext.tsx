import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureItem, setSecureItem, deleteSecureItem } from '../lib/secureStorage';
import { useApolloClient, useSubscription } from '@apollo/client';
import { Alert, AppState } from 'react-native';
import { router } from 'expo-router';
import { LOGIN, REGISTER, GOOGLE_AUTH_APP, REGISTER_APP_WITH_GOOGLE, LOGOUT } from '../lib/graphql/mutations';
import { GET_ME } from '../lib/graphql/queries';
import { SESSION_KICKED } from '../lib/graphql/subscriptions';

interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  // KAN-237: o contrato PDF (accept-terms.tsx) imprime user.phone, mas o campo
  // nao existia aqui — dado contratual sumia silenciosamente e o tsc acusava.
  phone?: string | null;
  role: string;
  isDeliverer?: boolean;
  pendingRole?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  paymentConnected?: boolean;
  acceptedTermsAt?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  avatarUrl?: string | null;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, forceLogin?: boolean) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  registerWithGoogle: (idToken: string, phone: string, cpf: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string, role?: string, cpf?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  setAuthData: (token: string, user: User) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apolloClient = useApolloClient();

  const appState = useRef(AppState.currentState);
  const kickedRef = useRef(false);
  const justLoggedInRef = useRef(false);
  // Perf: espelho do user em ref para o refresh periodico comparar sem entrar
  // como dependencia dos callbacks (evita recriar o interval a cada mudanca).
  const userRef = useRef<User | null>(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const forceLogout = useCallback(async () => {
    // C2: Token in SecureStore (sensitive), user in AsyncStorage (non-sensitive)
    await deleteSecureItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    await apolloClient.clearStore();
  }, [apolloClient]);

  // Perf: so troca o objeto `user` quando ele realmente mudou. Antes, o refresh
  // periodico (5 min) e o de foreground faziam setUser(freshUser) com um objeto
  // novo mesmo sem mudanca — como o AuthProvider fica no topo da arvore, isso
  // cascateava um re-render do app inteiro num timer eterno. Agora e no-op quando
  // nada mudou.
  const applyFreshUser = useCallback(async (freshUser: User) => {
    const serialized = JSON.stringify(freshUser);
    if (serialized === JSON.stringify(userRef.current)) return;
    await AsyncStorage.setItem('user', serialized);
    setUser(freshUser);
  }, []);

  const validateToken = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_ME,
        fetchPolicy: 'network-only',
      });
      if (data?.meApp) {
        await applyFreshUser(data.meApp);
      } else {
        await forceLogout();
      }
    } catch {
      await forceLogout();
    }
  }, [apolloClient, applyFreshUser, forceLogout]);

  const loadStoredAuth = useCallback(async () => {
    const storedToken = await getSecureItem('token');
    const storedUser = await AsyncStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      try {
        const { data } = await apolloClient.query({
          query: GET_ME,
          fetchPolicy: 'network-only',
        });
        if (data?.meApp) {
          await applyFreshUser(data.meApp);
        } else {
          await forceLogout();
        }
      } catch {
        await forceLogout();
      }
    }
    setLoading(false);
  }, [apolloClient, applyFreshUser, forceLogout]);

  // Listen for session kicked via WebSocket
  useSubscription(SESSION_KICKED, {
    variables: { userId: user?.id, userType: 'app' },
    skip: !user?.id,
    onData: () => {
      if (justLoggedInRef.current || kickedRef.current) return;
      kickedRef.current = true;
      forceLogout().then(() => {
        Alert.alert(
          'Sessao encerrada',
          'Sua conta foi conectada em outro dispositivo. Voce foi desconectado.',
          [{ text: 'OK', onPress: () => { kickedRef.current = false; router.replace('/auth/login'); } }],
        );
      });
    },
  });

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  // Re-validate token when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active' && token) {
        validateToken();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [token, validateToken]);

  // Periodic token refresh (every 5 minutes)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(validateToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token, validateToken]);

  const markJustLoggedIn = useCallback(() => {
    justLoggedInRef.current = true;
    setTimeout(() => { justLoggedInRef.current = false; }, 3000);
  }, []);

  const login = useCallback(async (email: string, password: string, forceLogin: boolean = false) => {
    if (forceLogin) markJustLoggedIn();
    const { data } = await apolloClient.mutate({
      mutation: LOGIN,
      variables: { input: { email, password }, forceLogin },
    });
    const { accessToken, user: userData } = data.loginApp;
    await setSecureItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, [apolloClient, markJustLoggedIn]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    markJustLoggedIn();
    const { data } = await apolloClient.mutate({
      mutation: GOOGLE_AUTH_APP,
      variables: { idToken },
    });
    const { accessToken, user: userData } = data.googleAuthApp;
    await setSecureItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, [apolloClient, markJustLoggedIn]);

  const registerWithGoogle = useCallback(async (idToken: string, phone: string, cpf: string) => {
    const { data } = await apolloClient.mutate({
      mutation: REGISTER_APP_WITH_GOOGLE,
      variables: { idToken, phone, cpf },
    });
    const { accessToken, user: userData } = data.registerAppWithGoogle;
    await setSecureItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, [apolloClient]);

  const register = useCallback(async (name: string, email: string, password: string, phone: string, role?: string, cpf?: string) => {
    const { data } = await apolloClient.mutate({
      mutation: REGISTER,
      variables: { input: { name, email, password, phone, cpf } },
    });
    const { accessToken, user: userData } = data.registerApp;
    await setSecureItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, [apolloClient]);

  const updateUser = useCallback(async (updatedUser: User) => {
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const setAuthData = useCallback(async (accessToken: string, userData: User) => {
    markJustLoggedIn();
    await setSecureItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, [markJustLoggedIn]);

  const logout = useCallback(async () => {
    try {
      await apolloClient.mutate({ mutation: LOGOUT });
    } catch {
      // ignore — server may be unreachable, still clear locally
    }
    await deleteSecureItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    await apolloClient.clearStore();
  }, [apolloClient]);

  // Perf: value memoizado. Como os callbacks sao estaveis (useCallback), o value
  // so muda quando user/token/loading mudam — em vez de a cada render do provider,
  // que antes re-renderizava TODO consumidor de useAuth (app inteiro).
  const value = useMemo<AuthContextData>(() => ({
    user, token, loading, login, loginWithGoogle, registerWithGoogle,
    register, logout, updateUser, setAuthData, refreshUser: validateToken,
  }), [user, token, loading, login, loginWithGoogle, registerWithGoogle, register, logout, updateUser, setAuthData, validateToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
