import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';

const DEV_HOST = Platform.OS === 'web' ? 'localhost' : '192.168.0.143';
const PROD_URL = 'https://delivery-api-fdc4.onrender.com';
const NGROK_URL = 'https://acrimoniously-nondisciplinary-emory.ngrok-free.dev'; // TEMP: local tunnel while Render is suspended

const USE_LOCAL = __DEV__; // Auto: local in dev, prod in production
const USE_NGROK = false; // ngrok only needed for external webhooks (Pagar.me)

const BASE_URL = USE_NGROK ? NGROK_URL : USE_LOCAL ? `http://${DEV_HOST}:3000` : PROD_URL;
const API_URL = `${BASE_URL}/graphql`;
const WS_URL = `${USE_NGROK ? 'wss://acrimoniously-nondisciplinary-emory.ngrok-free.dev' : USE_LOCAL ? `ws://${DEV_HOST}:3000` : 'wss://delivery-api-fdc4.onrender.com'}/graphql`;

const httpLink = createHttpLink({
  uri: API_URL,
});

const authLink = setContext(async (_, { headers }) => {
  // C2: Read token from SecureStore instead of AsyncStorage
  const token = await SecureStore.getItemAsync('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'apollo-require-preflight': 'true',
    },
  };
});

let wsLink: GraphQLWsLink | null = null;
try {
  wsLink = new GraphQLWsLink(
    createClient({
      url: WS_URL,
      retryAttempts: 5,
      shouldRetry: () => true,
      keepAlive: 10000,
      connectionParams: async () => {
        const token = await SecureStore.getItemAsync('token');
        return { authorization: token ? `Bearer ${token}` : '' };
      },
      on: {
        connected: () => console.log('[WS] Connected to', WS_URL),
        closed: (event: any) => console.log('[WS] Closed:', event?.code, event?.reason),
        error: (err: any) => console.log('[WS] Error:', err?.message || err),
      },
    }),
  );
} catch {
  // WebSocket not available
}

let sessionExpiredHandled = false;
const errorLink = onError(({ graphQLErrors }) => {
  const sessionExpired = graphQLErrors?.some(
    (e) => e.message?.includes('SESSION_EXPIRED') || e.extensions?.code === 'UNAUTHENTICATED'
  );
  if (sessionExpired && !sessionExpiredHandled) {
    sessionExpiredHandled = true;
    // Silent logout — the subscription handles the user-facing alert
    Promise.all([SecureStore.deleteItemAsync('token'), AsyncStorage.removeItem('user')]).then(() => {
      sessionExpiredHandled = false;
      router.replace('/auth/login');
    });
  }
});

const link = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      authLink.concat(httpLink),
    )
  : authLink.concat(httpLink);

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        myOrders: { merge: (_existing, incoming) => incoming },
        myDeliveries: { merge: (_existing, incoming) => incoming },
        availableDeliveries: { merge: (_existing, incoming) => incoming },
        storeOrders: { merge: (_existing, incoming) => incoming },
        popularProducts: { merge: (_existing, incoming) => incoming },
        activePromotions: { merge: (_existing, incoming) => incoming },
      },
    },
  },
});

export const apolloClient = new ApolloClient({
  link: errorLink.concat(link),
  cache,
});
