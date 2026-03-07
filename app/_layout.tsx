import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { StatusBar } from 'expo-status-bar';
import { apolloClient } from '../src/lib/apollo';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import { useOrderNotifications } from '../src/hooks/useOrderNotifications';

function NotificationListener() {
  useOrderNotifications();
  return null;
}

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <CartProvider>
          <NotificationListener />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </CartProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
