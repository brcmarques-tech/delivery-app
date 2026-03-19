import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useLazyQuery } from '@apollo/client';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GET_STORES, SEARCH_PRODUCTS, GET_ACTIVE_PROMOTIONS } from '../../src/lib/graphql/queries';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../src/theme';

type FilterType = 'all' | 'open' | 'free_delivery' | 'promo';

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT = 8;

const POPULAR_CATEGORIES = [
  { label: 'Bebidas', icon: 'beer-outline' as const, query: 'bebida' },
  { label: 'Doces', icon: 'ice-cream-outline' as const, query: 'doce' },
  { label: 'Frutas', icon: 'nutrition-outline' as const, query: 'fruta' },
  { label: 'Carnes', icon: 'flame-outline' as const, query: 'carne' },
  { label: 'Padaria', icon: 'cafe-outline' as const, query: 'pao' },
  { label: 'Limpeza', icon: 'sparkles-outline' as const, query: 'limpeza' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: storesData } = useQuery(GET_STORES);
  const { data: promosData } = useQuery(GET_ACTIVE_PROMOTIONS);
  const [searchProducts, { data: productsData, loading: productsLoading }] = useLazyQuery(SEARCH_PRODUCTS);

  // Load recent searches
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((val) => {
      if (val) setRecentSearches(JSON.parse(val));
    });
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search products when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchProducts({ variables: { query: debouncedQuery, limit: 30 } });
    }
  }, [debouncedQuery]);

  const saveRecentSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  }, [recentSearches]);

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  function handleSearch(term: string) {
    setQuery(term);
    if (term.trim().length >= 2) saveRecentSearch(term);
  }

  function handleSubmit() {
    if (query.trim().length >= 2) saveRecentSearch(query);
  }

  // Filter stores
  const allStores = storesData?.stores || [];
  const filteredStores = allStores.filter((s: any) => {
    if (!debouncedQuery) return false;
    const matchesQuery = s.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(debouncedQuery.toLowerCase());
    if (!matchesQuery) return false;
    if (activeFilter === 'open') return s.isOpen;
    if (activeFilter === 'free_delivery') return s.freeDelivery;
    return true;
  });

  // Filter products
  const allProducts = productsData?.searchProducts || [];
  const filteredProducts = allProducts.filter((p: any) => {
    if (activeFilter === 'open') return p.store?.isOpen;
    if (activeFilter === 'free_delivery') return false; // products don't have this
    if (activeFilter === 'promo') return p.promotionalPrice && p.promotionalPrice < p.price;
    return true;
  });

  // Promotions matching search
  const promotions = promosData?.activePromotions || [];
  const matchingPromos = debouncedQuery ? promotions.filter((p: any) =>
    p.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    (p.product?.name || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    (p.store?.name || '').toLowerCase().includes(debouncedQuery.toLowerCase()),
  ) : [];

  const hasResults = filteredStores.length > 0 || filteredProducts.length > 0 || matchingPromos.length > 0;
  const isSearching = debouncedQuery.length >= 2;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Buscar</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.grayLight }]}>
          <Ionicons name="search" size={20} color={colors.gray} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar lojas, produtos..."
            placeholderTextColor={colors.gray}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); inputRef.current?.focus(); }}>
              <Ionicons name="close-circle" size={20} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        {isSearching && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filtersContent}>
            {([
              { key: 'all' as FilterType, label: 'Todos', icon: 'grid-outline' as const },
              { key: 'open' as FilterType, label: 'Aberto agora', icon: 'time-outline' as const },
              { key: 'free_delivery' as FilterType, label: 'Frete gratis', icon: 'bicycle-outline' as const },
              { key: 'promo' as FilterType, label: 'Em promocao', icon: 'pricetag-outline' as const },
            ]).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.grayLight },
                  activeFilter === f.key && { backgroundColor: colors.primary },
                ]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Ionicons name={f.icon} size={14} color={activeFilter === f.key ? '#FFFFFF' : colors.textLight} />
                <Text style={[styles.filterChipText, { color: colors.textLight }, activeFilter === f.key && { color: '#FFFFFF' }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Content */}
      {!isSearching ? (
        <ScrollView contentContainerStyle={styles.idleContent}>
          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Buscas recentes</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={[styles.clearText, { color: colors.primary }]}>Limpar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentList}>
                {recentSearches.map((term, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.recentChip, { backgroundColor: colors.grayLight }]}
                    onPress={() => handleSearch(term)}
                  >
                    <Ionicons name="time-outline" size={14} color={colors.gray} />
                    <Text style={[styles.recentText, { color: colors.text }]}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Popular categories */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Categorias populares</Text>
            <View style={styles.categoriesGrid}>
              {POPULAR_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.label}
                  style={[styles.categoryCard, { backgroundColor: colors.card }]}
                  onPress={() => handleSearch(cat.query)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={cat.icon} size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Promotions highlight */}
          {promotions.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ofertas do momento</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {promotions.slice(0, 6).map((promo: any) => {
                  const discount = promo.product?.price && promo.promotionalPrice
                    ? Math.round((1 - promo.promotionalPrice / promo.product.price) * 100) : 0;
                  return (
                    <TouchableOpacity
                      key={promo.id}
                      style={[styles.promoCard, { backgroundColor: colors.card }]}
                      onPress={() => router.push(`/promotion/${promo.id}`)}
                    >
                      {(promo.product?.imageUrl || promo.imageUrl) ? (
                        <Image source={{ uri: promo.product?.imageUrl || promo.imageUrl }} style={styles.promoImage} />
                      ) : (
                        <View style={[styles.promoImage, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="megaphone-outline" size={24} color="#FFFFFF" />
                        </View>
                      )}
                      {discount > 0 && (
                        <View style={styles.promoBadge}>
                          <Text style={styles.promoBadgeText}>-{discount}%</Text>
                        </View>
                      )}
                      <View style={styles.promoInfo}>
                        <Text style={[styles.promoName, { color: colors.text }]} numberOfLines={1}>{promo.title}</Text>
                        <Text style={[styles.promoStore, { color: colors.textLight }]} numberOfLines={1}>{promo.store?.name}</Text>
                        {promo.promotionalPrice && (
                          <Text style={[styles.promoPrice, { color: colors.primary }]}>R$ {Number(promo.promotionalPrice).toFixed(2)}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => 'header'}
          contentContainerStyle={styles.resultsList}
          ListHeaderComponent={
            <>
              {productsLoading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textLight }]}>Buscando...</Text>
                </View>
              )}

              {/* Matching promotions */}
              {matchingPromos.length > 0 && (
                <View style={styles.resultSection}>
                  <View style={styles.resultSectionHeader}>
                    <Ionicons name="pricetag" size={16} color={colors.warning} />
                    <Text style={[styles.resultSectionTitle, { color: colors.text }]}>Promocoes ({matchingPromos.length})</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {matchingPromos.map((promo: any) => {
                      const discount = promo.product?.price && promo.promotionalPrice
                        ? Math.round((1 - promo.promotionalPrice / promo.product.price) * 100) : 0;
                      return (
                        <TouchableOpacity
                          key={promo.id}
                          style={[styles.promoCardSmall, { backgroundColor: colors.card }]}
                          onPress={() => router.push(`/promotion/${promo.id}`)}
                        >
                          {(promo.product?.imageUrl || promo.imageUrl) ? (
                            <Image source={{ uri: promo.product?.imageUrl || promo.imageUrl }} style={styles.promoImageSmall} />
                          ) : (
                            <View style={[styles.promoImageSmall, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                              <Ionicons name="megaphone-outline" size={18} color="#FFFFFF" />
                            </View>
                          )}
                          <View style={{ flex: 1, padding: 8 }}>
                            <Text style={[{ fontSize: fonts.small, fontWeight: '600', color: colors.text }]} numberOfLines={1}>{promo.title}</Text>
                            {discount > 0 && <Text style={{ fontSize: fonts.tiny, color: colors.danger, fontWeight: '700' }}>-{discount}%</Text>}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Stores section */}
              {filteredStores.length > 0 && (
                <View style={styles.resultSection}>
                  <View style={styles.resultSectionHeader}>
                    <Ionicons name="storefront" size={16} color={colors.primary} />
                    <Text style={[styles.resultSectionTitle, { color: colors.text }]}>Lojas ({filteredStores.length})</Text>
                  </View>
                  {filteredStores.map((store: any) => (
                    <TouchableOpacity
                      key={store.id}
                      style={[styles.storeItem, { backgroundColor: colors.card }]}
                      onPress={() => router.push(`/store/${store.id}`)}
                    >
                      {store.logoUrl ? (
                        <Image source={{ uri: store.logoUrl }} style={styles.storeLogo} />
                      ) : (
                        <View style={[styles.storeLogo, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="storefront-outline" size={24} color={colors.gray} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.storeName, { color: colors.text }]} numberOfLines={1}>{store.name}</Text>
                          {store.verificationLevel && store.verificationLevel !== 'NONE' && (
                            <Text style={{ fontSize: 14 }}>
                              {store.verificationLevel === 'BRONZE' ? '\u{1F949}' : store.verificationLevel === 'SILVER' ? '\u{1F948}' : store.verificationLevel === 'GOLD' ? '\u{1F947}' : '\u{1F48E}'}
                            </Text>
                          )}
                        </View>
                        {store.description ? (
                          <Text style={[styles.storeDesc, { color: colors.textLight }]} numberOfLines={1}>{store.description}</Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <View style={[styles.openBadge, { backgroundColor: store.isOpen ? colors.success + '20' : colors.danger + '20' }]}>
                            <Text style={{ fontSize: 10, fontWeight: '600', color: store.isOpen ? colors.success : colors.danger }}>
                              {store.isOpen ? 'Aberto' : 'Fechado'}
                            </Text>
                          </View>
                          {store.freeDelivery && (
                            <Text style={{ fontSize: fonts.tiny, color: colors.success, fontWeight: '600' }}>Frete gratis</Text>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.gray} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Products section */}
              {filteredProducts.length > 0 && (
                <View style={styles.resultSection}>
                  <View style={styles.resultSectionHeader}>
                    <Ionicons name="cube" size={16} color={colors.success} />
                    <Text style={[styles.resultSectionTitle, { color: colors.text }]}>Produtos ({filteredProducts.length})</Text>
                  </View>
                  {filteredProducts.map((product: any) => {
                    const hasPromo = product.promotionalPrice && product.promotionalPrice < product.price;
                    return (
                      <TouchableOpacity
                        key={product.id}
                        style={[styles.productItem, { backgroundColor: colors.card }]}
                        onPress={() => router.push(`/store/${product.store?.id}`)}
                      >
                        {product.imageUrl ? (
                          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                        ) : (
                          <View style={[styles.productImage, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="cube-outline" size={22} color={colors.gray} />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Ionicons name="storefront-outline" size={12} color={colors.gray} />
                            <Text style={[styles.productStore, { color: colors.textLight }]} numberOfLines={1}>{product.store?.name}</Text>
                          </View>
                          {product.category?.name && (
                            <Text style={{ fontSize: fonts.tiny, color: colors.gray, marginTop: 2 }}>{product.category.name}</Text>
                          )}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          {hasPromo ? (
                            <>
                              <Text style={{ fontSize: fonts.tiny, color: colors.gray, textDecorationLine: 'line-through' }}>
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
                          {!product.store?.isOpen && (
                            <Text style={{ fontSize: 9, color: colors.danger, marginTop: 2 }}>Fechado</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Empty state */}
              {!productsLoading && !hasResults && debouncedQuery.length >= 2 && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={56} color={colors.grayLight} />
                  <Text style={[styles.emptyText, { color: colors.textLight }]}>Nenhum resultado para "{debouncedQuery}"</Text>
                  <Text style={[styles.emptySubtext, { color: colors.gray }]}>Tente buscar com outras palavras</Text>
                </View>
              )}
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 12, gap: 12 },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', marginBottom: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: fonts.regular },
  filtersRow: { marginTop: 4 },
  filtersContent: { gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: { fontSize: fonts.tiny, fontWeight: '600' },

  // Idle state
  idleContent: { padding: 20, gap: 28 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: fonts.large, fontWeight: '600' },
  clearText: { fontSize: fonts.small, fontWeight: '500' },
  recentList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recentText: { fontSize: fonts.small },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    width: '30%',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 8,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: { fontSize: fonts.small, fontWeight: '500', textAlign: 'center' },

  // Promo cards (idle)
  promoCard: {
    width: 160,
    borderRadius: 14,
    marginRight: 10,
    overflow: 'hidden',
  },
  promoImage: { width: 160, height: 80 },
  promoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  promoBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  promoInfo: { padding: 8, gap: 2 },
  promoName: { fontSize: fonts.small, fontWeight: '600' },
  promoStore: { fontSize: fonts.tiny },
  promoPrice: { fontSize: fonts.small, fontWeight: '700' },

  // Promo cards (search results)
  promoCardSmall: {
    width: 180,
    borderRadius: 12,
    marginRight: 10,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  promoImageSmall: { width: 60, height: 60 },

  // Results
  resultsList: { padding: 16, gap: 4 },
  resultSection: { marginBottom: 20, gap: 10 },
  resultSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  resultSectionTitle: { fontSize: fonts.regular, fontWeight: '700' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 12 },
  loadingText: { fontSize: fonts.small },

  // Store result
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 12,
    marginBottom: 6,
  },
  storeLogo: { width: 52, height: 52, borderRadius: 12 },
  storeName: { fontSize: fonts.regular, fontWeight: '600' },
  storeDesc: { fontSize: fonts.tiny, marginTop: 2 },
  openBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  // Product result
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 12,
    marginBottom: 6,
  },
  productImage: { width: 52, height: 52, borderRadius: 10 },
  productName: { fontSize: fonts.regular, fontWeight: '600' },
  productStore: { fontSize: fonts.tiny },
  productPrice: { fontSize: fonts.regular, fontWeight: '700' },

  // Empty
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyText: { fontSize: fonts.regular, fontWeight: '500', textAlign: 'center' },
  emptySubtext: { fontSize: fonts.small, textAlign: 'center' },
});
