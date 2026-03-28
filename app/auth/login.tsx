import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { fonts } from '../../src/theme';

const API_BASE = 'https://api.bcmtech.com.br';
const RETURN_URL = Constants.appOwnership === 'expo'
  ? Linking.createURL('google-auth')
  : 'shopping-app://google-auth';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, loginWithGoogle, setAuthData } = useAuth();
  const { alert } = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const url = `${API_BASE}/auth/google/mobile?mode=login&userType=app&returnUrl=${encodeURIComponent(RETURN_URL)}`;
      const result = await WebBrowser.openAuthSessionAsync(url, RETURN_URL);

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const params = parsed.queryParams || {};

        if (params.error) {
          const error = params.error as string;
          if (error === 'GOOGLE_NO_ACCOUNT') {
            alert('Conta nao encontrada', 'Nenhuma conta encontrada com este email Google. Cadastre-se primeiro.');
          } else {
            alert('Erro', 'Erro ao entrar com Google. Tente novamente.');
          }
          return;
        }

        if (params.accessToken) {
          await loginWithGoogle(params.accessToken as string);
          router.replace('/');
        } else if (params.token && params.user) {
          try {
            const userData = JSON.parse(params.user as string);
            await setAuthData(params.token as string, userData);
            router.replace('/');
          } catch {
            alert('Erro', 'Dados de autenticacao invalidos.');
          }
        }
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('GOOGLE_NO_ACCOUNT')) {
        alert('Conta nao encontrada', 'Nenhuma conta encontrada com este email Google. Cadastre-se primeiro.');
      } else {
        alert('Erro', 'Erro ao entrar com Google. Tente novamente.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLogin(forceLogin: boolean = false) {
    if (!email || !password) {
      alert('Erro', 'Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await login(email, password, forceLogin);
      router.replace('/');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('ACTIVE_SESSION')) {
        Alert.alert(
          'Sessao ativa',
          'Esta conta ja esta logada em outro dispositivo. Deseja desconectar o outro e entrar aqui?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sim, entrar aqui', onPress: () => handleLogin(true) },
          ],
        );
      } else {
        alert('Erro', 'Email ou senha invalidos');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.white }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.logoWrapper}>
          <Text style={styles.logoBcm}>BCM TECH</Text>
          <View style={styles.logoTextRow}>
            <Text style={[styles.logo, { color: colors.primary }]}>Shopping</Text>
            <Text style={[styles.logoApp, { color: colors.textLight }]}>App</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>Tudo perto de voce</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.grayLight, color: colors.text }]}
          placeholder="Email"
          placeholderTextColor={colors.gray}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={[styles.passwordContainer, { backgroundColor: colors.grayLight }]}>
          <TextInput
            style={[styles.passwordInput, { color: colors.text }]}
            placeholder="Senha"
            placeholderTextColor={colors.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.gray}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
          <Text style={[styles.forgotPassword, { color: colors.primary }]}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => handleLogin()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.grayLight }]} />
          <Text style={[styles.dividerText, { color: colors.gray }]}>ou</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.grayLight }]} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: colors.white, borderColor: colors.grayLight }, googleLoading && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleIcon}
              />
              <Text style={[styles.googleButtonText, { color: colors.text }]}>Continuar com Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={[styles.link, { color: colors.textLight }]}>
            Nao tem conta? <Text style={[styles.linkBold, { color: colors.primary }]}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 12,
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
  },
  logoApp: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 6,
  },
  subtitle: {
    fontSize: fonts.large,
    marginTop: 8,
  },
  form: {
    gap: 6,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.regular,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: fonts.regular,
  },
  eyeButton: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  forgotPassword: {
    fontSize: fonts.small,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: fonts.small,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 6,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: fonts.regular,
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    fontSize: fonts.regular,
    marginTop: 12,
  },
  linkBold: {
    fontWeight: 'bold',
  },
});
