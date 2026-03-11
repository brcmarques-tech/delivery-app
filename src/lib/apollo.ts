import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://delivery-api-fdc4.onrender.com/graphql';
const WS_URL = 'wss://delivery-api-fdc4.onrender.com/graphql';

const httpLink = createHttpLink({
  uri: API_URL,
});

const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem('token');
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
        const token = await AsyncStorage.getItem('token');
        return { authorization: token ? `Bearer ${token}` : '' };
      },
      on: {
        connected: () => console.log('[WS] Connected'),
        error: (err) => console.log('[WS] Error', err),
        closed: () => console.log('[WS] Closed'),
      },
    }),
  );
} catch (err) {
  console.log('[WS] Failed to create wsLink', err);
}

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
  link,
  cache: new InMemoryCache(),
});
