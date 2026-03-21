import { useSubscription } from '@apollo/client';
import { PRODUCT_UPDATED, PRODUCT_DELETED } from '../lib/graphql/subscriptions';
import { apolloClient } from '../lib/apollo';

/**
 * Global hook that listens to PRODUCT_UPDATED/PRODUCT_DELETED subscriptions
 * and updates Apollo cache so prices refresh instantly everywhere.
 */
export function useProductSync() {
  useSubscription(PRODUCT_UPDATED, {
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
    onData: ({ data: subData }) => {
      const deleted = subData?.data?.productDeleted;
      if (!deleted?.id) return;
      apolloClient.cache.evict({ id: apolloClient.cache.identify({ __typename: 'Product', id: deleted.id }) });
      apolloClient.cache.gc();
    },
  });
}
