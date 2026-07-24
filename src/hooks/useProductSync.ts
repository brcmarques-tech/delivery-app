import { useSubscription } from '@apollo/client';
import { PRODUCT_UPDATED, PRODUCT_DELETED } from '../lib/graphql/subscriptions';
import { apolloClient } from '../lib/apollo';
import { useAuth } from '../contexts/AuthContext';

/**
 * Global hook that listens to PRODUCT_UPDATED/PRODUCT_DELETED subscriptions
 * and updates Apollo cache so prices refresh instantly everywhere.
 *
 * KAN-238: as duas subscriptions rodavam sem guard, mantendo conexao WS aberta
 * mesmo com o usuario deslogado (e gerando erro de auth no servidor). O
 * `skip: !user` alinha com o padrao ja usado no CartContext e no
 * useOrderNotifications.
 */
export function useProductSync() {
  const { user } = useAuth();

  useSubscription(PRODUCT_UPDATED, {
    skip: !user,
    onData: ({ data: subData }) => {
      const product = subData?.data?.productUpdated;
      if (!product?.id) return;

      apolloClient.cache.modify({
        id: apolloClient.cache.identify({ __typename: 'Product', id: product.id }),
        fields: {
          price: () => product.price,
          promotionalPrice: () => product.promotionalPrice,
          name: () => product.name,
          imageUrl: () => product.imageUrl,
          isAvailable: () => product.isAvailable,
          stock: () => product.stock,
        },
      });
    },
  });

  useSubscription(PRODUCT_DELETED, {
    skip: !user,
    onData: ({ data: subData }) => {
      const deleted = subData?.data?.productDeleted;
      if (!deleted?.id) return;
      apolloClient.cache.evict({ id: apolloClient.cache.identify({ __typename: 'Product', id: deleted.id }) });
      apolloClient.cache.gc();
    },
  });
}
