import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApolloClient, useMutation, useSubscription } from '@apollo/client';
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
  role: string;
  isDeliverer?: boolean;
  pendingRole?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  paymentConnected?: boolean;
  acceptedTermsAt?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
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
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apolloClient = useApolloClient();
  const [loginMutation] = useMutation(LOGIN);
  const [registerMutation] = useMutation(REGISTER);
  const [googleAuthMutation] = useMutation(GOOGLE_AUTH_APP);
  const [registerGoogleMutation] = useMutation(REGISTER_APP_WITH_GOOGLE);
  const [logoutMutation] = useMutation(LOGOUT);

  const appState = useRef(AppState.currentState);
  const kickedRef = useRef(false);
  const justLoggedInRef = useRef(false);

  // Listen for session kicked via WebSocket
  useSubscription(SESSION_KICKED, {
    variables: { userId: user?.id, userType: 'app' },
    skip: !user?.id,
    onData: () => {
      console.log('[AUTH] sessionKicked recebido! justLoggedIn:', justLoggedInRef.current, 'kicked:', kickedRef.current);
      // Ignore kick events right after login (forceLogin triggers kick for same userId)
      if (justLoggedInRef.current || kickedRef.current) return;
      console.log('[AUTH] KICKANDO usuario!');
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
  }, []);

  // Re-validate token when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      console.log('[AUTH] AppState mudou:', appState.current, '->', nextState, '| token?', !!token);
      if (appState.current.match(/inactive|background/) && nextState === 'active' && token) {
        console.log('[AUTH] App voltou ao foreground, validando token...');
        validateToken();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [token]);

  async function validateToken() {
    console.log('[AUTH] validateToken iniciado');
    try {
      const { data } = await apolloClient.query({
        query: GET_ME,
        fetchPolicy: 'network-only',
      });
      if (data?.meApp) {
        console.log('[AUTH] validateToken OK, user:', data.meApp.email);
        const freshUser = data.meApp;
        await AsyncStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
      } else {
        console.log('[AUTH] validateToken: meApp null, fazendo forceLogout');
        await forceLogout();
      }
    } catch (err: any) {
      console.log('[AUTH] validateToken ERRO:', err?.message);
      // Token invalid or expired — force logout
      await forceLogout();
    }
  }

  async function forceLogout() {
    console.log('[AUTH] forceLogout chamado');
    console.trace('[AUTH] forceLogout stack trace');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    await apolloClient.clearStore();
  }

  async function loadStoredAuth() {
    console.log('[AUTH] loadStoredAuth iniciado');
    const storedToken = await AsyncStorage.getItem('token');
    const storedUser = await AsyncStorage.getItem('user');
    console.log('[AUTH] loadStoredAuth: token?', !!storedToken, 'user?', !!storedUser);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Validate token with API in background
      try {
        console.log('[AUTH] loadStoredAuth: validando token com GET_ME...');
        const { data } = await apolloClient.query({
          query: GET_ME,
          fetchPolicy: 'network-only',
        });
        if (data?.meApp) {
          console.log('[AUTH] loadStoredAuth: token valido, user:', data.meApp.email);
          await AsyncStorage.setItem('user', JSON.stringify(data.meApp));
          setUser(data.meApp);
        } else {
          console.log('[AUTH] loadStoredAuth: meApp null, forceLogout');
          await forceLogout();
        }
      } catch (err: any) {
        console.log('[AUTH] loadStoredAuth: ERRO validacao:', err?.message);
        await forceLogout();
      }
    }
    setLoading(false);
    console.log('[AUTH] loadStoredAuth finalizado, loading=false');
  }

  function markJustLoggedIn() {
    console.log('[AUTH] markJustLoggedIn - protecao 3s ativada');
    justLoggedInRef.current = true;
    setTimeout(() => {
      justLoggedInRef.current = false;
      console.log('[AUTH] markJustLoggedIn - protecao expirou');
    }, 3000);
  }

  async function login(email: string, password: string, forceLogin: boolean = false) {
    console.log('[AUTH] login chamado, email:', email, 'forceLogin:', forceLogin);
    if (forceLogin) markJustLoggedIn();
    const { data } = await loginMutation({
      variables: { input: { email, password }, forceLogin },
    });
    const { accessToken, user: userData } = data.loginApp;
    console.log('[AUTH] login OK, user:', userData.email, 'token:', accessToken.substring(0, 20) + '...');
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function loginWithGoogle(idToken: string) {
    console.log('[AUTH] loginWithGoogle chamado, token (primeiros 30 chars):', idToken.substring(0, 30));
    markJustLoggedIn();
    console.log('[AUTH] loginWithGoogle: enviando GOOGLE_AUTH_APP mutation...');
    const { data } = await googleAuthMutation({
      variables: { idToken },
    });
    console.log('[AUTH] loginWithGoogle: mutation retornou, data:', JSON.stringify(data).substring(0, 200));
    const { accessToken, user: userData } = data.googleAuthApp;
    console.log('[AUTH] loginWithGoogle OK, user:', userData.email, 'token:', accessToken.substring(0, 20) + '...');
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    console.log('[AUTH] loginWithGoogle: estado atualizado');
  }

  async function registerWithGoogle(idToken: string, phone: string, cpf: string) {
    const { data } = await registerGoogleMutation({
      variables: { idToken, phone, cpf },
    });
    const { accessToken, user: userData } = data.registerAppWithGoogle;
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function register(name: string, email: string, password: string, phone: string, role?: string, cpf?: string) {
    const { data } = await registerMutation({
      variables: { input: { name, email, password, phone, cpf } },
    });
    const { accessToken, user: userData } = data.registerApp;
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function updateUser(updatedUser: User) {
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  async function setAuthData(accessToken: string, userData: User) {
    console.log('[AUTH] setAuthData chamado');
    markJustLoggedIn();
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function logout() {
    console.log('[AUTH] logout chamado (com mutation no servidor)');
    try {
      await logoutMutation();
      console.log('[AUTH] logout mutation OK');
    } catch (err: any) {
      console.log('[AUTH] logout mutation erro (ignorando):', err?.message);
      // ignore — server may be unreachable, still clear locally
    }
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    await apolloClient.clearStore();
    console.log('[AUTH] logout completo');
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, registerWithGoogle, register, logout, updateUser, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
