import * as Sentry from '@sentry/react-native';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Image as ExpoImage } from 'expo-image';
import { apolloClient } from '../src/lib/apollo';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import { AlertProvider } from '../src/contexts/AlertContext';
import { LocationProvider } from '../src/contexts/LocationContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { useOrderNotifications } from '../src/hooks/useOrderNotifications';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { useProductSync } from '../src/hooks/useProductSync';
import { DeliveryConfirmationModal } from '../src/components/DeliveryConfirmationModal';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

// KAN-221: era process.env.SENTRY_DSN, sem o prefixo EXPO_PUBLIC_ — no Expo so
// variaveis EXPO_PUBLIC_* sao inlinadas no bundle, entao o dsn ficava undefined
// e NENHUM erro era reportado em producao.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN && !__DEV__,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.1,
});

// Keep native splash visible while app loads
SplashScreen.preventAutoHideAsync().catch(() => {});

function NotificationListener() {
  useOrderNotifications();
  usePushNotifications();
  useProductSync();
  return null;
}

// Perf (F0): quando o SO avisa que a memoria apertou (iOS: memoryWarning),
// despeja o cache de bitmap decodificado do expo-image — a imagem continua no
// cache de DISCO, entao re-exibir custa so um decode, nao rede. Garante que o
// app cede RAM antes de o sistema mata-lo.
function MemoryPressureHandler() {
  useEffect(() => {
    const sub = AppState.addEventListener('memoryWarning' as any, () => {
      ExpoImage.clearMemoryCache().catch(() => {});
    });
    return () => sub.remove();
  }, []);
  return null;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <ThemeProvider>
          <AuthProvider>
            <AlertProvider>
              <LocationProvider>
                <CartProvider>
                  <NotificationListener />
                  <MemoryPressureHandler />
                  <DeliveryConfirmationModal />
                  <ThemedStatusBar />
                  <Stack screenOptions={{ headerShown: false }} />
                </CartProvider>
              </LocationProvider>
            </AlertProvider>
          </AuthProvider>
        </ThemeProvider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}
