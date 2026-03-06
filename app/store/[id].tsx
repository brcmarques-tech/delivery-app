import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SectionList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { GET_STORE } from '../../src/lib/graphql/queries';
import { useCart } from '../../src/contexts/CartContext';
import { colors, fonts } from '../../src/theme';

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading } = useQuery(GET_STORE, { variables: { id } });
  const { addItem, storeId, itemCount, total } = useCart();

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

  function handleAddProduct(product: any) {
    if (storeId && storeId !== id) {
      Alert.alert(
        'Limpar carrinho?',
        'Voce ja tem itens de outra loja. Deseja limpar e adicionar deste?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Limpar e adicionar',
            onPress: () => doAdd(product),
          },
        ],
      );
      return;
    }
    doAdd(product);
  }

  function doAdd(product: any) {
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: Number(product.promotionalPrice || product.price),
        quantity: 1,
        imageUrl: product.imageUrl,
      },
      id!,
      store.name,
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
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
            onPress={() => store.isOpen && handleAddProduct(item)}
            disabled={!store.isOpen || !item.isAvailable}
          >
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
              ) : null}
              <View style={styles.priceRow}>
                {item.promotionalPrice ? (
                  <>
                    <Text style={styles.priceOld}>R$ {Number(item.price).toFixed(2)}</Text>
                    <Text style={styles.price}>R$ {Number(item.promotionalPrice).toFixed(2)}</Text>
                  </>
                ) : (
                  <Text style={styles.price}>R$ {Number(item.price).toFixed(2)}</Text>
                )}
                {item.unit && <Text style={styles.unit}>/ {item.unit}</Text>}
              </View>
            </View>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, styles.productImagePlaceholder]}>
                <Ionicons name="fast-food-outline" size={24} color={colors.gray} />
              </View>
            )}
            {!item.isAvailable && (
              <View style={styles.unavailable}>
                <Text style={styles.unavailableText}>Indisponivel</Text>
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
    </View>
  );
}

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
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  unavailableText: { color: colors.danger, fontWeight: '600' },
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
});
