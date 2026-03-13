import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { StatusBar } from 'expo-status-bar';
import { apolloClient } from '../src/lib/apollo';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import { AlertProvider } from '../src/contexts/AlertContext';
import { LocationProvider } from '../src/contexts/LocationContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { useOrderNotifications } from '../src/hooks/useOrderNotifications';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

function NotificationListener() {
  useOrderNotifications();
  usePushNotifications();
  return null;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider>
        <AuthProvider>
          <AlertProvider>
            <LocationProvider>
              <CartProvider>
                <NotificationListener />
                <ThemedStatusBar />
                <Stack screenOptions={{ headerShown: false }} />
              </CartProvider>
            </LocationProvider>
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}
