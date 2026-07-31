import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useSubscription, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { GET_STORE, IS_FOLLOWING_STORE, GET_FOLLOWER_COUNT } from '../../src/lib/graphql/queries';
import { FOLLOW_STORE, UNFOLLOW_STORE } from '../../src/lib/graphql/mutations';
import { STORE_UPDATED } from '../../src/lib/graphql/subscriptions';
import { useCart } from '../../src/contexts/CartContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../src/theme';
import { imageCachePolicy } from '../../src/lib/deviceTier'; // Perf (F0)

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id, productId } = useLocalSearchParams<{ id: string; productId?: string }>();
  const { data, loading, refetch } = useQuery(GET_STORE, { variables: { id } });

  // Follow system
  const { data: followData, refetch: refetchFollow } = useQuery(IS_FOLLOWING_STORE, {
    variables: { storeId: id },
    skip: !user,
  });
  const { data: followerData, refetch: refetchFollowers } = useQuery(GET_FOLLOWER_COUNT, {
    variables: { storeId: id },
  });
  const [followMut] = useMutation(FOLLOW_STORE);
  const [unfollowMut] = useMutation(UNFOLLOW_STORE);
  const isFollowing = followData?.isFollowingStore ?? false;
  const followerCount = followerData?.followerCount ?? 0;

  async function toggleFollow() {
    if (!user) return;
    try {
      if (isFollowing) {
        await unfollowMut({ variables: { storeId: id } });
      } else {
        await followMut({ variables: { storeId: id } });
      }
      refetchFollow();
      refetchFollowers();
    } catch {}
  }

  // Real-time: refresh when the STORE itself changes (name, isOpen, fees...).
  // Perf (F2): a subscription PRODUCT_UPDATED que existia aqui foi removida — o
  // useProductSync global ja patcheia price/promotionalPrice/name/imageUrl/
  // isAvailable/stock direto no cache normalizado, e o Apollo propaga pra esta
  // tela sozinho. Antes, CADA mudanca de 1 produto re-baixava a loja INTEIRA
  // (todos os produtos + servicos + categorias).
  useSubscription(STORE_UPDATED, {
    variables: { storeId: id },
    onData: () => { refetch(); },
  });
  const { addItem, itemCount } = useCart();
  const { alert } = useAlert();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [weightGrams, setWeightGrams] = useState(500);
  // UX: busca dentro da loja — catalogo grande sem busca obrigava a rolar tudo.
  // Filtro 100% local (o catalogo ja esta carregado), zero rede.
  const [storeQuery, setStoreQuery] = useState('');

  const store = data?.store;
  // Perf (F3): derivados memoizados. Antes products/services/sections eram
  // recalculados (filter/map/Map) a CADA render — inclusive a cada toque de
  // +/- de quantidade no modal, que re-filtrava o catalogo inteiro.
  const allProducts = useMemo(() => store?.products || [], [store?.products]);
  const allServices = useMemo(
    () => (store?.services || []).filter((s: any) => s.isActive),
    [store?.services],
  );
  const isServiceStore = store?.storeType === 'SERVICES';

  const openProductModal = useCallback((product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    setWeightGrams(500);
  }, []);

  // Auto-open product modal when navigating from home screen
  useEffect(() => {
    if (productId && allProducts.length > 0 && !selectedProduct) {
      const product = allProducts.find((p: any) => p.id === productId);
      if (product) openProductModal(product);
    }
  }, [productId, allProducts.length]);

  // Build sections based on store type (memoizado — so muda quando o catalogo
  // ou a busca interna mudam)
  const sections = useMemo(() => {
    const built: { title: string; data: any[] }[] = [];
    const categories = store?.categories || [];

    // Busca interna: filtra por nome/descricao antes de agrupar
    const q = storeQuery.trim().toLowerCase();
    const matches = (i: any) =>
      !q ||
      (i.name || '').toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q);
    const products = allProducts.filter(matches);
    const services = allServices.filter(matches);

    if (isServiceStore) {
      // Service store: group services by category
      const serviceCategories = [...new Map(
        services.filter((s: any) => s.category).map((s: any) => [s.category.id, s.category])
      ).values()];

      serviceCategories.forEach((cat: any) => {
        built.push({
          title: cat.name,
          data: services.filter((s: any) => s.category?.id === cat.id),
        });
      });

      const uncategorizedServices = services.filter((s: any) => !s.category);
      if (uncategorizedServices.length > 0) {
        built.push({ title: 'Outros', data: uncategorizedServices });
      }

      if (built.length === 0 && services.length > 0) {
        built.push({ title: 'Servicos', data: services });
      }
    } else {
      // Product store: group products by category
      categories.forEach((cat: any) => {
        const catProducts = products.filter((p: any) => p.category?.id === cat.id);
        if (catProducts.length > 0) {
          built.push({ title: cat.name, data: catProducts });
        }
      });

      const uncategorized = products.filter((p: any) => !p.category);
      if (uncategorized.length > 0) {
        built.push({ title: 'Outros', data: uncategorized });
      }

      if (built.length === 0 && products.length > 0) {
        built.push({ title: 'Produtos', data: products });
      }
    }
    return built;
  }, [store?.categories, allProducts, allServices, isServiceStore, storeQuery]);

  if (loading || !store) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textLight }]}>Carregando...</Text>
      </View>
    );
  }

  function confirmAdd() {
    if (!selectedProduct) return;
    const info = { productId: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.promotionalPrice ?? selectedProduct.price, imageUrl: selectedProduct.imageUrl, isVariableWeight: selectedProduct.isVariableWeight, storeId: store.id, storeName: store.name };
    if (selectedProduct.isVariableWeight) {
      addItem(info, 1, undefined, weightGrams);
    } else {
      addItem(info, quantity);
    }
    setSelectedProduct(null);
  }

  const selectedPrice = selectedProduct
    ? Number(selectedProduct.promotionalPrice || selectedProduct.price)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.storeInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.storeName, { color: colors.text }]}>{store.name}</Text>
            {store.verificationLevel && store.verificationLevel !== 'NONE' && (
              <Text style={{ fontSize: 12 }}>
                {store.verificationLevel === 'BRONZE' ? '🥉' : store.verificationLevel === 'SILVER' ? '🥈' : store.verificationLevel === 'GOLD' ? '🥇' : '💎'}
              </Text>
            )}
          </View>
          <View style={styles.storeDetails}>
            <Text style={[styles.detailText, { color: colors.textLight }]}>{store.estimatedDeliveryMinutes} min</Text>
            <Text style={[styles.detailDot, { color: colors.gray }]}>•</Text>
            <Text style={[styles.detailText, { color: colors.textLight }]}>
              {Number(store.deliveryFee) > 0 ? `R$ ${Number(store.deliveryFee).toFixed(2)}` : 'Entrega gratis'}
            </Text>
            {Number(store.minimumOrder) > 0 && (
              <>
                <Text style={[styles.detailDot, { color: colors.gray }]}>•</Text>
                <Text style={[styles.detailText, { color: colors.textLight }]}>Min R$ {Number(store.minimumOrder).toFixed(2)}</Text>
              </>
            )}
          </View>
          {followerCount > 0 && (
            <Text style={{ fontSize: 10, color: colors.gray, marginTop: 2 }}>
              {followerCount} {followerCount === 1 ? 'seguidor' : 'seguidores'}
            </Text>
          )}
        </View>
        {user && (
          <TouchableOpacity
            style={[
              styles.followButton,
              { backgroundColor: isFollowing ? colors.grayLight : colors.primary },
            ]}
            onPress={toggleFollow}
          >
            <Ionicons
              name={isFollowing ? 'heart' : 'heart-outline'}
              size={16}
              color={isFollowing ? colors.primary : '#FFFFFF'}
            />
            <Text style={[styles.followButtonText, { color: isFollowing ? colors.primary : '#FFFFFF' }]}>
              {isFollowing ? 'Seguindo' : 'Seguir'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!store.isOpen && (
        <View style={[styles.closedBanner, { backgroundColor: colors.danger + '15' }]}>
          <Ionicons name="time-outline" size={16} color={colors.danger} />
          <Text style={[styles.closedText, { color: colors.danger }]}>Loja fechada no momento</Text>
        </View>
      )}

      {/* UX: busca dentro da loja (filtro local, zero rede) */}
      <View style={[styles.storeSearchWrap, { backgroundColor: colors.card, borderBottomColor: colors.grayLight }]}>
        <View style={[styles.storeSearchBox, { backgroundColor: colors.grayLight }]}>
          <Ionicons name="search" size={16} color={colors.gray} />
          <TextInput
            style={[styles.storeSearchInput, { color: colors.text }]}
            placeholder={isServiceStore ? 'Buscar servico nesta loja...' : 'Buscar produto nesta loja...'}
            placeholderTextColor={colors.gray}
            value={storeQuery}
            onChangeText={setStoreQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {storeQuery.length > 0 && (
            <TouchableOpacity onPress={() => setStoreQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={storeQuery.trim() ? (
          <View style={{ alignItems: 'center', paddingTop: 48, gap: 8 }}>
            <Ionicons name="search-outline" size={44} color={colors.grayLight} />
            <Text style={{ fontSize: fonts.regular, color: colors.textLight, textAlign: 'center' }}>
              Nada encontrado para "{storeQuery.trim()}"
            </Text>
            <TouchableOpacity onPress={() => setStoreQuery('')}>
              <Text style={{ fontSize: fonts.small, color: colors.primary, fontWeight: '600' }}>Limpar busca</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          if (isServiceStore) {
            // Service card
            const servicePrice = item.price ? Number(item.price) : null;
            return (
              <View style={[styles.productCard, { backgroundColor: colors.card }]}>
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
                  {item.description ? (
                    <Text style={[styles.productDesc, { color: colors.textLight }]} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  <View style={styles.priceRow}>
                    {item.requiresQuote ? (
                      <Text style={[styles.price, { color: colors.warning }]}>Solicitar orcamento</Text>
                    ) : servicePrice ? (
                      <Text style={[styles.price, { color: colors.primary }]}>R$ {servicePrice.toFixed(2)}</Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="time-outline" size={14} color={colors.gray} />
                    <Text style={{ fontSize: 12, color: colors.gray }}>{item.estimatedDuration} min</Text>
                  </View>
                  {store.isOpen && item.isAvailable && (
                    <TouchableOpacity
                      style={[styles.bookBtn, { backgroundColor: item.requiresQuote ? colors.warning : colors.primary }]}
                      onPress={() => {
                        if (item.requiresQuote) {
                          router.push(`/appointment/quote?storeId=${store.id}&serviceId=${item.id}&serviceName=${encodeURIComponent(item.name)}`);
                        } else {
                          router.push(`/appointment/book?storeId=${store.id}&serviceId=${item.id}&serviceName=${encodeURIComponent(item.name)}&servicePrice=${item.price || 0}&serviceDuration=${item.estimatedDuration}`);
                        }
                      }}
                    >
                      <Ionicons name={item.requiresQuote ? 'chatbubble-outline' : 'calendar-outline'} size={14} color="#fff" />
                      <Text style={styles.bookBtnText}>{item.requiresQuote ? 'Orcamento' : 'Agendar'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.productRight}>
                  {item.imageUrl ? (
                    <TouchableOpacity activeOpacity={0.8} onPress={() => setZoomedImage(item.imageUrl)}>
                      <Image source={item.imageUrl} style={styles.productImage} cachePolicy={imageCachePolicy} recyclingKey={item.id} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.productImage, styles.productImagePlaceholder, { backgroundColor: colors.grayLight }]}>
                      <Ionicons name="cut-outline" size={18} color={colors.gray} />
                    </View>
                  )}
                </View>
                {!item.isAvailable && (
                  <View style={[styles.unavailable, { backgroundColor: colors.card + 'BF' }]}>
                    <View style={[styles.unavailableBadge, { backgroundColor: colors.danger }]}>
                      <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.unavailableText}>Indisponivel no momento</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          }

          // Product card (original)
          const itemPrice = Number(item.promotionalPrice || item.price);
          return (
          <TouchableOpacity
            style={[styles.productCard, { backgroundColor: colors.card }]}
            onPress={() => store.isOpen && openProductModal(item)}
            disabled={!store.isOpen || !item.isAvailable}
          >
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
              {item.description ? (
                <Text style={[styles.productDesc, { color: colors.textLight }]} numberOfLines={2}>{item.description}</Text>
              ) : null}
              <View style={styles.priceRow}>
                {item.isVariableWeight ? (
                  <Text style={[styles.price, { color: colors.primary }]}>R$ {itemPrice.toFixed(2)}/kg</Text>
                ) : item.promotionalPrice ? (
                  <>
                    <Text style={[styles.priceOld, { color: colors.gray }]}>R$ {Number(item.price).toFixed(2)}</Text>
                    <Text style={[styles.price, { color: colors.primary }]}>R$ {itemPrice.toFixed(2)}</Text>
                  </>
                ) : (
                  <Text style={[styles.price, { color: colors.primary }]}>R$ {itemPrice.toFixed(2)}</Text>
                )}
                {!item.isVariableWeight && item.unit && <Text style={[styles.unit, { color: colors.textLight }]}>/ {item.unit}</Text>}
              </View>
            </View>
            <View style={styles.productRight}>
              {item.imageUrl ? (
                <TouchableOpacity activeOpacity={0.8} onPress={() => setZoomedImage(item.imageUrl)}>
                  <Image source={item.imageUrl} style={styles.productImage} cachePolicy={imageCachePolicy} recyclingKey={item.id} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.productImage, styles.productImagePlaceholder, { backgroundColor: colors.grayLight }]}>
                  <Ionicons name="fast-food-outline" size={18} color={colors.gray} />
                </View>
              )}
              {store.isOpen && item.isAvailable && !item.isVariableWeight && (
                <TouchableOpacity
                  style={[styles.quickAddBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    addItem({ productId: item.id, name: item.name, price: item.promotionalPrice ?? item.price, imageUrl: item.imageUrl, storeId: store.id, storeName: store.name }, 1);
                  }}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
            {!item.isAvailable && (
              <View style={[styles.unavailable, { backgroundColor: colors.card + 'BF' }]}>
                <View style={[styles.unavailableBadge, { backgroundColor: colors.danger }]}>
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.unavailableText}>Indisponivel no momento</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          );
        }}
      />

      {itemCount > 0 && (
        <TouchableOpacity style={[styles.cartBar, { bottom: insets.bottom + 16, backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)/cart')}>
          <View style={[styles.cartBadge, { backgroundColor: colors.primaryDark }]}>
            <Text style={styles.cartBadgeText}>{itemCount}</Text>
          </View>
          <Text style={styles.cartBarText}>Ver carrinho</Text>
        </TouchableOpacity>
      )}

      {/* Modal de imagem ampliada */}
      <Modal visible={!!zoomedImage} transparent animationType="fade" onRequestClose={() => setZoomedImage(null)}>
        <Pressable style={styles.imageModalOverlay} onPress={() => setZoomedImage(null)}>
          <View style={styles.imageModalContainer}>
            {zoomedImage && (
              <Image source={zoomedImage} style={styles.imageModalImage} contentFit="contain" cachePolicy={imageCachePolicy} />
            )}
          </View>
          <TouchableOpacity style={[styles.imageModalClose, { top: insets.top + 8 }]} onPress={() => setZoomedImage(null)}>
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </Pressable>
      </Modal>

      {/* Modal de adicionar ao carrinho */}
      <Modal visible={!!selectedProduct} transparent animationType="slide" onRequestClose={() => setSelectedProduct(null)}>
        <Pressable style={styles.addModalOverlay} onPress={() => setSelectedProduct(null)}>
          <Pressable style={[styles.addModalSheet, { paddingBottom: insets.bottom + 16, backgroundColor: colors.card }]} onPress={() => {}}>
            {selectedProduct && (
              <>
                {/* Imagem */}
                {selectedProduct.imageUrl && (
                  <TouchableOpacity activeOpacity={0.9} onPress={() => { setSelectedProduct(null); setTimeout(() => setZoomedImage(selectedProduct.imageUrl), 300); }}>
                    <Image source={selectedProduct.imageUrl} style={styles.addModalImage} cachePolicy={imageCachePolicy} />
                  </TouchableOpacity>
                )}

                {/* Info */}
                <View style={styles.addModalInfo}>
                  <Text style={[styles.addModalName, { color: colors.text }]}>{selectedProduct.name}</Text>
                  {selectedProduct.description ? (
                    <Text style={[styles.addModalDesc, { color: colors.textLight }]}>{selectedProduct.description}</Text>
                  ) : null}
                  <View style={styles.addModalPriceRow}>
                    {selectedProduct.isVariableWeight ? (
                      <Text style={[styles.addModalUnit, { color: colors.textLight }]}>R$ {Number(selectedProduct.promotionalPrice || selectedProduct.price).toFixed(2)}/kg</Text>
                    ) : selectedProduct.promotionalPrice ? (
                      <>
                        <Text style={[styles.addModalPriceOld, { color: colors.gray }]}>R$ {Number(selectedProduct.price).toFixed(2)}</Text>
                        <Text style={[styles.addModalPrice, { color: colors.primary }]}>R$ {Number(selectedProduct.promotionalPrice).toFixed(2)}</Text>
                      </>
                    ) : (
                      <Text style={[styles.addModalPrice, { color: colors.primary }]}>R$ {Number(selectedProduct.price).toFixed(2)}</Text>
                    )}
                    {!selectedProduct.isVariableWeight && selectedProduct.unit && <Text style={[styles.addModalUnit, { color: colors.textLight }]}>/ {selectedProduct.unit}</Text>}
                  </View>
                </View>

                {/* Quantidade / Peso */}
                {selectedProduct.isVariableWeight ? (
                  <View style={[styles.quantityRow, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.quantityBtn, { backgroundColor: colors.grayLight }, weightGrams <= 100 && styles.quantityBtnDisabled]}
                      onPress={() => weightGrams > 50 && setWeightGrams(weightGrams - 50)}
                      disabled={weightGrams <= 50}
                    >
                      <Ionicons name="remove" size={18} color={weightGrams <= 50 ? colors.gray : colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, { color: colors.text }]}>
                      {weightGrams >= 1000 ? `${(weightGrams / 1000).toFixed(weightGrams % 1000 === 0 ? 0 : 1)}kg` : `${weightGrams}g`}
                    </Text>
                    <TouchableOpacity
                      style={[styles.quantityBtn, { backgroundColor: colors.grayLight }]}
                      onPress={() => setWeightGrams(weightGrams + 50)}
                    >
                      <Ionicons name="add" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.quantityRow, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.quantityBtn, { backgroundColor: colors.grayLight }, quantity <= 1 && styles.quantityBtnDisabled]}
                      onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <Ionicons name="remove" size={18} color={quantity <= 1 ? colors.gray : colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
                    <TouchableOpacity
                      style={[styles.quantityBtn, { backgroundColor: colors.grayLight }]}
                      onPress={() => setQuantity(quantity + 1)}
                    >
                      <Ionicons name="add" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Botao confirmar */}
                <TouchableOpacity style={[styles.addModalButton, { backgroundColor: colors.primary }]} onPress={confirmAdd} activeOpacity={0.8}>
                  <Text style={styles.addModalButtonText}>Adicionar</Text>
                  {selectedProduct.isVariableWeight ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.addModalButtonPrice}>R$ {((selectedPrice * weightGrams) / 1000).toFixed(2)}</Text>
                      <Text style={[styles.addModalButtonPrice, { fontSize: 10, opacity: 0.85 }]}>(R$ {selectedPrice.toFixed(2)}/kg)</Text>
                    </View>
                  ) : (
                    <Text style={styles.addModalButtonPrice}>R$ {(selectedPrice * quantity).toFixed(2)}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: fonts.regular },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    paddingTop: 56,
  },
  backButton: { padding: 4 },
  storeInfo: { flex: 1 },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: { fontSize: fonts.tiny, fontWeight: '700' },
  storeName: { fontSize: fonts.xlarge, fontWeight: 'bold' },
  storeDetails: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  detailText: { fontSize: fonts.small },
  detailDot: {},
  storeSearchWrap: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  storeSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  storeSearchInput: {
    flex: 1,
    fontSize: fonts.regular,
    paddingVertical: 0,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
  },
  closedText: { fontSize: fonts.small, fontWeight: '600' },
  list: { padding: 12, paddingBottom: 100 },
  sectionTitle: { fontSize: fonts.large, fontWeight: 'bold', marginTop: 12, marginBottom: 12 },
  productCard: {
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    marginBottom: 8,
    position: 'relative',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: fonts.regular, fontWeight: '600' },
  productDesc: { fontSize: fonts.small, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  price: { fontSize: fonts.regular, fontWeight: 'bold' },
  priceOld: { fontSize: fonts.small, textDecorationLine: 'line-through' },
  unit: { fontSize: fonts.small },
  productRight: { alignItems: 'center', marginLeft: 12 },
  productImage: { width: 72, height: 72, borderRadius: 8 },
  productImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  quickAddBtn: {
    borderRadius: 10,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  unavailable: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  unavailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unavailableText: { color: '#FFFFFF', fontWeight: '700', fontSize: fonts.small },
  cartBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    borderRadius: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: fonts.small },
  cartBarText: { flex: 1, color: '#FFFFFF', fontSize: fonts.regular, fontWeight: 'bold', marginLeft: 12 },
  cartBarTotal: { color: '#FFFFFF', fontSize: fonts.regular, fontWeight: 'bold' },

  // Modal de imagem ampliada
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    width: screenWidth - 32,
    height: screenWidth - 32,
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageModalClose: {
    position: 'absolute',
    top: 56,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal de adicionar ao carrinho
  addModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  addModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  addModalImage: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  addModalInfo: {
    padding: 10,
    paddingBottom: 8,
  },
  addModalName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  addModalDesc: {
    fontSize: fonts.regular,
    marginTop: 8,
    lineHeight: 22,
  },
  addModalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  addModalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addModalPriceOld: {
    fontSize: fonts.regular,
    textDecorationLine: 'line-through',
  },
  addModalUnit: {
    fontSize: fonts.regular,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 12,
    marginHorizontal: 14,
    borderTopWidth: 1,
  },
  quantityBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnDisabled: {
    opacity: 0.4,
  },
  quantityText: {
    fontSize: 22,
    fontWeight: 'bold',
    minWidth: 32,
    textAlign: 'center',
  },
  addModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 14,
    borderRadius: 10,
    padding: 12,
  },
  addModalButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  addModalButtonPrice: {
    color: '#FFFFFF',
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
});
