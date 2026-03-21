import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useQuery, useSubscription } from '@apollo/client';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  GET_ACTIVE_PROMOTIONS,
  GET_POPULAR_PRODUCTS,
  GET_REORDER_SUGGESTIONS,
  GET_FREQUENT_STORES,
  GET_TOP_STORES_WEEKLY,
  GET_FOLLOWED_STORES,
  GET_DELIVERY_PRICING,
} from '../../src/lib/graphql/queries';
import { PROMOTION_UPDATED } from '../../src/lib/graphql/subscriptions';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLocation } from '../../src/contexts/LocationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { fonts } from '../../src/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const { location } = useLocation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: promosData, refetch: refetchPromos, loading: promosLoading } = useQuery(GET_ACTIVE_PROMOTIONS, {
    pollInterval: 120000,
  });
  const { data: popularData, refetch: refetchPopular } = useQuery(GET_POPULAR_PRODUCTS, {
    variables: { limit: 12 },
    pollInterval: 300000,
  });
  const { data: reorderData, refetch: refetchReorder } = useQuery(GET_REORDER_SUGGESTIONS, {
    variables: { limit: 10 },
    pollInterval: 300000,
  });
  const { data: frequentData, refetch: refetchFrequent } = useQuery(GET_FREQUENT_STORES, {
    variables: { limit: 6 },
    pollInterval: 300000,
  });
  const { data: topData, refetch: refetchTop } = useQuery(GET_TOP_STORES_WEEKLY, {
    variables: { limit: 5 },
    pollInterval: 300000,
  });
  const { data: followedData, refetch: refetchFollowed } = useQuery(GET_FOLLOWED_STORES, {
    pollInterval: 300000,
  });
  const { data: pricingData } = useQuery(GET_DELIVERY_PRICING, {
    pollInterval: 3600000,
  });

  const basePrice = pricingData?.deliveryBasePrice ?? 3;
  const pricePerKm = pricingData?.deliveryPricePerKm ?? 1.5;

  useSubscription(PROMOTION_UPDATED, {
    onData: () => { refetchPromos(); },
  });

  const promotions = promosData?.activePromotions || [];
  const popularProducts = popularData?.popularProducts || [];
  const reorderProducts = reorderData?.reorderSuggestions || [];
  const frequentStores = frequentData?.frequentStores || [];
  const topStores = topData?.topStoresWeekly || [];
  const followedStores = followedData?.followedStores || [];

  function calcDeliveryFee(storeLat: number, storeLng: number): number | null {
    if (!location) return null;
    const R = 6371;
    const dLat = (location.latitude - storeLat) * Math.PI / 180;
    const dLng = (location.longitude - storeLng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(storeLat * Math.PI / 180) *
        Math.cos(location.latitude * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    return Math.round((basePrice + distanceKm * pricePerKm) * 100) / 100;
  }

  const refreshing = promosLoading;

  function onRefresh() {
    refetchPromos();
    refetchPopular();
    refetchReorder();
    refetchFrequent();
    refetchTop();
    refetchFollowed();
  }

  function renderProductCard(product: any, size: 'normal' | 'small' = 'normal') {
    const hasPromo = product.promotionalPrice && Number(product.promotionalPrice) < Number(product.price);
    const discount = hasPromo ? Math.round((1 - Number(product.promotionalPrice) / Number(product.price)) * 100) : 0;
    const isSmall = size === 'small';

    return (
      <TouchableOpacity
        key={product.id}
        style={[isSmall ? styles.productCardSmall : styles.productCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/store/${product.storeId}`)}
      >
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={isSmall ? styles.productImageSmall : styles.productImage} />
        ) : (
          <View style={[isSmall ? styles.productImageSmall : styles.productImage, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="cube-outline" size={isSmall ? 20 : 28} color={colors.gray} />
          </View>
        )}
        {hasPromo && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
        <View style={isSmall ? styles.productInfoSmall : styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{product.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
            <Ionicons name="storefront-outline" size={10} color={colors.gray} />
            <Text style={{ fontSize: 10, color: colors.gray }} numberOfLines={1}>{product.storeName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            {hasPromo ? (
              <>
                <Text style={{ fontSize: 10, color: colors.gray, textDecorationLine: 'line-through' }}>
                  R$ {Number(product.price).toFixed(2)}
                </Text>
                <Text style={[styles.productPrice, { color: colors.success }]}>
                  R$ {Number(product.promotionalPrice).toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={[styles.productPrice, { color: colors.text }]}>
                R$ {Number(product.price).toFixed(2)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        {user && user.emailVerified === false && (
          <TouchableOpacity
            style={styles.emailBanner}
            onPress={() => router.push('/verify-email' as any)}
          >
            <Ionicons name="mail-outline" size={18} color="#fff" />
            <Text style={styles.emailBannerText}>Verifique seu email para receber notificacoes</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <View style={styles.logoWrapper}>
              <Text style={styles.logoBcm}>BCM TECH</Text>
              <View style={styles.logoCenter}>
                <Text style={styles.logoDelivery}>Delivery</Text>
                <Text style={[styles.logoApp, { color: colors.textLight }]}>App</Text>
              </View>
            </View>
            <Text style={[styles.greeting, { color: colors.text }]}>Ola, {user?.name?.split(' ')[0]}!</Text>
            <Text style={[styles.headerSub, { color: colors.textLight }]}>O que vai pedir hoje?</Text>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Promotions / Destaques */}
        {promotions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="flame" size={18} color={colors.danger} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Destaques</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {promotions.map((promo: any) => {
                const originalPrice = promo.product?.price;
                const promoPrice = promo.promotionalPrice;
                const discount = originalPrice && promoPrice
                  ? Math.round((1 - promoPrice / originalPrice) * 100) : 0;
                return (
                  <TouchableOpacity
                    key={promo.id}
                    style={[styles.promoCard, { backgroundColor: colors.card }]}
                    onPress={() => router.push(`/promotion/${promo.id}`)}
                  >
                    <View>
                      {(promo.product?.imageUrl || promo.imageUrl) ? (
                        <Image source={{ uri: promo.product?.imageUrl || promo.imageUrl }} style={styles.promoImage} />
                      ) : (
                        <View style={[styles.promoImage, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="megaphone-outline" size={18} color="#FFFFFF" />
                        </View>
                      )}
                      {discount > 0 && (
                        <View style={styles.promoBadge}>
                          <Text style={styles.promoBadgeText}>-{discount}%</Text>
                        </View>
                      )}
                      {promo.store && (
                        <View style={[styles.promoStoreBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                          <Text style={styles.promoStoreText} numberOfLines={1}>{promo.store.name}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.promoInfo}>
                      <Text style={[styles.promoName, { color: colors.text }]} numberOfLines={1}>{promo.title}</Text>
                      {promoPrice && originalPrice ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Text style={{ fontSize: fonts.tiny, color: colors.gray, textDecorationLine: 'line-through' }}>
                            R$ {Number(originalPrice).toFixed(2)}
                          </Text>
                          <Text style={{ fontSize: fonts.regular, fontWeight: '700', color: colors.primary }}>
                            R$ {Number(promoPrice).toFixed(2)}
                          </Text>
                        </View>
                      ) : promoPrice ? (
                        <Text style={{ fontSize: fonts.regular, fontWeight: '700', color: colors.primary, marginTop: 2 }}>
                          R$ {Number(promoPrice).toFixed(2)}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Compre de novo */}
        {reorderProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="refresh-circle" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Compre de novo</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {reorderProducts.map((product: any) => renderProductCard(product, 'small'))}
            </ScrollView>
          </View>
        )}

        {/* Mais vendidos */}
        {popularProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="trending-up" size={18} color={colors.warning} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Mais vendidos</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {popularProducts.map((product: any) => renderProductCard(product))}
            </ScrollView>
          </View>
        )}

        {/* Volta aqui - Frequent stores */}
        {frequentStores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="heart" size={18} color={colors.danger} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Volta aqui</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {frequentStores.map((store: any) => (
                <TouchableOpacity
                  key={store.id}
                  style={[styles.frequentStoreCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push(`/store/${store.id}`)}
                >
                  {store.logoUrl ? (
                    <Image source={{ uri: store.logoUrl }} style={styles.frequentStoreLogo} />
                  ) : (
                    <View style={[styles.frequentStoreLogo, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="storefront-outline" size={18} color={colors.gray} />
                    </View>
                  )}
                  <View style={styles.frequentStoreInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={[styles.frequentStoreName, { color: colors.text }]} numberOfLines={1}>{store.name}</Text>
                      {store.verificationLevel && store.verificationLevel !== 'NONE' && (
                        <Text style={{ fontSize: 12 }}>
                          {store.verificationLevel === 'BRONZE' ? '\u{1F949}' : store.verificationLevel === 'SILVER' ? '\u{1F948}' : store.verificationLevel === 'GOLD' ? '\u{1F947}' : '\u{1F48E}'}
                        </Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={[styles.openDot, { backgroundColor: store.isOpen ? colors.success : colors.danger }]} />
                      <Text style={{ fontSize: 10, color: store.isOpen ? colors.success : colors.danger, fontWeight: '600' }}>
                        {store.isOpen ? 'Aberto' : 'Fechado'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.gray, marginTop: 2 }}>
                      {store.orderCount} {Number(store.orderCount) === 1 ? 'pedido' : 'pedidos'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Lojas seguidas */}
        {followedStores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="heart-circle" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Suas lojas</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {followedStores.map((store: any) => (
                <TouchableOpacity
                  key={store.id}
                  style={[styles.frequentStoreCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push(`/store/${store.id}`)}
                >
                  {store.logoUrl ? (
                    <Image source={{ uri: store.logoUrl }} style={styles.frequentStoreLogo} />
                  ) : (
                    <View style={[styles.frequentStoreLogo, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="storefront-outline" size={18} color={colors.gray} />
                    </View>
                  )}
                  <View style={styles.frequentStoreInfo}>
                    <Text style={[styles.frequentStoreName, { color: colors.text }]} numberOfLines={1}>{store.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={[styles.openDot, { backgroundColor: store.isOpen ? colors.success : colors.danger }]} />
                      <Text style={{ fontSize: 10, color: store.isOpen ? colors.success : colors.danger, fontWeight: '600' }}>
                        {store.isOpen ? 'Aberto' : 'Fechado'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Top 5 da semana */}
        {topStores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="trophy" size={18} color={colors.warning} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Top 5 da semana</Text>
              </View>
            </View>
            <View style={{ paddingHorizontal: 12, gap: 6 }}>
              {topStores.map((store: any, index: number) => (
                <TouchableOpacity
                  key={store.id}
                  style={[styles.topStoreCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push(`/store/${store.id}`)}
                >
                  <View style={[styles.topRank, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.grayLight }]}>
                    <Text style={[styles.topRankText, { color: index < 3 ? '#FFFFFF' : colors.text }]}>
                      {index + 1}
                    </Text>
                  </View>
                  {store.logoUrl ? (
                    <Image source={{ uri: store.logoUrl }} style={styles.topStoreLogo} />
                  ) : (
                    <View style={[styles.topStoreLogo, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="storefront-outline" size={18} color={colors.gray} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={[styles.topStoreName, { color: colors.text }]} numberOfLines={1}>{store.name}</Text>
                      {store.verificationLevel && store.verificationLevel !== 'NONE' && (
                        <Text style={{ fontSize: 12 }}>
                          {store.verificationLevel === 'BRONZE' ? '\u{1F949}' : store.verificationLevel === 'SILVER' ? '\u{1F948}' : store.verificationLevel === 'GOLD' ? '\u{1F947}' : '\u{1F48E}'}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 10, color: colors.gray, marginTop: 2 }}>
                      {store.orderCount} pedidos esta semana
                    </Text>
                  </View>
                  <View style={[styles.openDot, { backgroundColor: store.isOpen ? colors.success : colors.danger }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty state when nothing to show */}
        {promotions.length === 0 && popularProducts.length === 0 && reorderProducts.length === 0 && frequentStores.length === 0 && topStores.length === 0 && followedStores.length === 0 && !refreshing && (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={56} color={colors.grayLight} />
            <Text style={[styles.emptyTitle, { color: colors.textLight }]}>Nada por aqui ainda</Text>
            <Text style={[styles.emptySubtext, { color: colors.gray }]}>
              Explore as lojas na aba de busca e faca seu primeiro pedido!
            </Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Ionicons name="search" size={18} color="#FFFFFF" />
              <Text style={styles.exploreButtonText}>Explorar lojas</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 10, paddingBottom: 12 },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoWrapper: { marginBottom: 8, position: 'relative', paddingTop: 6, paddingBottom: 4 },
  logoBcm: { fontSize: 6, fontWeight: '500', color: '#d4d4d4', letterSpacing: 2, position: 'absolute', top: 0, left: -2, zIndex: 1 },
  logoCenter: { flexDirection: 'row', alignItems: 'baseline' },
  logoDelivery: { fontSize: 22, fontWeight: '800', color: '#FF6B35' },
  logoApp: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  greeting: { fontSize: fonts.xlarge, fontWeight: 'bold' },
  headerSub: { fontSize: fonts.regular, marginTop: 4 },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  emailBannerText: { flex: 1, color: '#fff', fontSize: 10, fontWeight: '600' },

  content: { paddingBottom: 12 },

  // Sections
  section: { marginTop: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: fonts.large, fontWeight: '700' },

  // Promo cards
  promoCard: {
    width: 200,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  promoImage: { width: 200, height: 110 },
  promoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  promoBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  promoStoreBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  promoStoreText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  promoInfo: { padding: 10 },
  promoName: { fontSize: fonts.regular, fontWeight: '600' },

  // Product cards
  productCard: {
    width: 150,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  productImage: { width: 150, height: 100 },
  productInfo: { padding: 8, gap: 1 },
  productCardSmall: {
    width: 130,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  productImageSmall: { width: 130, height: 56 },
  productInfoSmall: { padding: 8, gap: 1 },
  productName: { fontSize: fonts.small, fontWeight: '600' },
  productPrice: { fontSize: fonts.small, fontWeight: '700' },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  discountText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' },

  // Frequent stores
  frequentStoreCard: {
    width: 140,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 12,
  },
  frequentStoreLogo: { width: 56, height: 56, borderRadius: 28 },
  frequentStoreInfo: { marginTop: 8, alignItems: 'center' },
  frequentStoreName: { fontSize: fonts.small, fontWeight: '600', textAlign: 'center' },
  openDot: { width: 6, height: 6, borderRadius: 3 },

  // Top stores
  topStoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    padding: 12,
  },
  topRank: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRankText: { fontSize: 10, fontWeight: 'bold' },
  topStoreLogo: { width: 40, height: 40, borderRadius: 10 },
  topStoreName: { fontSize: fonts.regular, fontWeight: '600' },

  // Empty state
  emptyState: { alignItems: 'center', marginTop: 60, gap: 6, paddingHorizontal: 32 },
  emptyTitle: { fontSize: fonts.large, fontWeight: '600' },
  emptySubtext: { fontSize: fonts.regular, textAlign: 'center' },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  exploreButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: fonts.regular },
});
