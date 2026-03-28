import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery, useLazyQuery } from '@apollo/client';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GET_STORES, SEARCH_PRODUCTS, SEARCH_SERVICES, GET_ACTIVE_PROMOTIONS } from '../../src/lib/graphql/queries';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../src/theme';
import { AnimatedListItem } from '../../src/components/AnimatedListItem';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { AnimatedItem } from '../../src/components/AnimatedItem';

type FilterType = 'all' | 'open' | 'free_delivery' | 'promo';
type TabType = 'products' | 'services';

const RECENT_PRODUCTS_KEY = 'recentSearches_products';
const RECENT_SERVICES_KEY = 'recentSearches_services';
const MAX_RECENT = 8;
const PRODUCT_CATEGORIES = [
  { label: 'Lanches', icon: 'fast-food-outline' as const, query: 'lanche,hamburguer,pizza,hot dog' },
  { label: 'Bebidas', icon: 'beer-outline' as const, query: 'bebida,refrigerante,suco,cerveja' },
  { label: 'Refeicoes', icon: 'restaurant-outline' as const, query: 'marmitex,prato,refeicao,comida' },
  { label: 'Carnes', icon: 'flame-outline' as const, query: 'carne,frango,linguica' },
  { label: 'Padaria', icon: 'cafe-outline' as const, query: 'pao,bolo,biscoito' },
  { label: 'Frutas', icon: 'nutrition-outline' as const, query: 'fruta,verdura,hortifruti' },
  { label: 'Mercearia', icon: 'basket-outline' as const, query: 'arroz,feijao,macarrao' },
  { label: 'Doces', icon: 'ice-cream-outline' as const, query: 'doce,chocolate,sorvete' },
  { label: 'Petshop', icon: 'paw-outline' as const, query: 'pet,racao,animal' },
  { label: 'Farmacia', icon: 'medkit-outline' as const, query: 'remedio,farmacia,medicamento' },
];

const SERVICE_CATEGORIES = [
  { label: 'Barbearia', icon: 'cut-outline' as const, query: 'barbearia' },
  { label: 'Saude', icon: 'medkit-outline' as const, query: 'saude' },
  { label: 'Informatica', icon: 'laptop-outline' as const, query: 'informatica' },
  { label: 'Eletrica', icon: 'flash-outline' as const, query: 'eletrica' },
  { label: 'Encanamento', icon: 'water-outline' as const, query: 'encanamento' },
  { label: 'Reformas', icon: 'hammer-outline' as const, query: 'reformas' },
  { label: 'Limpeza', icon: 'sparkles-outline' as const, query: 'limpeza' },
  { label: 'Beleza', icon: 'color-palette-outline' as const, query: 'beleza' },
  { label: 'Aulas', icon: 'school-outline' as const, query: 'aulas' },
  { label: 'Mecanica', icon: 'car-outline' as const, query: 'mecanica' },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [recentProducts, setRecentProducts] = useState<string[]>([]);
  const [recentServices, setRecentServices] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const swipeRef = useRef<ScrollView>(null);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const { data: storesData } = useQuery(GET_STORES);
  const { data: promosData } = useQuery(GET_ACTIVE_PROMOTIONS);
  const [searchProducts, { data: productsData, loading: productsLoading }] = useLazyQuery(SEARCH_PRODUCTS);
  const [searchServices, { data: servicesData, loading: servicesLoading }] = useLazyQuery(SEARCH_SERVICES);

  // Load recent searches
  useEffect(() => {
    AsyncStorage.getItem(RECENT_PRODUCTS_KEY).then((val) => {
      if (val) setRecentProducts(JSON.parse(val));
    });
    AsyncStorage.getItem(RECENT_SERVICES_KEY).then((val) => {
      if (val) setRecentServices(JSON.parse(val));
    });
  }, []);

  const recentSearches = activeTab === 'products' ? recentProducts : recentServices;

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
      searchServices({ variables: { query: debouncedQuery, limit: 30 } });
    }
  }, [debouncedQuery]);

  const saveRecentSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const key = activeTab === 'products' ? RECENT_PRODUCTS_KEY : RECENT_SERVICES_KEY;
    const current = activeTab === 'products' ? recentProducts : recentServices;
    const setter = activeTab === 'products' ? setRecentProducts : setRecentServices;
    const updated = [trimmed, ...current.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
    setter(updated);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  }, [activeTab, recentProducts, recentServices]);

  const clearRecentSearches = useCallback(async () => {
    const key = activeTab === 'products' ? RECENT_PRODUCTS_KEY : RECENT_SERVICES_KEY;
    const setter = activeTab === 'products' ? setRecentProducts : setRecentServices;
    setter([]);
    await AsyncStorage.removeItem(key);
  }, [activeTab]);

  function handleSearch(term: string) {
    setQuery(term);
    if (term.trim().length >= 2) saveRecentSearch(term);
  }

  function handleSubmit() {
    if (query.trim().length >= 2) saveRecentSearch(query);
  }

  const contentWidth = screenWidth - 20; // padding 10 each side

  function switchTab(tab: TabType) {
    setActiveTab(tab);
    setActiveFilter('all');
    Animated.timing(tabAnim, {
      toValue: tab === 'products' ? 0 : 1,
      useNativeDriver: false,
      duration: 150,
    }).start();
    swipeRef.current?.scrollTo({ x: tab === 'products' ? 0 : contentWidth, animated: false });
  }

  // Stores split by type
  const allStores = storesData?.stores || [];
  const productStores = allStores
    .filter((s: any) => !s.storeType || s.storeType === 'PRODUCTS')
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
  const serviceStores = allStores
    .filter((s: any) => s.storeType === 'SERVICES')
    .sort((a: any, b: any) => a.name.localeCompare(b.name));

  // Filter stores for search (by active tab context)
  const filteredStores = allStores.filter((s: any) => {
    if (!debouncedQuery) return false;
    const storeType = s.storeType || 'PRODUCTS';
    if (activeTab === 'products' && storeType !== 'PRODUCTS') return false;
    if (activeTab === 'services' && storeType !== 'SERVICES') return false;
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
    if (activeFilter === 'free_delivery') return false;
    if (activeFilter === 'promo') return p.promotionalPrice && p.promotionalPrice < p.price;
    return true;
  });

  // Filter services
  const allServices = servicesData?.searchServices || [];
  const filteredServices = allServices.filter((s: any) => {
    if (activeFilter === 'open') return s.store?.isOpen;
    return true;
  });

  // Promotions matching search
  const promotions = promosData?.activePromotions || [];
  const matchingPromos = debouncedQuery ? promotions.filter((p: any) =>
    p.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    (p.product?.name || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    (p.store?.name || '').toLowerCase().includes(debouncedQuery.toLowerCase()),
  ) : [];

  const hasResults = activeTab === 'products'
    ? filteredStores.length > 0 || filteredProducts.length > 0 || matchingPromos.length > 0
    : filteredStores.length > 0 || filteredServices.length > 0;
  const isSearching = debouncedQuery.length >= 2;

  const tabHalfWidth = (screenWidth - 20) / 2;
  const indicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, tabHalfWidth + 3],
  });

  function renderStoreCard(store: any, index: number) {
    return (
      <AnimatedListItem key={store.id} index={index}>
      <AnimatedPressable
        style={[styles.storeItem, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/store/${store.id}`)}
      >
        {store.logoUrl ? (
          <Image source={store.logoUrl} style={styles.storeLogo} cachePolicy="memory-disk" />
        ) : (
          <View style={[styles.storeLogo, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="storefront-outline" size={18} color={colors.gray} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.storeName, { color: colors.text }]} numberOfLines={1}>{store.name}</Text>
            {store.verificationLevel && store.verificationLevel !== 'NONE' && (
              <Text style={{ fontSize: 12 }}>
                {store.verificationLevel === 'BRONZE' ? '\u{1F949}' : store.verificationLevel === 'SILVER' ? '\u{1F948}' : store.verificationLevel === 'GOLD' ? '\u{1F947}' : '\u{1F48E}'}
              </Text>
            )}
          </View>
          {store.description ? (
            <Text style={[styles.storeDesc, { color: colors.textLight }]} numberOfLines={1}>{store.description}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
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
      </AnimatedPressable>
      </AnimatedListItem>
    );
  }

  function renderCategoriesAndStores(categories: typeof PRODUCT_CATEGORIES, stores: any[]) {
    return (
      <View>
        {/* Categories grid */}
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={[styles.categoryCard, { backgroundColor: colors.card }]}
              onPress={() => handleSearch(cat.query)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={cat.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.text }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stores list */}
        {stores.length > 0 && (
          <View style={{ marginTop: 20, gap: 6 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {categories === PRODUCT_CATEGORIES ? 'Lojas' : 'Prestadores'}
            </Text>
            {stores.map((store: any, index: number) => renderStoreCard(store, index))}
          </View>
        )}

        {stores.length === 0 && (
          <View style={{ marginTop: 20, alignItems: 'center', gap: 6 }}>
            <Ionicons
              name={categories === PRODUCT_CATEGORIES ? 'storefront-outline' : 'construct-outline'}
              size={40}
              color={colors.gray}
            />
            <Text style={{ fontSize: fonts.small, color: colors.textLight, textAlign: 'center' }}>
              {categories === PRODUCT_CATEGORIES
                ? 'Nenhuma loja de produtos disponivel'
                : 'Nenhum prestador de servicos disponivel'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Buscar</Text>
        <View style={{ zIndex: 999 }}>
          <View style={[styles.searchBox, { backgroundColor: colors.grayLight }]}>
            <Ionicons name="search" size={18} color={colors.gray} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar lojas, produtos, servicos..."
              placeholderTextColor={colors.gray}
              value={query}
              onChangeText={(t) => { setQuery(t); setShowRecent(false); }}
              onFocus={() => { if (!query && recentSearches.length > 0) setShowRecent(true); }}
              onBlur={() => { setTimeout(() => setShowRecent(false), 200); }}
              onSubmitEditing={() => { handleSubmit(); setShowRecent(false); }}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setShowRecent(recentSearches.length > 0); inputRef.current?.focus(); }}>
                <Ionicons name="close-circle" size={18} color={colors.gray} />
              </TouchableOpacity>
            )}
          </View>
          {showRecent && recentSearches.length > 0 && (
            <View style={[styles.recentDropdown, { backgroundColor: colors.card, borderColor: colors.grayLight }]}>
              <View style={styles.recentDropdownHeader}>
                <Text style={{ fontSize: fonts.tiny, color: colors.gray }}>Buscas recentes</Text>
                <TouchableOpacity onPress={() => { clearRecentSearches(); setShowRecent(false); }}>
                  <Text style={{ fontSize: fonts.tiny, color: colors.primary }}>Limpar</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.slice(0, 5).map((term, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.recentDropdownItem}
                  onPress={() => { handleSearch(term); setShowRecent(false); }}
                >
                  <Ionicons name="time-outline" size={14} color={colors.gray} />
                  <Text style={{ flex: 1, fontSize: fonts.small, color: colors.text }} numberOfLines={1}>{term}</Text>
                  <Ionicons name="arrow-forward-outline" size={14} color={colors.gray} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Tab bar - always visible */}
        <View style={[styles.tabBar, { backgroundColor: colors.grayLight }]}>
          <Animated.View
            style={[
              styles.tabIndicator,
              { backgroundColor: colors.primary, width: tabHalfWidth, left: indicatorLeft },
            ]}
          />
          <TouchableOpacity style={styles.tab} onPress={() => switchTab('products')}>
            <Ionicons name="storefront-outline" size={16} color={colors.text} />
            <Text style={[styles.tabText, { color: colors.text }]}>Produtos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => switchTab('services')}>
            <Ionicons name="construct-outline" size={16} color={colors.text} />
            <Text style={[styles.tabText, { color: colors.text }]}>Servicos</Text>
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        {isSearching && (
          <View style={styles.filtersRow}>
            {(activeTab === 'products' ? [
              { key: 'all' as FilterType, label: 'Todos', icon: 'grid-outline' as const },
              { key: 'open' as FilterType, label: 'Aberto', icon: 'time-outline' as const },
              { key: 'free_delivery' as FilterType, label: 'Frete gratis', icon: 'bicycle-outline' as const },
              { key: 'promo' as FilterType, label: 'Promocao', icon: 'pricetag-outline' as const },
            ] : [
              { key: 'all' as FilterType, label: 'Todos', icon: 'grid-outline' as const },
              { key: 'open' as FilterType, label: 'Aberto', icon: 'time-outline' as const },
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
          </View>
        )}
      </View>

      {/* Content — idle categories + stores always rendered, autocomplete overlays */}
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.idleContent} onScrollBeginDrag={() => { setShowRecent(false); }}>
          {/* Categories + stores — swipeable */}
          <ScrollView
            ref={swipeRef}
            horizontal
            snapToInterval={contentWidth}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / contentWidth);
              const newTab = page === 0 ? 'products' as TabType : 'services' as TabType;
              if (newTab !== activeTab) {
                setActiveTab(newTab);
                Animated.timing(tabAnim, {
                  toValue: page,
                  useNativeDriver: false,
                  duration: 150,
                }).start();
              }
            }}
          >
            <View style={{ width: contentWidth }}>
              {renderCategoriesAndStores(PRODUCT_CATEGORIES, productStores)}
            </View>
            <View style={{ width: contentWidth }}>
              {renderCategoriesAndStores(SERVICE_CATEGORIES, serviceStores)}
            </View>
          </ScrollView>

          {/* Promotions highlight */}
          {promotions.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ofertas do momento</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {promotions.slice(0, 6).map((promo: any, index: number) => {
                  const discount = promo.product?.price && promo.promotionalPrice
                    ? Math.round((1 - promo.promotionalPrice / promo.product.price) * 100) : 0;
                  return (
                    <AnimatedListItem key={promo.id} index={index}>
                    <AnimatedPressable
                      style={[styles.promoCard, { backgroundColor: colors.card }]}
                      onPress={() => router.push(`/promotion/${promo.id}`)}
                    >
                      {(promo.product?.imageUrl || promo.imageUrl) ? (
                        <Image source={promo.product?.imageUrl || promo.imageUrl} style={styles.promoImage} cachePolicy="memory-disk" />
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
                      <View style={styles.promoInfo}>
                        <Text style={[styles.promoName, { color: colors.text }]} numberOfLines={1}>{promo.title}</Text>
                        <Text style={[styles.promoStore, { color: colors.textLight }]} numberOfLines={1}>{promo.store?.name}</Text>
                        {promo.promotionalPrice && (
                          <Text style={[styles.promoPrice, { color: colors.primary }]}>R$ {Number(promo.promotionalPrice).toFixed(2)}</Text>
                        )}
                      </View>
                    </AnimatedPressable>
                    </AnimatedListItem>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Autocomplete overlay */}
        {isSearching && (
          <View style={[styles.autocompleteOverlay, { backgroundColor: colors.background }]}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 10 }}>
              {(productsLoading || servicesLoading) && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textLight }]}>Buscando...</Text>
                </View>
              )}

              {/* Stores first */}
              {filteredStores.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((store: any, index: number) => (
                <AnimatedListItem key={`store-${store.id}`} index={index}>
                <AnimatedPressable
                  style={[styles.acItem, { backgroundColor: colors.card }]}
                  onPress={() => { setQuery(''); router.push(`/store/${store.id}`); }}
                >
                  {store.logoUrl ? (
                    <Image source={store.logoUrl} style={styles.acLogo} cachePolicy="memory-disk" />
                  ) : (
                    <View style={[styles.acLogo, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="storefront-outline" size={16} color={colors.gray} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.acName, { color: colors.text }]} numberOfLines={1}>{store.name}</Text>
                    <Text style={{ fontSize: fonts.tiny, color: colors.gray }}>
                      {(store.storeType || 'PRODUCTS') === 'PRODUCTS' ? 'Loja' : 'Prestador'}
                    </Text>
                  </View>
                  <View style={[styles.acBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="storefront" size={12} color={colors.primary} />
                  </View>
                </AnimatedPressable>
                </AnimatedListItem>
              ))}

              {/* Products (products tab) — sorted alphabetically */}
              {activeTab === 'products' && filteredProducts
                .sort((a: any, b: any) => a.name.localeCompare(b.name))
                .map((product: any, index: number) => {
                  const hasPromo = product.promotionalPrice && product.promotionalPrice < product.price;
                  return (
                    <AnimatedListItem key={`prod-${product.id}`} index={filteredStores.length + index}>
                    <AnimatedPressable
                      style={[styles.acItem, { backgroundColor: colors.card }]}
                      onPress={() => { setQuery(''); router.push(`/store/${product.store?.id}`); }}
                    >
                      {product.imageUrl ? (
                        <Image source={product.imageUrl} style={styles.acLogo} cachePolicy="memory-disk" />
                      ) : (
                        <View style={[styles.acLogo, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="cube-outline" size={16} color={colors.gray} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.acName, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
                        <Text style={{ fontSize: fonts.tiny, color: colors.gray }} numberOfLines={1}>{product.store?.name}</Text>
                      </View>
                      <Text style={{ fontSize: fonts.small, fontWeight: '700', color: hasPromo ? colors.success : colors.text }}>
                        R$ {Number(hasPromo ? product.promotionalPrice : product.price).toFixed(2)}
                      </Text>
                    </AnimatedPressable>
                    </AnimatedListItem>
                  );
                })}

              {/* Services (services tab) — sorted alphabetically */}
              {activeTab === 'services' && filteredServices
                .sort((a: any, b: any) => a.name.localeCompare(b.name))
                .map((service: any, index: number) => (
                  <AnimatedListItem key={`svc-${service.id}`} index={filteredStores.length + index}>
                  <AnimatedPressable
                    style={[styles.acItem, { backgroundColor: colors.card }]}
                    onPress={() => { setQuery(''); router.push(`/store/${service.store?.id}`); }}
                  >
                    {service.imageUrl ? (
                      <Image source={service.imageUrl} style={styles.acLogo} cachePolicy="memory-disk" />
                    ) : (
                      <View style={[styles.acLogo, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="construct-outline" size={16} color={colors.gray} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.acName, { color: colors.text }]} numberOfLines={1}>{service.name}</Text>
                      <Text style={{ fontSize: fonts.tiny, color: colors.gray }} numberOfLines={1}>{service.store?.name}</Text>
                    </View>
                    {service.requiresQuote ? (
                      <Text style={{ fontSize: fonts.tiny, color: colors.primary, fontWeight: '600' }}>Orcamento</Text>
                    ) : service.price ? (
                      <Text style={{ fontSize: fonts.small, fontWeight: '700', color: colors.text }}>
                        R$ {Number(service.price).toFixed(2)}
                      </Text>
                    ) : null}
                  </AnimatedPressable>
                  </AnimatedListItem>
                ))}

              {/* Empty state */}
              {!(productsLoading || servicesLoading) && !hasResults && debouncedQuery.length >= 2 && (
                <AnimatedItem delay={100} fromY={20}>
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={56} color={colors.grayLight} />
                  <Text style={[styles.emptyText, { color: colors.textLight }]}>Nenhum resultado para "{debouncedQuery}"</Text>
                  <Text style={[styles.emptySubtext, { color: colors.gray }]}>Tente buscar com outras palavras</Text>
                </View>
                </AnimatedItem>
              )}
            </ScrollView>
          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 10, paddingBottom: 12, gap: 6 },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', marginBottom: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: fonts.regular },
  filtersRow: { marginTop: 4, flexDirection: 'row', gap: 6 },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: { fontSize: fonts.tiny, fontWeight: '600' },

  // Recent dropdown (floats below searchBox)
  recentDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 10,
    zIndex: 999,
  },
  recentDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recentDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  // Idle state
  idleContent: { padding: 10, gap: 28 },
  section: { gap: 6 },
  sectionTitle: { fontSize: fonts.large, fontWeight: '600' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    zIndex: 1,
  },
  tabText: { fontSize: fonts.small, fontWeight: '600' },

  // Categories
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  categoryCard: {
    width: '18%',
    alignItems: 'center',
    padding: 4,
    borderRadius: 8,
    gap: 2,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: { fontSize: 8, fontWeight: '500', textAlign: 'center' },

  // Promo cards (idle)
  promoCard: {
    width: 160,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  promoImage: { width: 160, height: 56 },
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

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 12 },
  loadingText: { fontSize: fonts.small },

  // Store result (idle list)
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  storeLogo: { width: 52, height: 52, borderRadius: 10 },
  storeName: { fontSize: fonts.regular, fontWeight: '600' },
  storeDesc: { fontSize: fonts.tiny, marginTop: 2 },
  openBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  // Autocomplete overlay
  autocompleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  acItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
  },
  acLogo: { width: 40, height: 40, borderRadius: 8 },
  acName: { fontSize: fonts.regular, fontWeight: '600' },
  acBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 6, paddingHorizontal: 32 },
  emptyText: { fontSize: fonts.regular, fontWeight: '500', textAlign: 'center' },
  emptySubtext: { fontSize: fonts.small, textAlign: 'center' },
});
