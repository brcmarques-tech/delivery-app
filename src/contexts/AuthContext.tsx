import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApolloClient, useMutation } from '@apollo/client';
import { LOGIN, REGISTER } from '../lib/graphql/mutations';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isDeliverer?: boolean;
  pendingRole?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apolloClient = useApolloClient();
  const [loginMutation] = useMutation(LOGIN);
  const [registerMutation] = useMutation(REGISTER);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    const storedToken = await AsyncStorage.getItem('token');
    const storedUser = await AsyncStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }

  async function login(email: string, password: string) {
    const { data } = await loginMutation({
      variables: { input: { email, password } },
    });
    const { accessToken, user: userData } = data.login;
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function register(name: string, email: string, password: string, phone: string, role?: string) {
    const { data } = await registerMutation({
      variables: { input: { name, email, password, phone, role } },
    });
    const { accessToken, user: userData } = data.register;
    await AsyncStorage.setItem('token', accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }

  async function updateUser(updatedUser: User) {
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  async function logout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    await apolloClient.resetStore();
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
