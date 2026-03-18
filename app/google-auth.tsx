import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useAlert } from '../src/contexts/AlertContext';
import { colors } from '../src/theme';

export default function GoogleAuthScreen() {
  const params = useLocalSearchParams<{
    mode?: string;
    token?: string;
    user?: string;
    error?: string;
    name?: string;
    email?: string;
    googleId?: string;
    accessToken?: string;
  }>();
  const { loginWithGoogle, setAuthData } = useAuth();
  const { alert } = useAlert();

  useEffect(() => {
    handleResult();
  }, []);

  async function handleResult() {
    // Login mode: NÃO processar aqui — o handleGoogleLogin no login.tsx
    // já trata via openAuthSessionAsync. Processar nos dois causa duas mutations.
    if (params.mode === 'login') return;

    if (params.error) {
      alert('Erro', 'Erro ao entrar com Google. Tente novamente.');
      router.replace('/auth/login');
      return;
    }

    if (params.mode === 'register' && params.name && params.email) {
      router.replace({
        pathname: '/auth/register',
        params: {
          googleName: params.name,
          googleEmail: params.email,
          googleId: params.googleId || '',
          googleAccessToken: params.accessToken || '',
        },
      });
      return;
    }

    router.replace('/auth/login');
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
