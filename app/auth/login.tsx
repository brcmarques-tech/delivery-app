import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { colors, fonts } from '../../src/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { alert } = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      alert('Erro', 'Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)/home');
    } catch {
      alert('Erro', 'Email ou senha invalidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Text style={styles.logoBcm}>BCM TECH</Text>
          <View style={styles.logoTextRow}>
            <Text style={styles.logo}>Delivery</Text>
            <Text style={styles.logoApp}>App</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Tudo perto de voce</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.gray}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={colors.gray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={styles.link}>
            Nao tem conta? <Text style={styles.linkBold}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    paddingRight: 30,
  },
  logoBcm: {
    fontSize: 7,
    fontWeight: '500',
    color: '#e0e0e0',
    letterSpacing: 2,
    position: 'absolute',
    top: 2,
    left: -8,
    zIndex: 1,
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
  },
  logoApp: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textLight,
    marginLeft: 6,
  },
  subtitle: {
    fontSize: fonts.large,
    color: colors.textLight,
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 16,
    fontSize: fonts.regular,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: fonts.regular,
    marginTop: 16,
  },
  linkBold: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
