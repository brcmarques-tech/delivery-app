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
    console.log('[GOOGLE-AUTH-SCREEN] handleResult chamado');
    console.log('[GOOGLE-AUTH-SCREEN] Params:', JSON.stringify(params));

    if (params.error) {
      console.log('[GOOGLE-AUTH-SCREEN] Erro:', params.error);
      const error = params.error;
      if (error === 'GOOGLE_NO_ACCOUNT') {
        alert('Conta nao encontrada', 'Nenhuma conta encontrada com este email Google. Cadastre-se primeiro.');
      } else {
        alert('Erro', 'Erro ao entrar com Google. Tente novamente.');
      }
      router.replace('/auth/login');
      return;
    }

    if (params.mode === 'login' && params.accessToken) {
      // Novo formato: Google access token → autenticar via GraphQL
      console.log('[GOOGLE-AUTH-SCREEN] Login mode com accessToken, chamando loginWithGoogle...');
      try {
        await loginWithGoogle(params.accessToken);
        console.log('[GOOGLE-AUTH-SCREEN] loginWithGoogle OK, navegando para /');
        router.replace('/');
      } catch (err: any) {
        console.log('[GOOGLE-AUTH-SCREEN] ERRO loginWithGoogle:', err?.message, err);
        const msg = err?.message || '';
        if (msg.includes('GOOGLE_NO_ACCOUNT')) {
          alert('Conta nao encontrada', 'Nenhuma conta encontrada com este email Google. Cadastre-se primeiro.');
        } else {
          alert('Erro', 'Erro ao processar login com Google.');
        }
        router.replace('/auth/login');
      }
      return;
    }

    if (params.mode === 'login' && params.token && params.user) {
      // Formato antigo: JWT + user direto da API
      console.log('[GOOGLE-AUTH-SCREEN] Login mode com token+user (formato antigo), chamando setAuthData...');
      try {
        const userData = JSON.parse(params.user);
        await setAuthData(params.token, userData);
        console.log('[GOOGLE-AUTH-SCREEN] setAuthData OK, navegando para /');
        router.replace('/');
      } catch (err: any) {
        console.log('[GOOGLE-AUTH-SCREEN] ERRO setAuthData:', err?.message);
        alert('Erro', 'Erro ao processar login com Google.');
        router.replace('/auth/login');
      }
      return;
    }

    if (params.mode === 'register' && params.name && params.email) {
      console.log('[GOOGLE-AUTH-SCREEN] Register mode, redirecionando para register');
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

    // Fallback
    console.log('[GOOGLE-AUTH-SCREEN] FALLBACK - nenhuma condição matched, voltando para login');
    console.log('[GOOGLE-AUTH-SCREEN] mode:', params.mode, 'accessToken?', !!params.accessToken, 'name?', !!params.name);
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
