import { useSubscription } from '@apollo/client';
import { PRODUCT_UPDATED, PRODUCT_DELETED } from '../lib/graphql/subscriptions';
import { apolloClient } from '../lib/apollo';
import { useAuth } from '../contexts/AuthContext';
import { emitProductUpdated, emitProductDeleted } from '../lib/productEvents';

/**
 * Global hook that listens to PRODUCT_UPDATED/PRODUCT_DELETED subscriptions
 * and updates Apollo cache so prices refresh instantly everywhere.
 *
 * KAN-238: as duas subscriptions rodavam sem guard, mantendo conexao WS aberta
 * mesmo com o usuario deslogado (e gerando erro de auth no servidor). O
 * `skip: !user` alinha com o padrao ja usado no CartContext e no
 * useOrderNotifications.
 *
 * Perf (F2): este e o UNICO assinante WS de produto do app. Alem de patchear o
 * cache (que propaga para toda query normalizada), re-emite o evento via
 * productEvents para estados locais (ex.: itens do carrinho) — eliminando as
 * subscriptions duplicadas que existiam no CartContext e no store/[id].
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

      emitProductUpdated(product);
    },
  });

  useSubscription(PRODUCT_DELETED, {
    skip: !user,
    onData: ({ data: subData }) => {
      const deleted = subData?.data?.productDeleted;
      if (!deleted?.id) return;
      apolloClient.cache.evict({ id: apolloClient.cache.identify({ __typename: 'Product', id: deleted.id }) });
      apolloClient.cache.gc();
      emitProductDeleted(deleted.id);
    },
  });
}
