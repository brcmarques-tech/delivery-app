import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
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
  }, []);

  // Re-validate token when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active' && token) {
        validateToken();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [token]);

  async function validateToken() {
    try {
      const { data } = await apolloClient.query({
        query: GET_ME,
        fetchPolicy: 'network-only',
      });
      if (data?.meApp) {
        const freshUser = data.meApp;
        await AsyncStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
      } else {
        await forceLogout();
      }
    } catch {
      await forceLogout();
    }
  }

  async function forceLogout() {
    // C2: Token in SecureStore (sensitive), user in AsyncStorage (non-sensitive)
    await SecureStore.deleteItemAsync('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    await apolloClient.clearStore();
  }

  async function loadStoredAuth() {
    const storedToken = await SecureStore.getItemAsync('token');
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
          await AsyncStorage.setItem('user', JSON.stringify(data.meApp));
          setUser(data.meApp);
        } else {
          await forceLogout();
        }
      } catch {
        await forceLogout();
      }
    }
    setLoading(false);
  }

  function markJustLoggedIn() {
    justLoggedInRef.current = true;
    setTimeout(() => { justLoggedInRef.current = false; }, 3000);
  }

  async function login(email: string, password: string, forceLogin: boolean = false) {
    if (forceLogin) markJustLoggedIn();
    const { data } = await loginMutation({
      variables: { input: { email, password }, forceLogin },
    });
    const { accessToken, user: userData } = data.loginApp;
    await SecureStore.setItemAsync('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function loginWithGoogle(idToken: string) {
    markJustLoggedIn();
    const { data } = await googleAuthMutation({
      variables: { idToken },
    });
    const { accessToken, user: userData } = data.googleAuthApp;
    await SecureStore.setItemAsync('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function registerWithGoogle(idToken: string, phone: string, cpf: string) {
    const { data } = await registerGoogleMutation({
      variables: { idToken, phone, cpf },
    });
    const { accessToken, user: userData } = data.registerAppWithGoogle;
    await SecureStore.setItemAsync('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function register(name: string, email: string, password: string, phone: string, role?: string, cpf?: string) {
    const { data } = await registerMutation({
      variables: { input: { name, email, password, phone, cpf } },
    });
    const { accessToken, user: userData } = data.registerApp;
    await SecureStore.setItemAsync('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function updateUser(updatedUser: User) {
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  async function setAuthData(accessToken: string, userData: User) {
    markJustLoggedIn();
    await SecureStore.setItemAsync('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function logout() {
    try {
      await logoutMutation();
    } catch {
      // ignore — server may be unreachable, still clear locally
    }
    await SecureStore.deleteItemAsync('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    await apolloClient.clearStore();
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, registerWithGoogle, register, logout, updateUser, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
