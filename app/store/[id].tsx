import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SectionList,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useSubscription } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { GET_STORE } from '../../src/lib/graphql/queries';
import { PRODUCT_UPDATED, STORE_UPDATED } from '../../src/lib/graphql/subscriptions';
import { useCart } from '../../src/contexts/CartContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { colors, fonts } from '../../src/theme';

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, refetch } = useQuery(GET_STORE, { variables: { id }, pollInterval: 15000 });

  // Real-time: refresh when products or store changes
  useSubscription(PRODUCT_UPDATED, {
    variables: { storeId: id },
    onData: () => { refetch(); },
  });
  useSubscription(STORE_UPDATED, {
    variables: { storeId: id },
    onData: () => { refetch(); },
  });
  const { addItem, storeId, itemCount, total } = useCart();
  const { alert } = useAlert();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [weightGrams, setWeightGrams] = useState(500);

  const store = data?.store;

  if (loading || !store) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const categories = store.categories || [];
  const products = store.products || [];

  const sections = categories.map((cat: any) => ({
    title: cat.name,
    data: products.filter((p: any) => p.category?.id === cat.id),
  }));

  const uncategorized = products.filter((p: any) => !p.category);
  if (uncategorized.length > 0) {
    sections.push({ title: 'Outros', data: uncategorized });
  }

  if (sections.length === 0 && products.length > 0) {
    sections.push({ title: 'Produtos', data: products });
  }

  function openProductModal(product: any) {
    if (storeId && storeId !== id) {
      alert(
        'Limpar carrinho?',
        'Voce ja tem itens de outra loja. Deseja limpar e adicionar deste?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Limpar e adicionar',
            onPress: () => {
              setSelectedProduct(product);
              setQuantity(1);
              setWeightGrams(500);
            },
          },
        ],
      );
      return;
    }
    setSelectedProduct(product);
    setQuantity(1);
    setWeightGrams(500);
  }

  function confirmAdd() {
    if (!selectedProduct) return;
    const price = Number(selectedProduct.promotionalPrice || selectedProduct.price);
    if (selectedProduct.isVariableWeight) {
      addItem(
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          price,
          quantity: 1,
          imageUrl: selectedProduct.imageUrl,
          isVariableWeight: true,
          weightGrams,
        },
        id!,
        store.name,
      );
    } else {
      addItem(
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          price,
          quantity,
          imageUrl: selectedProduct.imageUrl,
        },
        id!,
        store.name,
      );
    }
    setSelectedProduct(null);
  }

  const selectedPrice = selectedProduct
    ? Number(selectedProduct.promotionalPrice || selectedProduct.price)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.storeInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.storeName}>{store.name}</Text>
            {store.verificationLevel && store.verificationLevel !== 'NONE' && (
              <Text style={{ fontSize: 16 }}>
                {store.verificationLevel === 'BRONZE' ? '🥉' : store.verificationLevel === 'SILVER' ? '🥈' : store.verificationLevel === 'GOLD' ? '🥇' : '💎'}
              </Text>
            )}
          </View>
          <View style={styles.storeDetails}>
            <Text style={styles.detailText}>{store.estimatedDeliveryMinutes} min</Text>
            <Text style={styles.detailDot}>•</Text>
            <Text style={styles.detailText}>
              {Number(store.deliveryFee) > 0 ? `R$ ${Number(store.deliveryFee).toFixed(2)}` : 'Entrega gratis'}
            </Text>
            {Number(store.minimumOrder) > 0 && (
              <>
                <Text style={styles.detailDot}>•</Text>
                <Text style={styles.detailText}>Min R$ {Number(store.minimumOrder).toFixed(2)}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {!store.isOpen && (
        <View style={styles.closedBanner}>
          <Ionicons name="time-outline" size={16} color={colors.danger} />
          <Text style={styles.closedText}>Loja fechada no momento</Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => store.isOpen && openProductModal(item)}
            disabled={!store.isOpen || !item.isAvailable}
          >
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
              ) : null}
              <View style={styles.priceRow}>
                {item.isVariableWeight ? (
                  <Text style={styles.price}>R$ {Number(item.promotionalPrice || item.price).toFixed(2)}/kg</Text>
                ) : item.promotionalPrice ? (
                  <>
                    <Text style={styles.priceOld}>R$ {Number(item.price).toFixed(2)}</Text>
                    <Text style={styles.price}>R$ {Number(item.promotionalPrice).toFixed(2)}</Text>
                  </>
                ) : (
                  <Text style={styles.price}>R$ {Number(item.price).toFixed(2)}</Text>
                )}
                {!item.isVariableWeight && item.unit && <Text style={styles.unit}>/ {item.unit}</Text>}
              </View>
            </View>
            {item.imageUrl ? (
              <TouchableOpacity activeOpacity={0.8} onPress={() => setZoomedImage(item.imageUrl)}>
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.productImage, styles.productImagePlaceholder]}>
                <Ionicons name="fast-food-outline" size={24} color={colors.gray} />
              </View>
            )}
            {!item.isAvailable && (
              <View style={styles.unavailable}>
                <View style={styles.unavailableBadge}>
                  <Ionicons name="close-circle" size={16} color={colors.white} />
                  <Text style={styles.unavailableText}>Indisponivel no momento</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {itemCount > 0 && storeId === id && (
        <TouchableOpacity style={styles.cartBar} onPress={() => router.push('/cart')}>
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{itemCount}</Text>
          </View>
          <Text style={styles.cartBarText}>Ver carrinho</Text>
          <Text style={styles.cartBarTotal}>R$ {total.toFixed(2)}</Text>
        </TouchableOpacity>
      )}

      {/* Modal de imagem ampliada */}
      <Modal visible={!!zoomedImage} transparent animationType="fade" onRequestClose={() => setZoomedImage(null)}>
        <Pressable style={styles.imageModalOverlay} onPress={() => setZoomedImage(null)}>
          <View style={styles.imageModalContainer}>
            {zoomedImage && (
              <Image source={{ uri: zoomedImage }} style={styles.imageModalImage} resizeMode="contain" />
            )}
          </View>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setZoomedImage(null)}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
        </Pressable>
      </Modal>

      {/* Modal de adicionar ao carrinho */}
      <Modal visible={!!selectedProduct} transparent animationType="slide" onRequestClose={() => setSelectedProduct(null)}>
        <Pressable style={styles.addModalOverlay} onPress={() => setSelectedProduct(null)}>
          <Pressable style={styles.addModalSheet} onPress={() => {}}>
            {selectedProduct && (
              <>
                {/* Imagem */}
                {selectedProduct.imageUrl && (
                  <TouchableOpacity activeOpacity={0.9} onPress={() => { setSelectedProduct(null); setTimeout(() => setZoomedImage(selectedProduct.imageUrl), 300); }}>
                    <Image source={{ uri: selectedProduct.imageUrl }} style={styles.addModalImage} />
                  </TouchableOpacity>
                )}

                {/* Info */}
                <View style={styles.addModalInfo}>
                  <Text style={styles.addModalName}>{selectedProduct.name}</Text>
                  {selectedProduct.description ? (
                    <Text style={styles.addModalDesc}>{selectedProduct.description}</Text>
                  ) : null}
                  <View style={styles.addModalPriceRow}>
                    {selectedProduct.isVariableWeight ? (
                      <Text style={styles.addModalUnit}>R$ {Number(selectedProduct.promotionalPrice || selectedProduct.price).toFixed(2)}/kg</Text>
                    ) : selectedProduct.promotionalPrice ? (
                      <>
                        <Text style={styles.addModalPriceOld}>R$ {Number(selectedProduct.price).toFixed(2)}</Text>
                        <Text style={styles.addModalPrice}>R$ {Number(selectedProduct.promotionalPrice).toFixed(2)}</Text>
                      </>
                    ) : (
                      <Text style={styles.addModalPrice}>R$ {Number(selectedProduct.price).toFixed(2)}</Text>
                    )}
                    {!selectedProduct.isVariableWeight && selectedProduct.unit && <Text style={styles.addModalUnit}>/ {selectedProduct.unit}</Text>}
                  </View>
                </View>

                {/* Quantidade / Peso */}
                {selectedProduct.isVariableWeight ? (
                  <View style={styles.quantityRow}>
                    <TouchableOpacity
                      style={[styles.quantityBtn, weightGrams <= 100 && styles.quantityBtnDisabled]}
                      onPress={() => weightGrams > 100 && setWeightGrams(weightGrams - 100)}
                      disabled={weightGrams <= 100}
                    >
                      <Ionicons name="remove" size={22} color={weightGrams <= 100 ? colors.gray : colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>
                      {weightGrams >= 1000 ? `${(weightGrams / 1000).toFixed(weightGrams % 1000 === 0 ? 0 : 1)}kg` : `${weightGrams}g`}
                    </Text>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => setWeightGrams(weightGrams + 100)}
                    >
                      <Ionicons name="add" size={22} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.quantityRow}>
                    <TouchableOpacity
                      style={[styles.quantityBtn, quantity <= 1 && styles.quantityBtnDisabled]}
                      onPress={() => quantity > 1 && setQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <Ionicons name="remove" size={22} color={quantity <= 1 ? colors.gray : colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => setQuantity(quantity + 1)}
                    >
                      <Ionicons name="add" size={22} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Botao confirmar */}
                <TouchableOpacity style={styles.addModalButton} onPress={confirmAdd} activeOpacity={0.8}>
                  <Text style={styles.addModalButtonText}>Adicionar</Text>
                  {selectedProduct.isVariableWeight ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.addModalButtonPrice}>R$ {((selectedPrice * weightGrams) / 1000).toFixed(2)}</Text>
                      <Text style={[styles.addModalButtonPrice, { fontSize: 11, opacity: 0.85 }]}>(R$ {selectedPrice.toFixed(2)}/kg)</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textLight, fontSize: fonts.regular },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    paddingTop: 56,
    backgroundColor: colors.white,
  },
  backButton: { padding: 4 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text },
  storeDetails: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  detailText: { fontSize: fonts.small, color: colors.textLight },
  detailDot: { color: colors.gray },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.danger + '15',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  closedText: { color: colors.danger, fontSize: fonts.small, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text, marginTop: 16, marginBottom: 12 },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 8,
    position: 'relative',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  productDesc: { fontSize: fonts.small, color: colors.textLight, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  price: { fontSize: fonts.regular, fontWeight: 'bold', color: colors.primary },
  priceOld: { fontSize: fonts.small, color: colors.gray, textDecorationLine: 'line-through' },
  unit: { fontSize: fonts.small, color: colors.textLight },
  productImage: { width: 72, height: 72, borderRadius: 8, marginLeft: 12 },
  productImagePlaceholder: { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' },
  unavailable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  unavailableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unavailableText: { color: colors.white, fontWeight: '700', fontSize: fonts.small },
  cartBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: colors.white, fontWeight: 'bold', fontSize: fonts.small },
  cartBarText: { flex: 1, color: colors.white, fontSize: fonts.regular, fontWeight: 'bold', marginLeft: 12 },
  cartBarTotal: { color: colors.white, fontSize: fonts.regular, fontWeight: 'bold' },

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
    borderRadius: 12,
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
    backgroundColor: colors.white,
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
    padding: 20,
    paddingBottom: 8,
  },
  addModalName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  addModalDesc: {
    fontSize: fonts.regular,
    color: colors.textLight,
    marginTop: 8,
    lineHeight: 22,
  },
  addModalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  addModalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addModalPriceOld: {
    fontSize: fonts.regular,
    color: colors.gray,
    textDecorationLine: 'line-through',
  },
  addModalUnit: {
    fontSize: fonts.regular,
    color: colors.textLight,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
    marginHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  quantityBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnDisabled: {
    opacity: 0.4,
  },
  quantityText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  addModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  addModalButtonText: {
    color: colors.white,
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  addModalButtonPrice: {
    color: colors.white,
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
});
