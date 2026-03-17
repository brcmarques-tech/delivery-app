import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useQuery, useSubscription } from '@apollo/client';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GET_STORES, GET_ACTIVE_PROMOTIONS, GET_NEARBY_STORES } from '../../src/lib/graphql/queries';
import { STORE_UPDATED, PROMOTION_UPDATED } from '../../src/lib/graphql/subscriptions';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCart } from '../../src/contexts/CartContext';
import { useLocation } from '../../src/contexts/LocationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { colors as staticColors, fonts } from '../../src/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const { location } = useLocation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: nearbyData, loading: nearbyLoading, refetch: refetchNearby } = useQuery(GET_NEARBY_STORES, {
    variables: { latitude: location?.latitude || 0, longitude: location?.longitude || 0, radiusKm: 30 },
    skip: !location,
    pollInterval: 30000,
  });
  const { data: allData, loading: allLoading, refetch: refetchAll } = useQuery(GET_STORES, {
    pollInterval: 30000,
  });
  const { data: promosData, refetch: refetchPromos } = useQuery(GET_ACTIVE_PROMOTIONS, {
    pollInterval: 30000,
  });

  // Real-time: refresh when stores or promotions change
  useSubscription(STORE_UPDATED, {
    onData: () => { refetchNearby(); refetchAll(); },
  });
  useSubscription(PROMOTION_UPDATED, {
    onData: () => { refetchPromos(); },
  });

  const nearbyStores = nearbyData?.nearbyStores || [];
  const allStores = allData?.stores || [];
  // Fallback: if GPS returned but no nearby stores found, show all stores
  const stores = location && nearbyStores.length > 0 ? nearbyStores : allStores;
  const loading = location ? nearbyLoading : allLoading;
  const promotions = promosData?.activePromotions || [];

  function renderStore({ item }: { item: any }) {
    return (
      <TouchableOpacity
        style={[styles.storeCard, { backgroundColor: colors.card, position: 'relative', overflow: 'visible' }]}
        onPress={() => router.push(`/store/${item.id}`)}
      >
        {item.verificationLevel && item.verificationLevel !== 'NONE' && (
          <Text style={{ position: 'absolute', top: -8, left: -4, fontSize: 20, zIndex: 10 }}>
            {item.verificationLevel === 'BRONZE' ? '🥉' : item.verificationLevel === 'SILVER' ? '🥈' : item.verificationLevel === 'GOLD' ? '🥇' : '💎'}
          </Text>
        )}
        {item.logoUrl ? (
          <Image source={{ uri: item.logoUrl }} style={styles.storeLogo} />
        ) : (
          <View style={[styles.storeLogo, styles.storeLogoPlaceholder, { backgroundColor: colors.grayLight }]}>
            <Ionicons name="storefront-outline" size={32} color={colors.gray} />
          </View>
        )}
        <View style={styles.storeInfo}>
          <Text style={[styles.storeName, { color: colors.text }]}>{item.name}</Text>
          {item.description ? (
            <Text style={[styles.storeDesc, { color: colors.textLight }]} numberOfLines={1}>{item.description}</Text>
          ) : null}
          <View style={styles.storeDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color={colors.gray} />
              <Text style={[styles.detailText, { color: colors.gray }]}>{item.estimatedDeliveryMinutes} min</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="bicycle-outline" size={14} color={colors.gray} />
              <Text style={[styles.detailText, { color: colors.gray }]}>
                {Number(item.deliveryFee) > 0 ? `R$ ${Number(item.deliveryFee).toFixed(2)}` : 'Gratis'}
              </Text>
            </View>
            {item.minimumOrder > 0 && (
              <Text style={[styles.minOrder, { color: colors.gray }]}>Min R$ {Number(item.minimumOrder).toFixed(2)}</Text>
            )}
          </View>
        </View>
        <View style={[styles.statusDot, { backgroundColor: item.isOpen ? colors.success : colors.danger }]} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {user && user.emailVerified === false && (
        <TouchableOpacity
          style={styles.emailBanner}
          onPress={() => router.push('/profile' as any)}
        >
          <Ionicons name="mail-outline" size={18} color="#fff" />
          <Text style={styles.emailBannerText}>
            Verifique seu email para receber notificacoes
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={[styles.header, { backgroundColor: colors.white, paddingTop: insets.top + 12 }]}>
        <View>
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
        {itemCount > 0 && (
          <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart')}>
            <Ionicons name="cart" size={24} color="#FFFFFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={renderStore}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { refetchNearby(); refetchAll(); }} />}
        ListHeaderComponent={
          promotions.length > 0 ? (
            <View style={styles.promosSection}>
              <Text style={[styles.promosTitle, { color: colors.text }]}>Destaques</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promosScroll}>
                {promotions.map((promo: any) => {
                  const originalPrice = promo.product?.price;
                  const promoPrice = promo.promotionalPrice;
                  const discount = originalPrice && promoPrice
                    ? Math.round((1 - promoPrice / originalPrice) * 100)
                    : 0;

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
                            <Ionicons name="megaphone-outline" size={32} color="#FFFFFF" />
                          </View>
                        )}
                        {discount > 0 && (
                          <View style={styles.promoBadge}>
                            <Text style={styles.promoBadgeText}>-{discount}%</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.promoInfo}>
                        <Text style={[styles.promoName, { color: colors.text }]} numberOfLines={1}>{promo.title}</Text>
                        <Text style={[styles.promoStore, { color: colors.textLight }]} numberOfLines={1}>{promo.store?.name}</Text>
                        {promoPrice && originalPrice ? (
                          <View style={styles.promoPriceRow}>
                            <Text style={[styles.promoPriceOld, { color: colors.gray }]}>R$ {Number(originalPrice).toFixed(2)}</Text>
                            <Text style={styles.promoPrice}>R$ {Number(promoPrice).toFixed(2)}</Text>
                          </View>
                        ) : promoPrice ? (
                          <Text style={styles.promoPrice}>R$ {Number(promoPrice).toFixed(2)}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { color: colors.textLight }]}>Nenhuma loja encontrada</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: staticColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 56,
    backgroundColor: staticColors.white,
  },
  logoWrapper: { marginBottom: 8, position: 'relative', paddingTop: 6, paddingBottom: 4 },
  logoBcm: { fontSize: 6, fontWeight: '500', color: '#d4d4d4', letterSpacing: 2, position: 'absolute', top: 0, left: -2, zIndex: 1 },
  logoCenter: { flexDirection: 'row', alignItems: 'baseline' },
  logoDelivery: { fontSize: 22, fontWeight: '800', color: staticColors.primary },
  logoApp: { fontSize: 14, fontWeight: '600', color: staticColors.textLight, marginLeft: 4 },
  greeting: { fontSize: fonts.xlarge, fontWeight: 'bold', color: staticColors.text },
  headerSub: { fontSize: fonts.regular, color: staticColors.textLight, marginTop: 4 },
  cartButton: {
    backgroundColor: staticColors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: staticColors.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  list: { padding: 16, gap: 12 },
  storeCard: {
    backgroundColor: staticColors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeLogo: { width: 64, height: 64, borderRadius: 12 },
  storeLogoPlaceholder: {
    backgroundColor: staticColors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: { flex: 1 },
  storeName: { fontSize: fonts.large, fontWeight: '600', color: staticColors.text },
  storeDesc: { fontSize: fonts.small, color: staticColors.textLight, marginTop: 2 },
  storeDetails: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: fonts.tiny, color: staticColors.gray },
  minOrder: { fontSize: fonts.tiny, color: staticColors.gray },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  empty: { textAlign: 'center', color: staticColors.textLight, marginTop: 48, fontSize: fonts.regular },
  promosSection: { marginBottom: 16 },
  promosTitle: { fontSize: fonts.large, fontWeight: '600', color: staticColors.text, marginBottom: 12 },
  promosScroll: { marginHorizontal: -16 },
  promoCard: {
    width: 200,
    backgroundColor: staticColors.white,
    borderRadius: 16,
    marginLeft: 16,
    overflow: 'hidden',
  },
  promoImage: { width: 200, height: 100, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  promoInfo: { padding: 10 },
  promoName: { fontSize: fonts.regular, fontWeight: '600', color: staticColors.text },
  promoStore: { fontSize: fonts.tiny, color: staticColors.textLight, marginTop: 2 },
  promoPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  promoPriceOld: { fontSize: fonts.tiny, color: staticColors.gray, textDecorationLine: 'line-through' },
  promoPrice: { fontSize: fonts.regular, fontWeight: '700', color: staticColors.primary, marginTop: 2 },
  promoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: staticColors.danger,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  promoBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  emailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  emailBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
