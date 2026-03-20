import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { GET_ACTIVE_PROMOTIONS } from '../../src/lib/graphql/queries';
import { useCart } from '../../src/contexts/CartContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as staticColors, fonts } from '../../src/theme';

const { width } = Dimensions.get('window');

export default function PromotionScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { addItem, itemCount } = useCart();
  const { data } = useQuery(GET_ACTIVE_PROMOTIONS);

  const promo = (data?.activePromotions || []).find((p: any) => p.id === id);

  if (!promo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyCenter}>
          <Ionicons name="megaphone-outline" size={36} color={colors.gray} />
          <Text style={[styles.emptyText, { color: colors.textLight }]}>Promocao nao encontrada</Text>
        </View>
      </View>
    );
  }

  const originalPrice = Number(promo.product?.price || 0);
  const promoPrice = Number(promo.promotionalPrice || 0);
  const discount = originalPrice > 0 && promoPrice > 0
    ? Math.round((1 - promoPrice / originalPrice) * 100)
    : 0;
  const savings = originalPrice - promoPrice;
  const imageUrl = promo.product?.imageUrl || promo.imageUrl;
  const endDate = new Date(promo.endDate);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  function handleAddToCart() {
    if (!promo.product || !promo.store) return;
    addItem(promo.product.id, 1);
    router.push('/(tabs)/cart');
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: 'transparent', top: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <Ionicons name="arrow-back" size={18} color="#FFF" />
        </TouchableOpacity>
        {itemCount > 0 && (
          <TouchableOpacity onPress={() => router.push('/cart')} style={[styles.backBtn, { backgroundColor: staticColors.primary }]}>
            <Ionicons name="cart" size={18} color="#FFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView bounces={false}>
        {/* Hero image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: staticColors.primary, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="megaphone-outline" size={64} color="#FFF" />
          </View>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}

        {/* Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Title & timer */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{promo.title}</Text>
          </View>

          {daysLeft > 0 && (
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={16} color={staticColors.danger} />
              <Text style={styles.timerText}>
                {daysLeft === 1 ? 'Ultimo dia!' : `Termina em ${daysLeft} dias`}
              </Text>
            </View>
          )}

          {/* Price card */}
          <View style={[styles.priceCard, { backgroundColor: colors.card }]}>
            <View style={styles.priceLeft}>
              {originalPrice > 0 && (
                <Text style={[styles.originalPrice, { color: colors.gray }]}>De R$ {originalPrice.toFixed(2)}</Text>
              )}
              <Text style={styles.promoPrice}>R$ {promoPrice.toFixed(2)}</Text>
              {savings > 0 && (
                <Text style={styles.savingsText}>Voce economiza R$ {savings.toFixed(2)}</Text>
              )}
            </View>
            {discount > 0 && (
              <View style={styles.discountPill}>
                <Text style={styles.discountPillText}>{discount}% OFF</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {promo.description ? (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sobre esta promocao</Text>
              <Text style={[styles.description, { color: colors.textLight }]}>{promo.description}</Text>
            </View>
          ) : null}

          {/* Product info */}
          {promo.product ? (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Produto</Text>
              <View style={styles.productRow}>
                {promo.product.imageUrl ? (
                  <Image source={{ uri: promo.product.imageUrl }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="cube-outline" size={18} color={colors.gray} />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>{promo.product.name}</Text>
                  {promo.product.description ? (
                    <Text style={[styles.productDesc, { color: colors.textLight }]} numberOfLines={2}>{promo.product.description}</Text>
                  ) : null}
                  <View style={styles.productPriceRow}>
                    <Text style={[styles.productPriceOld, { color: colors.gray }]}>R$ {originalPrice.toFixed(2)}</Text>
                    <Ionicons name="arrow-forward" size={14} color={staticColors.primary} />
                    <Text style={styles.productPriceNew}>R$ {promoPrice.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* Store card */}
          {promo.store ? (
            <TouchableOpacity
              style={[styles.storeCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/store/${promo.store.id}`)}
            >
              <View style={styles.storeLeft}>
                {promo.store.logoUrl ? (
                  <Image source={{ uri: promo.store.logoUrl }} style={styles.storeLogo} />
                ) : (
                  <View style={[styles.storeLogo, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="storefront-outline" size={18} color={colors.gray} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.storeNameRow}>
                    <Text style={[styles.storeName, { color: colors.text }]}>{promo.store.name}</Text>
                    {promo.store.verificationLevel && promo.store.verificationLevel !== 'NONE' && (
                      <Text style={{ fontSize: 12 }}>
                        {promo.store.verificationLevel === 'BRONZE' ? '🥉' : promo.store.verificationLevel === 'SILVER' ? '🥈' : promo.store.verificationLevel === 'GOLD' ? '🥇' : '💎'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.storeDetails}>
                    <View style={styles.storeDetail}>
                      <Ionicons name="time-outline" size={13} color={colors.gray} />
                      <Text style={[styles.storeDetailText, { color: colors.gray }]}>{promo.store.estimatedDeliveryMinutes} min</Text>
                    </View>
                    <View style={styles.storeDetail}>
                      <Ionicons name="bicycle-outline" size={13} color={colors.gray} />
                      <Text style={[styles.storeDetailText, { color: colors.gray }]}>
                        {promo.store.freeDelivery || Number(promo.store.deliveryFee) === 0 ? 'Gratis' : `R$ ${Number(promo.store.deliveryFee).toFixed(2)}`}
                      </Text>
                    </View>
                    <View style={[styles.storeStatusDot, { backgroundColor: promo.store.isOpen ? staticColors.success : staticColors.danger }]} />
                    <Text style={[styles.storeDetailText, { color: promo.store.isOpen ? staticColors.success : staticColors.danger }]}>
                      {promo.store.isOpen ? 'Aberta' : 'Fechada'}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray} />
            </TouchableOpacity>
          ) : null}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {promo.product && promo.store?.isOpen && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>Adicionar ao carrinho - R$ {promoPrice.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: staticColors.danger,
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  heroImage: {
    width: width,
    height: width * 0.65,
  },
  discountBadge: {
    position: 'absolute',
    top: width * 0.65 - 20,
    right: 16,
    backgroundColor: staticColors.danger,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  discountText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  content: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  titleRow: {
    marginBottom: 8,
  },
  title: {
    fontSize: fonts.title,
    fontWeight: 'bold',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timerText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: staticColors.danger,
  },
  priceCard: {
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLeft: {},
  originalPrice: {
    fontSize: fonts.small,
    textDecorationLine: 'line-through',
  },
  promoPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: staticColors.primary,
  },
  savingsText: {
    fontSize: fonts.tiny,
    fontWeight: '600',
    color: staticColors.success,
    marginTop: 4,
  },
  discountPill: {
    backgroundColor: staticColors.danger,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  discountPillText: {
    color: '#FFF',
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: fonts.large,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: fonts.regular,
    lineHeight: 22,
  },
  productRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fonts.regular,
    fontWeight: '600',
  },
  productDesc: {
    fontSize: fonts.small,
    marginTop: 2,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  productPriceOld: {
    fontSize: fonts.small,
    textDecorationLine: 'line-through',
  },
  productPriceNew: {
    fontSize: fonts.regular,
    fontWeight: '700',
    color: staticColors.primary,
  },
  storeCard: {
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  storeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: fonts.regular,
    fontWeight: '600',
  },
  storeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  storeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  storeDetailText: {
    fontSize: fonts.tiny,
  },
  storeStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  addButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: fonts.regular,
    fontWeight: 'bold',
  },
  differentStoreWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  differentStoreText: {
    fontSize: fonts.small,
  },
  emptyCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: fonts.regular,
  },
});
