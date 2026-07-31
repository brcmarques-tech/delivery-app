import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureItem, deleteSecureItem } from './secureStorage';
import { devLog } from './devLog';
import { fetchWithTimeout, DEFAULT_TIMEOUT_MS } from './fetchWithTimeout';
import { httpBaseUrl, wsBaseUrl } from './apiHost';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';

// KAN-255: montagem da URL centralizada em src/lib/apiHost.ts (era duplicada em
// tres arquivos, dois deles com IP de LAN hardcoded e desatualizado).
const API_URL = `${httpBaseUrl()}/graphql`;
const WS_URL = `${wsBaseUrl()}/graphql`;

// KAN-240: sem timeout, uma rede ruim deixa a promise pendente indefinidamente.
// Helper compartilhado em src/lib/fetchWithTimeout.ts.
const HTTP_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;

const httpLink = createHttpLink({
  uri: API_URL,
  fetch: ((input: any, init?: any) => fetchWithTimeout(input, init)) as any,
});

const authLink = setContext(async (_, { headers }) => {
  // C2: Read token from SecureStore instead of AsyncStorage
  const token = await getSecureItem('token');
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
        const token = await getSecureItem('token');
        return { authorization: token ? `Bearer ${token}` : '' };
      },
      on: {
        // Perf (F7): devLog — em rede instavel este handler dispara em loop de
        // retry; console.log cru custava em producao.
        error: (err: any) => devLog('[WS] Error:', err?.message || err),
      },
    }),
  );
} catch {
  // WebSocket not available
}

let sessionExpiredHandled = false;
const AUTH_OPERATIONS = ['LoginApp', 'RegisterApp', 'GoogleAuthApp', 'RegisterAppWithGoogle'];
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  // Ignore UNAUTHENTICATED from login/register mutations — those are expected credential errors
  if (AUTH_OPERATIONS.includes(operation.operationName)) return;

  // KAN-240: networkError era completamente ignorado — ficar offline no meio de
  // uma operacao nao sinalizava nada. Agora fica registrado (so em dev, via
  // devLog, para nao vazar em producao — ver KAN-223), distinguindo timeout.
  if (networkError) {
    const isTimeout = (networkError as any)?.name === 'AbortError';
    devLog(
      `[APOLLO] networkError em ${operation.operationName}:`,
      isTimeout ? `timeout apos ${HTTP_TIMEOUT_MS}ms` : networkError.message,
    );
  }

  const sessionExpired = graphQLErrors?.some(
    (e) => e.message?.includes('SESSION_EXPIRED') || e.extensions?.code === 'UNAUTHENTICATED'
  );
  if (sessionExpired && !sessionExpiredHandled) {
    sessionExpiredHandled = true;
    // Silent logout — the subscription handles the user-facing alert
    Promise.all([deleteSecureItem('token'), AsyncStorage.removeItem('user')]).then(() => {
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


// Perf (F6): merge offset-based compartilhado (equivalente ao offsetLimitPagination).
function offsetMerge(existing: any[] = [], incoming: any[], { args }: any) {
  const offset = args?.offset ?? 0;
  const merged = existing.slice(0);
  for (let i = 0; i < incoming.length; i++) merged[offset + i] = incoming[i];
  return merged;
}

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Perf (F6): merge de paginacao por offset. keyArgs:false = uma lista
        // unica por campo; cada pagina entra na posicao do seu offset (refetch
        // com offset 0 sobrescreve o inicio e preserva o resto ja carregado).
        myOrders: { keyArgs: false, merge: offsetMerge },
        myDeliveries: { keyArgs: false, merge: offsetMerge },
        myAppointments: { keyArgs: false, merge: offsetMerge },
        // Perf (F5/F6): uma lista por (loja, busca); paginas encaixam por offset.
        storeProducts: { keyArgs: ['storeId', 'search', 'categoryId'], merge: offsetMerge },
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
