import { useSubscription } from '@apollo/client';
import { PRODUCT_UPDATED } from '../lib/graphql/subscriptions';
import { apolloClient } from '../lib/apollo';

/**
 * Global hook that listens to PRODUCT_UPDATED subscription (all stores)
 * and updates Apollo cache so prices refresh instantly everywhere.
 */
export function useProductSync() {
  useSubscription(PRODUCT_UPDATED, {
    onData: ({ data: subData }) => {
      const product = subData?.data?.productUpdated;
      if (!product?.id) return;

      // Write the updated product fields directly to the cache.
      // Apollo normalizes by __typename + id, so any query referencing
      // this product will automatically show the new price.
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
}
