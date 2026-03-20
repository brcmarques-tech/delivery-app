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

const USE_LOCAL = __DEV__;

const BASE_URL = USE_LOCAL ? `http://${DEV_HOST}:3000` : PROD_URL;
const API_URL = `${BASE_URL}/graphql`;
const WS_URL = `${USE_LOCAL ? `ws://${DEV_HOST}:3000` : 'wss://delivery-api-fdc4.onrender.com'}/graphql`;

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
    },
  };
});

let wsLink: GraphQLWsLink | null = null;
try {
  wsLink = new GraphQLWsLink(
    createClient({
      url: WS_URL,
      retryAttempts: 5,
      connectionParams: async () => {
        const token = await SecureStore.getItemAsync('token');
        return { authorization: token ? `Bearer ${token}` : '' };
      },
      on: {},
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

export const apolloClient = new ApolloClient({
  link: errorLink.concat(link),
  cache: new InMemoryCache(),
});
