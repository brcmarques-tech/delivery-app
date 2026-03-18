import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApolloClient, useMutation } from '@apollo/client';
import { AppState } from 'react-native';
import { LOGIN, REGISTER, GOOGLE_AUTH_APP, REGISTER_APP_WITH_GOOGLE } from '../lib/graphql/mutations';
import { GET_ME } from '../lib/graphql/queries';

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

  const appState = useRef(AppState.currentState);

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
      // Token invalid or expired — force logout
      await forceLogout();
    }
  }

  async function forceLogout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    await apolloClient.clearStore();
  }

  async function loadStoredAuth() {
    const storedToken = await AsyncStorage.getItem('token');
    const storedUser = await AsyncStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Validate token with API in background
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

  async function login(email: string, password: string, forceLogin: boolean = false) {
    const { data } = await loginMutation({
      variables: { input: { email, password }, forceLogin },
    });
    const { accessToken, user: userData } = data.loginApp;
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function loginWithGoogle(idToken: string) {
    const { data } = await googleAuthMutation({
      variables: { idToken },
    });
    const { accessToken, user: userData } = data.googleAuthApp;
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
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
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function logout() {
    await AsyncStorage.removeItem('token');
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
