import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { listPerfProps, imageCachePolicy } from '../../src/lib/deviceTier'; // Perf (F0)
import { AnimatedListItem } from '../../src/components/AnimatedListItem';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { AnimatedItem } from '../../src/components/AnimatedItem';
import ReAnimated, { FadeIn, FadeOut, FadeInDown, FadeInRight, FadeOutRight } from 'react-native-reanimated';

type FilterType = 'all' | 'open' | 'free_delivery' | 'promo';
type TabType = 'products' | 'services';

// KAN-255: tipo estrutural comum a PRODUCT_CATEGORIES e SERVICE_CATEGORIES.
// Antes o parametro de renderCategoriesAndStores era `typeof PRODUCT_CATEGORIES`,
// o que travava os literais de `icon` do primeiro array e impedia passar o
// segundo (icones diferentes).
type CategoryItem = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  query: string;
};

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

// KAN-255: era `typeof PRODUCT_CATEGORIES[number]`, que so aceitava categorias
// de produto — categorias de servico (outros icones) nao passavam.
type CategoryType = CategoryItem;

// Perf (F6): tamanho da pagina da vitrine de lojas e da busca de lojas.
const PAGINA_LOJAS = 20;
// Teto das promocoes nesta tela — o carrossel exibe 6.
const LIMITE_PROMOS_BUSCA = 6;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [activeCategory, setActiveCategory] = useState<CategoryType | null>(null);
  const [recentProducts, setRecentProducts] = useState<string[]>([]);
  const [recentServices, setRecentServices] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // O servidor le `storeType` nulo como PRODUCTS, igual a tela fazia com
  // `s.storeType || 'PRODUCTS'`.
  const tipoDaAba = activeTab === 'products' ? 'PRODUCTS' : 'SERVICES';

  // Perf (F6): a vitrine agora vem paginada e filtrada por tipo NO SERVIDOR.
  // Antes esta query baixava a tabela de lojas ativas inteira e a tela fazia
  // todo o resto no cliente — cada loja nova entrava na carga de todo mundo,
  // para sempre.
  const { data: storesData, fetchMore: fetchMoreStores } = useQuery(GET_STORES, {
    variables: { storeType: tipoDaAba, limit: PAGINA_LOJAS, offset: 0 },
  });

  // Busca de lojas do autocomplete: query propria, com os MESMOS criterios que o
  // filtro client-side aplicava (nome ou descricao, tipo da aba, e o chip de
  // "aberto" / "frete gratis"). O `skip` enquanto nao ha termo reproduz o antigo
  // `if (!debouncedQuery) return false`.
  const { data: buscaLojasData } = useQuery(GET_STORES, {
    variables: {
      search: debouncedQuery,
      storeType: tipoDaAba,
      onlyOpen: activeFilter === 'open' ? true : undefined,
      onlyFreeDelivery: activeFilter === 'free_delivery' ? true : undefined,
      limit: PAGINA_LOJAS,
      offset: 0,
    },
    skip: !debouncedQuery,
  });
  // Perf (F6): esta tela mostra no maximo 6 promocoes (o carrossel corta em 6),
  // mas baixava a lista inteira de promocoes ativas. Agora pede 6.
  //
  // ATENCAO para quem mexer aqui: este limite tambem define quantas promocoes
  // podem aparecer no overlay de busca, porque `matchingPromos` (abaixo)
  // filtra ESTA lista — nao faz uma busca propria no servidor. Uma promocao
  // fora destas 6 nao casa com o termo nem que exista. Se a busca por oferta
  // virar importante, o certo e uma query de busca de promocao no servidor, e
  // nao aumentar este numero (foi por baixar a lista inteira que o limite
  // existe).
  //
  // KAN-297: antes, a promocao casada alimentava SO o `hasResults` e nao era
  // desenhada em lugar nenhum — termo que casava so com promocao dava overlay
  // em branco. Agora ela e um item do overlay (tipo 'promo').
  const { data: promosData } = useQuery(GET_ACTIVE_PROMOTIONS, {
    variables: { limit: LIMITE_PROMOS_BUSCA, offset: 0 },
  });
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

  // Search when debounced query changes or category changes
  useEffect(() => {
    if (activeCategory) {
      const searchTerm = debouncedQuery.length >= 2
        ? `${activeCategory.query},${debouncedQuery}`
        : activeCategory.query;
      searchProducts({ variables: { query: searchTerm, limit: 100 } });
      searchServices({ variables: { query: searchTerm, limit: 100 } });
    } else if (debouncedQuery.length >= 2) {
      searchProducts({ variables: { query: debouncedQuery, limit: 30 } });
      searchServices({ variables: { query: debouncedQuery, limit: 30 } });
    }
  }, [debouncedQuery, activeCategory]);

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

  function handleCategorySelect(cat: CategoryType) {
    if (activeCategory?.label === cat.label) {
      setActiveCategory(null);
      setQuery('');
    } else {
      setActiveCategory(cat);
      setQuery('');
    }
  }


  function switchTab(tab: TabType) {
    setActiveTab(tab);
    setActiveFilter('all');
    setActiveCategory(null);
    setQuery('');
    Animated.timing(tabAnim, {
      toValue: tab === 'products' ? 0 : 1,
      useNativeDriver: false,
      duration: 150,
    }).start();

  }

  // Perf (F3): TODOS os pipelines filter/sort abaixo eram recalculados no corpo
  // do render — a cada tecla digitada, ate ~100 itens eram re-filtrados e
  // re-ordenados com localeCompare (caro) na thread JS, causando input lag.
  // Agora cada derivado so recalcula quando seus inputs reais mudam, e os sorts
  // operam sobre copia dentro do useMemo (nada de mutacao durante o render).

  // Perf (F6): a lista ja vem do servidor filtrada pelo tipo da aba e na ordem do
  // ranking pago — o servidor rankeia o conjunto INTEIRO e devolve o recorte,
  // entao paginar nao mexe em QUAL loja aparece primeiro. Isso e regra comercial
  // (ver KAN-281), nao detalhe de implementacao, e por isso nao virou ORDER BY.
  // Nao ha mais filtro nem sort de loja no cliente.
  const idleStores = useMemo(() => storesData?.stores || [], [storesData?.stores]);

  // Perf (F6): paginacao por scroll da vitrine. Mesmo padrao das outras telas
  // (orders/deliveries/loja): o fim da lista vem do TAMANHO DA ULTIMA PAGINA
  // recebida, nunca de `length % PAGINA === 0` — essa inferencia quebra quando a
  // lista encolhe e faz requisicao infinita quando o total e multiplo exato.
  const [temMaisLojas, setTemMaisLojas] = useState(true);
  // Trocar de aba troca o conjunto: a paginacao recomeca.
  useEffect(() => { setTemMaisLojas(true); }, [activeTab]);

  const carregarMaisLojas = useCallback(() => {
    if (!temMaisLojas || idleStores.length === 0) return;
    fetchMoreStores({
      variables: { storeType: tipoDaAba, limit: PAGINA_LOJAS, offset: idleStores.length },
    })
      .then((res: any) => {
        if ((res?.data?.stores?.length ?? 0) < PAGINA_LOJAS) setTemMaisLojas(false);
      })
      .catch(() => {});
  }, [temMaisLojas, idleStores.length, fetchMoreStores, tipoDaAba]);

  // Filter stores for search (by active tab context)
  // Perf (F6): o servidor ja devolve filtrado (nome/descricao, tipo, chip) e
  // ordenado por nome — a mesma ordem que o .sort() daqui produzia. De brinde, a
  // busca do servidor usa unaccent, igual a de produtos: "acai" passou a achar
  // "Acai" com cedilha e til, o que o includes() cru nao achava.
  const filteredStores = useMemo(() => buscaLojasData?.stores || [], [buscaLojasData?.stores]);

  // Filter products (ordenado aqui — o .sort() que existia no JSX foi removido)
  const allProducts = useMemo(() => productsData?.searchProducts || [], [productsData?.searchProducts]);
  const filteredProducts = useMemo(() => {
    if (activeCategory) {
      return allProducts
        .filter((p: any) => {
          const catName = (p.category?.name || '').toLowerCase();
          const keywords = activeCategory.query.toLowerCase().split(',');
          return keywords.some((kw: string) => catName.includes(kw.trim())) || catName.includes(activeCategory.label.toLowerCase());
        })
        .filter((p: any) => !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
    return allProducts
      .filter((p: any) => {
        if (activeFilter === 'open') return p.store?.isOpen;
        if (activeFilter === 'free_delivery') return false;
        if (activeFilter === 'promo') return p.promotionalPrice && p.promotionalPrice < p.price;
        return true;
      })
      .slice()
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [allProducts, activeCategory, query, activeFilter]);

  // Filter services (idem)
  const allServices = useMemo(() => servicesData?.searchServices || [], [servicesData?.searchServices]);
  const filteredServices = useMemo(() => {
    if (activeCategory) {
      return allServices
        .filter((s: any) => {
          const catName = (s.category?.name || '').toLowerCase();
          const keywords = activeCategory.query.toLowerCase().split(',');
          return keywords.some((kw: string) => catName.includes(kw.trim())) || catName.includes(activeCategory.label.toLowerCase());
        })
        .filter((s: any) => !query.trim() || s.name.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
    return allServices
      .filter((s: any) => {
        if (activeFilter === 'open') return s.store?.isOpen;
        return true;
      })
      .slice()
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [allServices, activeCategory, query, activeFilter]);

  // Promotions matching search
  const promotions = promosData?.activePromotions || [];
  const matchingPromos = useMemo(() => (debouncedQuery ? promotions.filter((p: any) =>
    p.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    (p.product?.name || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    (p.store?.name || '').toLowerCase().includes(debouncedQuery.toLowerCase()),
  ) : []), [promotions, debouncedQuery]);

  const isSearching = debouncedQuery.length >= 2;
  const isCategoryMode = activeCategory !== null;
  const categoryItems = activeTab === 'products' ? filteredProducts : filteredServices;

  // Perf (F4): o overlay de autocomplete era um ScrollView com tres .map
  // (lojas + produtos OU servicos). Com limit 100 em cada query davam ate ~200
  // linhas montadas de uma vez, cada uma com imagem — na tela em que o usuario
  // esta DIGITANDO, que e o pior lugar possivel para segurar a thread de JS.
  //
  // Para virtualizar com um FlatList so (e nao tres aninhados, que desligariam a
  // virtualizacao), as tres secoes viram UMA lista heterogenea, com o tipo
  // marcado em cada item. A ordem e a mesma de antes — lojas primeiro, depois
  // produtos ou servicos conforme a aba — e as chaves tambem (store-/prod-/svc-),
  // entao o indice do FlatList ja coincide com o stagger que o codigo antigo
  // calculava a mao (filteredStores.length + index).
  type ItemAutocomplete =
    | { tipo: 'promo'; key: string; dado: any }
    | { tipo: 'store'; key: string; dado: any }
    | { tipo: 'product'; key: string; dado: any }
    | { tipo: 'service'; key: string; dado: any };

  const autocompleteItems = useMemo<ItemAutocomplete[]>(() => {
    // KAN-297: a promocao casada agora É RENDERIZADA.
    //
    // O bug: `matchingPromos` filtrava as promocoes pelo termo e alimentava SO
    // o `hasResults`, que suprime o "Nenhum resultado". Promocao nao era
    // desenhada em lugar nenhum do overlay. Quando o termo casava SO com uma
    // promocao, dava tela em branco: lista vazia E mensagem suprimida. Alguem
    // escreveu o filtro e ligou no hasResults, mas a secao nunca foi criada.
    //
    // Entram PRIMEIRO de proposito: promocao e canal pago (tem adCost), quem
    // digita "picanha" quer ver a oferta de picanha, e o lojista esta pagando
    // justamente por essa posicao.
    const lista: ItemAutocomplete[] =
      activeTab === 'products'
        ? matchingPromos.map((promo: any) => ({
            tipo: 'promo' as const,
            key: `promo-${promo.id}`,
            dado: promo,
          }))
        : [];
    for (const store of filteredStores) {
      lista.push({ tipo: 'store' as const, key: `store-${store.id}`, dado: store });
    }
    if (activeTab === 'products') {
      for (const product of filteredProducts) {
        lista.push({ tipo: 'product' as const, key: `prod-${product.id}`, dado: product });
      }
    } else {
      for (const service of filteredServices) {
        lista.push({ tipo: 'service' as const, key: `svc-${service.id}`, dado: service });
      }
    }
    return lista;
  }, [matchingPromos, filteredStores, filteredProducts, filteredServices, activeTab]);

  const renderAutocompleteItem = useCallback(
    ({ item, index }: { item: ItemAutocomplete; index: number }) => {
      if (item.tipo === 'promo') {
        const promo = item.dado;
        const precoCheio = Number(promo.product?.price) || 0;
        const precoPromo = Number(promo.promotionalPrice) || 0;
        const desconto =
          precoCheio > 0 && precoPromo > 0 ? Math.round((1 - precoPromo / precoCheio) * 100) : 0;
        return (
          <AnimatedListItem index={index}>
            <AnimatedPressable
              style={[styles.acItem, { backgroundColor: colors.card }]}
              onPress={() => { setQuery(''); router.push(`/promotion/${promo.id}`); }}
            >
              {(promo.product?.imageUrl || promo.imageUrl) ? (
                <Image
                  source={promo.product?.imageUrl || promo.imageUrl}
                  style={styles.acLogo}
                  cachePolicy={imageCachePolicy}
                />
              ) : (
                <View style={[styles.acLogo, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="megaphone-outline" size={16} color="#FFFFFF" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.acName, { color: colors.text }]} numberOfLines={1}>
                  {promo.title}
                </Text>
                <Text style={{ fontSize: fonts.tiny, color: colors.gray }} numberOfLines={1}>
                  {/* Diz que é oferta: sem isto a linha some entre produtos e
                      lojas, e o cliente não entende por que ela está no topo. */}
                  Oferta{promo.store?.name ? ` · ${promo.store.name}` : ''}
                </Text>
              </View>
              {desconto > 0 && (
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>-{desconto}%</Text>
                </View>
              )}
              {precoPromo > 0 && (
                <Text style={{ fontSize: fonts.small, fontWeight: '700', color: colors.success, marginLeft: 8 }}>
                  R$ {precoPromo.toFixed(2)}
                </Text>
              )}
            </AnimatedPressable>
          </AnimatedListItem>
        );
      }

      if (item.tipo === 'store') {
        const store = item.dado;
        return (
          <AnimatedListItem index={index}>
            <AnimatedPressable
              style={[styles.acItem, { backgroundColor: colors.card }]}
              onPress={() => { setQuery(''); router.push(`/store/${store.id}`); }}
            >
              {store.logoUrl ? (
                <Image source={store.logoUrl} style={styles.acLogo} cachePolicy={imageCachePolicy} />
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
        );
      }

      if (item.tipo === 'product') {
        const product = item.dado;
        const hasPromo = product.promotionalPrice && product.promotionalPrice < product.price;
        return (
          <AnimatedListItem index={index}>
            <AnimatedPressable
              style={[styles.acItem, { backgroundColor: colors.card }]}
              onPress={() => { setQuery(''); router.push(`/store/${product.store?.id}`); }}
            >
              {product.imageUrl ? (
                <Image source={product.imageUrl} style={styles.acLogo} cachePolicy={imageCachePolicy} />
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
      }

      const service = item.dado;
      return (
        <AnimatedListItem index={index}>
          <AnimatedPressable
            style={[styles.acItem, { backgroundColor: colors.card }]}
            onPress={() => { setQuery(''); router.push(`/store/${service.store?.id}`); }}
          >
            {service.imageUrl ? (
              <Image source={service.imageUrl} style={styles.acLogo} cachePolicy={imageCachePolicy} />
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
      );
    },
    [colors, router],
  );
  const hasResults = activeTab === 'products'
    ? filteredStores.length > 0 || filteredProducts.length > 0 || matchingPromos.length > 0
    : filteredStores.length > 0 || filteredServices.length > 0;
  const hasCategoryResults = categoryItems.length > 0;

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
          <Image source={store.logoUrl} style={styles.storeLogo} cachePolicy={imageCachePolicy} />
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

  // Perf (F4): renderCategoriesAndStores montava TODAS as lojas da plataforma de
  // uma vez (`stores.map`), cada card com logo, dentro de um ScrollView. Hoje sao
  // dezenas; isso cresce com o cadastro e nunca encolhe, e e a primeira coisa que
  // a aba de busca mostra. Foi quebrada em cabecalho + lista para a lista virar
  // FlatList: a grade de categorias (10 itens fixos) e as promocoes (cortadas em
  // 6) viram header e footer, e so as lojas virtualizam.
  function renderCategoriesGrid(categories: CategoryItem[], stores: any[]) {
    return (
      <View>
        {/* Categories grid */}
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              style={[styles.categoryCard, { backgroundColor: colors.card }]}
              onPress={() => handleCategorySelect(cat)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={cat.icon} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.text }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Titulo da lista — so quando ha loja para listar, como antes */}
        {stores.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {categories === PRODUCT_CATEGORIES ? 'Lojas' : 'Prestadores'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  function renderSemLojas(categories: CategoryItem[]) {
    return (
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
    );
  }

  function renderCategoryItem(item: any, index: number) {
    const isProduct = activeTab === 'products';
    const hasPromo = isProduct && item.promotionalPrice && item.promotionalPrice < item.price;
    return (
      <AnimatedListItem key={item.id} index={index}>
        <AnimatedPressable
          style={[styles.acItem, { backgroundColor: colors.card }]}
          onPress={() => router.push(`/store/${item.store?.id}`)}
        >
          {item.imageUrl ? (
            <Image source={item.imageUrl} style={styles.acLogo} cachePolicy={imageCachePolicy} />
          ) : (
            <View style={[styles.acLogo, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name={isProduct ? 'cube-outline' : 'construct-outline'} size={16} color={colors.gray} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.acName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={{ fontSize: fonts.tiny, color: colors.gray }} numberOfLines={1}>{item.store?.name}</Text>
          </View>
          {isProduct ? (
            <Text style={{ fontSize: fonts.small, fontWeight: '700', color: hasPromo ? colors.success : colors.text }}>
              R$ {Number(hasPromo ? item.promotionalPrice : item.price).toFixed(2)}
            </Text>
          ) : item.requiresQuote ? (
            <Text style={{ fontSize: fonts.tiny, color: colors.primary, fontWeight: '600' }}>Orcamento</Text>
          ) : item.price ? (
            <Text style={{ fontSize: fonts.small, fontWeight: '700', color: colors.text }}>
              R$ {Number(item.price).toFixed(2)}
            </Text>
          ) : null}
        </AnimatedPressable>
      </AnimatedListItem>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Buscar</Text>
        <View style={{ zIndex: 999 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.searchBox, { backgroundColor: colors.grayLight, flex: 1 }]}>
              <Ionicons name="search" size={18} color={colors.gray} />
              <TextInput
                ref={inputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={activeCategory ? `Buscar em ${activeCategory.label}...` : 'Buscar lojas, produtos, servicos...'}
                placeholderTextColor={colors.gray}
                value={query}
                onChangeText={(t) => { setQuery(t); setShowRecent(false); }}
                onFocus={() => { if (!query && recentSearches.length > 0 && !activeCategory) setShowRecent(true); }}
                onBlur={() => { setTimeout(() => setShowRecent(false), 200); }}
                onSubmitEditing={() => { handleSubmit(); setShowRecent(false); }}
                returnKeyType="search"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setQuery('');
                  if (!activeCategory) setShowRecent(recentSearches.length > 0);
                  inputRef.current?.focus();
                }}>
                  <Ionicons name="close-circle" size={18} color={colors.gray} />
                </TouchableOpacity>
              )}
            </View>
            {/* Active category chip — slides in from right */}
            {activeCategory && (
              <ReAnimated.View entering={FadeInRight.duration(250)} exiting={FadeOutRight.duration(200)}>
                <TouchableOpacity
                  style={[styles.activeCategoryChip, { backgroundColor: colors.primary }]}
                  onPress={() => { setActiveCategory(null); setQuery(''); }}
                >
                  <Ionicons name={activeCategory.icon as any} size={20} color="#FFF" />
                  {/* UX: badge de X — sem ele o usuario nao sabia que tocar aqui
                      desfaz a categoria e volta pra busca normal. */}
                  <View style={styles.activeCategoryClose}>
                    <Ionicons name="close" size={12} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              </ReAnimated.View>
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

        {/* Filter chips - only when text searching without category */}
        {isSearching && !isCategoryMode && (
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

      {/* Content */}
      <View style={{ flex: 1 }}>
        {/* Category results view */}
        {isCategoryMode ? (
          <ReAnimated.View entering={FadeInDown.duration(300)} exiting={FadeOut.duration(200)} style={{ flex: 1 }}>
            {/* Perf (F4): era ScrollView + .map — com limit 100, TODOS os
                resultados (cada um com imagem) montavam na memoria de uma vez.
                FlatList virtualiza: so a janela visivel existe; RAM cai e a
                digitacao para de engasgar. Knobs vem do deviceTier (F0). */}
            <FlatList
              data={categoryItems}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item, index }) => renderCategoryItem(item, index)}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 10 }}
              {...listPerfProps}
              ListHeaderComponent={(productsLoading || servicesLoading) ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textLight }]}>Buscando...</Text>
                </View>
              ) : null}
              ListEmptyComponent={!(productsLoading || servicesLoading) ? (
                <AnimatedItem delay={100} fromY={20}>
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={56} color={colors.grayLight} />
                    <Text style={[styles.emptyText, { color: colors.textLight }]}>
                      {query.trim()
                        ? `Nenhum resultado para "${query}" em ${activeCategory.label}`
                        : `Nenhum item em ${activeCategory.label}`}
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.gray }]}>
                      {query.trim() ? 'Tente buscar com outras palavras' : 'Tente outra categoria'}
                    </Text>
                  </View>
                </AnimatedItem>
              ) : null}
            />
          </ReAnimated.View>
        ) : (
          <>
            {/* Idle: categories + stores + promos */}
            <FlatList
              data={idleStores}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item, index }) => renderStoreCard(item, index)}
              contentContainerStyle={styles.idleList}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
              onScrollBeginDrag={() => { setShowRecent(false); }}
              {...listPerfProps}
              onEndReached={carregarMaisLojas}
              onEndReachedThreshold={0.4}
              ListHeaderComponent={
                activeTab === 'products'
                  ? renderCategoriesGrid(PRODUCT_CATEGORIES, idleStores)
                  : renderCategoriesGrid(SERVICE_CATEGORIES, idleStores)
              }
              ListEmptyComponent={
                activeTab === 'products'
                  ? renderSemLojas(PRODUCT_CATEGORIES)
                  : renderSemLojas(SERVICE_CATEGORIES)
              }
              ListFooterComponent={
                <View style={{ marginTop: 28 }}>
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
                            <Image source={promo.product?.imageUrl || promo.imageUrl} style={styles.promoImage} cachePolicy={imageCachePolicy} />
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
                </View>
              }
            />

            {/* Autocomplete overlay — only for text search without category */}
            {isSearching && (
              <View style={[styles.autocompleteOverlay, { backgroundColor: colors.background }]}>
                <FlatList
                  data={autocompleteItems}
                  keyExtractor={(item) => item.key}
                  renderItem={renderAutocompleteItem}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ padding: 10 }}
                  {...listPerfProps}
                  ListHeaderComponent={(productsLoading || servicesLoading) ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.loadingText, { color: colors.textLight }]}>Buscando...</Text>
                    </View>
                  ) : null}
                  ListEmptyComponent={
                    /* `hasResults` inclui as promocoes casadas, e agora elas
                       ESTAO nesta lista (KAN-297) — logo, "nada a mostrar" e
                       "nenhum resultado" voltaram a ser a mesma coisa, e nao
                       existe mais o caso de overlay vazio e silencioso. */
                    !(productsLoading || servicesLoading) && !hasResults && debouncedQuery.length >= 2 ? (
                      <AnimatedItem delay={100} fromY={20}>
                        <View style={styles.emptyContainer}>
                          <Ionicons name="search-outline" size={56} color={colors.grayLight} />
                          <Text style={[styles.emptyText, { color: colors.textLight }]}>Nenhum resultado para "{debouncedQuery}"</Text>
                          <Text style={[styles.emptySubtext, { color: colors.gray }]}>Tente buscar com outras palavras</Text>
                        </View>
                      </AnimatedItem>
                    ) : null
                  }
                />
              </View>
            )}
          </>
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

  // Active category chip
  activeCategoryChip: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCategoryClose: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    // sombra leve pra destacar do chip
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },

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
  // Conteudo do idle. O ScrollView antigo usava `gap: 28` para separar os dois
  // blocos (categorias+lojas e promocoes); com o FlatList (Perf F4) o
  // espacamento entre cards vem do ItemSeparatorComponent (6, como era) e o dos
  // blocos vem da margem do rodape (28, como era), entao aqui sobra o padding.
  idleList: { padding: 10 },
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
