import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import * as Network from 'expo-network';
import * as LocalAuthentication from 'expo-local-authentication';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useLazyQuery, useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCart } from '../src/contexts/CartContext';
import { useAlert } from '../src/contexts/AlertContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { CREATE_ORDER, SAVE_CARD } from '../src/lib/graphql/mutations';
import { CALCULATE_DELIVERY_FEE, GET_MY_ADDRESSES, GET_STORE, ESTIMATE_DELIVERY_TIME, LIST_MY_CARDS, GET_MINIMUM_ORDER_PLATFORM } from '../src/lib/graphql/queries';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../src/theme';

const PAGARME_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAGARME_PUBLIC_KEY || '';

function luhnCheck(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function isExpired(month: number, year: number): boolean {
  const now = new Date();
  return new Date(year, month, 0) < now;
}

function detectBrand(number: string): string {
  const d = number.replace(/\D/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'Mastercard';
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(d)) return 'Elo';
  return '';
}

function formatCardNumber(text: string) {
  const digits = text.replace(/\D/g, '').substring(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(text: string) {
  const digits = text.replace(/\D/g, '').substring(0, 4);
  if (digits.length > 2) return digits.substring(0, 2) + '/' + digits.substring(2);
  return digits;
}

function formatCep(text: string) {
  const digits = text.replace(/\D/g, '').substring(0, 8);
  if (digits.length > 5) return digits.substring(0, 5) + '-' + digits.substring(5);
  return digits;
}

function getBrandColor(brand: string): string {
  const b = (brand || '').toLowerCase();
  if (b.includes('visa')) return '#1a1f71';
  if (b.includes('master')) return '#eb001b';
  if (b.includes('elo')) return '#00a4e0';
  return '#6b7280';
}

type PaymentMethod = 'ON_DELIVERY' | 'CREDIT_CARD' | 'PIX';
type DeliveryType = 'DELIVERY' | 'PICKUP';

interface CheckoutItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isVariableWeight?: boolean;
  weightGrams?: number;
}

const ALL_PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: string; description: string; requiresOwnDelivery?: boolean }[] = [
  { key: 'ON_DELIVERY', label: 'Na entrega', icon: 'cash-outline', description: 'Pague ao receber', requiresOwnDelivery: true },
  { key: 'CREDIT_CARD', label: 'Cartao de Credito', icon: 'card-outline', description: 'Pague com cartao salvo ou novo' },
  { key: 'PIX', label: 'PIX', icon: 'qr-code-outline', description: 'Pagamento instantaneo' },
];

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const params = useLocalSearchParams<{ storeId: string; storeName: string; selectedItems: string }>();
  const { removeItem, refetch: refetchCart } = useCart();
  const { alert } = useAlert();

  const storeId = params.storeId;
  const storeName = params.storeName;
  // L1: Checkout items are passed via URL params. For very large carts this could hit URL length limits.
  // Consider moving to a shared state/context if carts grow significantly.
  const checkoutItems: CheckoutItem[] = params.selectedItems ? JSON.parse(params.selectedItems) : [];

  const subtotal = checkoutItems.reduce((sum, item) => {
    if (item.isVariableWeight) {
      return sum + (item.price * (item.weightGrams || 0)) / 1000;
    }
    return sum + item.price * item.quantity;
  }, 0);

  // C1: Double-tap prevention ref
  const submittingRef = useRef(false);

  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ON_DELIVERY');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  // M1: Track whether delivery fee calculation has completed
  const [feeCalculated, setFeeCalculated] = useState(false);
  // M3: Coupon code state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  // ─── Card Modal State ─────────────────────────────────────────────────
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [cardState, setCardState] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const cardSubmittingRef = useRef(false);

  const [saveCardMut, { loading: savingCard }] = useMutation(SAVE_CARD);

  function clearCardError(field: string) {
    if (cardErrors[field]) setCardErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function resetCardForm() {
    setCardNumber(''); setHolderName(''); setCardExpiry(''); setCvv('');
    setZipCode(''); setStreet(''); setStreetNumber(''); setNeighborhood('');
    setCity(''); setCardState(''); setCardErrors({});
  }

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setCardState(data.uf || '');
      }
    } catch { /* ignore */ }
    setLoadingCep(false);
  }

  async function handleSaveCardFromModal() {
    if (cardSubmittingRef.current) return;
    cardSubmittingRef.current = true;

    const e: Record<string, string> = {};
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13) e.cardNumber = 'Numero do cartao invalido';
    else if (!luhnCheck(digits)) e.cardNumber = 'Numero do cartao invalido. Verifique os digitos.';
    if (!holderName.trim()) e.holderName = 'Informe o nome do titular';
    const expiryParts = cardExpiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      e.expiry = 'Validade invalida';
    } else {
      const month = parseInt(expiryParts[0]);
      const year = parseInt('20' + expiryParts[1]);
      if (month < 1 || month > 12) e.expiry = 'Mes invalido';
      else if (isExpired(month, year)) e.expiry = 'Cartao vencido';
    }
    if (cvv.length < 3) e.cvv = 'CVV invalido';
    if (zipCode.replace(/\D/g, '').length !== 8) e.zipCode = 'CEP invalido';
    if (!street.trim()) e.street = 'Informe a rua';
    if (!streetNumber.trim()) e.streetNumber = 'Informe o numero';
    if (!neighborhood.trim()) e.neighborhood = 'Informe o bairro';
    if (!city.trim()) e.city = 'Informe a cidade';
    if (!cardState.trim() || cardState.trim().length !== 2) e.state = 'UF invalido';

    setCardErrors(e);
    if (Object.keys(e).length > 0) { cardSubmittingRef.current = false; return; }

    if (!PAGARME_PUBLIC_KEY) {
      alert('Erro', 'Sistema de pagamento nao configurado.');
      cardSubmittingRef.current = false;
      return;
    }

    try {
      const tokenResponse = await fetch(
        `https://api.pagar.me/core/v5/tokens?appId=${PAGARME_PUBLIC_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'card',
            card: {
              number: digits,
              holder_name: holderName.trim().toUpperCase(),
              exp_month: parseInt(expiryParts[0]),
              exp_year: parseInt('20' + expiryParts[1]),
              cvv,
              billing_address: {
                line_1: `${streetNumber.trim()}, ${street.trim()}, ${neighborhood.trim()}`,
                zip_code: zipCode.replace(/\D/g, ''),
                city: city.trim(),
                state: cardState.trim().toUpperCase(),
                country: 'BR',
              },
            },
          }),
        },
      );

      if (!tokenResponse.ok) {
        if (tokenResponse.status === 400) throw new Error('Dados do cartao invalidos. Verifique o numero, validade e CVV.');
        throw new Error('Erro ao processar cartao. Tente novamente.');
      }

      const tokenData = await tokenResponse.json();
      const { data: savedData } = await saveCardMut({
        variables: { token: tokenData.id },
        refetchQueries: [{ query: LIST_MY_CARDS }],
        awaitRefetchQueries: true,
      });

      // Auto-select the newly saved card
      if (savedData?.saveCard?.id) {
        setSelectedCardId(savedData.saveCard.id);
      }

      resetCardForm();
      setShowCardModal(false);
      alert('Cartao Salvo', 'Seu cartao foi adicionado! Finalize o pedido.');
    } catch (err: any) {
      let msg = 'Nao foi possivel salvar o cartao. Tente novamente.';
      if (err.message?.includes('network') || err.message?.includes('Network')) msg = 'Sem conexao com a internet.';
      else if (err.message) msg = err.message;
      alert('Erro', msg);
    } finally {
      cardSubmittingRef.current = false;
    }
  }

  const [createOrder] = useMutation(CREATE_ORDER);
  const [calcFee, { data: feeData, loading: feeLoading }] = useLazyQuery(CALCULATE_DELIVERY_FEE, {
    onCompleted: () => setFeeCalculated(true),
  });
  const [calcTime, { data: timeData, loading: timeLoading }] = useLazyQuery(ESTIMATE_DELIVERY_TIME);
  const { data: addressesData } = useQuery(GET_MY_ADDRESSES);
  const { data: storeData } = useQuery(GET_STORE, { variables: { id: storeId }, skip: !storeId });
  const { data: cardsData } = useQuery(LIST_MY_CARDS);
  const { data: minOrderData } = useQuery(GET_MINIMUM_ORDER_PLATFORM);

  const storeHasOwnDelivery = storeData?.store?.hasOwnDelivery || false;
  const ownerPaymentConnected = storeData?.store?.ownerPaymentConnected ?? true;
  const platformMinimum = minOrderData?.minimumOrderPlatform ?? 10;
  const rawStoreMinimum = storeData?.store?.minimumOrder ? Number(storeData.store.minimumOrder) : 0;
  const effectiveMinimum = !storeHasOwnDelivery
    ? Math.max(platformMinimum, rawStoreMinimum)
    : rawStoreMinimum;
  const belowMinimum = effectiveMinimum > 0 && subtotal < effectiveMinimum;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);

  async function geocodeNominatim(query: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`;
      const res = await fetch(url, { headers: { 'User-Agent': 'bcmTech-Delivery/1.0' } });
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (lat >= -34 && lat <= 6 && lon >= -74 && lon <= -34) {
          return { latitude: lat, longitude: lon };
        }
      }
    } catch {}
    return null;
  }

  // Pre-fill from default saved address
  const savedAddresses = addressesData?.myAddresses || [];
  useEffect(() => {
    if (addressLoaded || savedAddresses.length === 0) return;
    const defaultAddr = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0];
    if (defaultAddr) {
      const parts = [defaultAddr.street, defaultAddr.number];
      if (defaultAddr.complement) parts.push(defaultAddr.complement);
      parts.push(defaultAddr.neighborhood);
      parts.push(`${defaultAddr.city}/${defaultAddr.state}`);
      setAddress(parts.join(', '));

      const hasValidCoords = defaultAddr.latitude && defaultAddr.longitude
        && Math.abs(defaultAddr.latitude) > 0.01 && Math.abs(defaultAddr.longitude) > 0.01;

      if (hasValidCoords) {
        setCoords({ latitude: defaultAddr.latitude, longitude: defaultAddr.longitude });
        if (storeId) {
          const vars = { storeId, customerLatitude: defaultAddr.latitude, customerLongitude: defaultAddr.longitude };
          calcFee({ variables: vars });
          calcTime({ variables: vars });
        }
      }
      setAddressLoaded(true);
    }
  }, [savedAddresses, addressLoaded, storeId]);

  const isPickup = deliveryType === 'PICKUP';
  const deliveryFee = isPickup ? 0 : (feeData?.calculateDeliveryFee ?? 0);
  const finalTotal = subtotal + deliveryFee;

  const pickupOnly = !ownerPaymentConnected && !storeHasOwnDelivery;
  useEffect(() => {
    if (pickupOnly && deliveryType !== 'PICKUP') {
      setDeliveryType('PICKUP');
    }
  }, [pickupOnly]);

  const paymentOptions = ALL_PAYMENT_OPTIONS.filter((opt) => {
    if (!ownerPaymentConnected) return opt.key === 'ON_DELIVERY';
    if (opt.requiresOwnDelivery && !storeHasOwnDelivery && !isPickup) return false;
    return true;
  });

  useEffect(() => {
    if (!paymentOptions.find((o) => o.key === paymentMethod)) {
      setPaymentMethod(paymentOptions[0]?.key || 'ON_DELIVERY');
    }
  }, [storeHasOwnDelivery, isPickup, ownerPaymentConnected]);

  // Geocode address
  useEffect(() => {
    if (!address.trim() || !storeId) return;
    const timer = setTimeout(async () => {
      let result: { latitude: number; longitude: number } | null = null;
      try {
        const results = await Location.geocodeAsync(address);
        if (results.length > 0) {
          const { latitude, longitude } = results[0];
          if (Math.abs(latitude) > 0.01 && Math.abs(longitude) > 0.01) {
            result = { latitude, longitude };
          }
        }
      } catch {}
      if (!result) result = await geocodeNominatim(address);
      if (result) {
        setCoords(result);
        const vars = { storeId, customerLatitude: result.latitude, customerLongitude: result.longitude };
        calcFee({ variables: vars });
        calcTime({ variables: vars });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [address, storeId]);

  async function handleGetLocation() {
    setLocatingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Erro', 'Permissao de localizacao negada');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const { latitude, longitude } = current.coords;
      setCoords({ latitude, longitude });
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results.length > 0) {
          const r = results[0];
          const city = r.city || r.subregion || '';
          const neighborhood = r.district && r.district !== city ? r.district : '';
          const parts = [r.street, r.streetNumber, neighborhood, city, r.region].filter(Boolean);
          setAddress(parts.join(', '));
        }
      } catch {}
      if (storeId) {
        const vars = { storeId, customerLatitude: latitude, customerLongitude: longitude };
        calcFee({ variables: vars });
        calcTime({ variables: vars });
      }
    } catch (err: any) {
      alert('Erro', err.message || 'Nao foi possivel obter a localizacao');
    } finally {
      setLocatingGps(false);
    }
  }

  async function handleCheckout() {
    // C1: Double-tap prevention
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      // L5: Offline check before checkout
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        alert('Sem conexao', 'Verifique sua conexao com a internet e tente novamente.');
        return;
      }

      if (!isPickup && !address.trim()) {
        alert('Erro', 'Informe o endereco de entrega');
        return;
      }

      // If credit card selected but no card chosen, open the add card modal
      if (paymentMethod === 'CREDIT_CARD' && !selectedCardId) {
        resetCardForm();
        setShowCardModal(true);
        return;
      }

      // Biometric/PIN authentication for credit card payments
      if (paymentMethod === 'CREDIT_CARD' && selectedCardId) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Confirme para autorizar o pagamento',
            cancelLabel: 'Cancelar',
            fallbackLabel: 'Usar senha',
            disableDeviceFallback: false,
          });
          if (!authResult.success) {
            alert('Autenticacao necessaria', 'Confirme sua identidade para prosseguir com o pagamento.');
            return;
          }
        }
      }

      let finalCoords = coords;
      if (!isPickup) {
        if (!finalCoords) {
          try {
            const results = await Location.geocodeAsync(address);
            if (results.length > 0) {
              finalCoords = { latitude: results[0].latitude, longitude: results[0].longitude };
              setCoords(finalCoords);
            }
          } catch {}
        }
        if (!finalCoords) {
          alert('Erro', 'Nao foi possivel localizar o endereco. Tente usar o botao de GPS.');
          return;
        }
      }

      setLoading(true);
      const { data } = await createOrder({
        variables: {
          input: {
            storeId,
            isPickup,
            items: checkoutItems.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              notes: i.notes,
              ...(i.isVariableWeight ? { weightGrams: i.weightGrams } : {}),
            })),
            ...(isPickup
              ? {}
              : {
                  deliveryAddress: address,
                  deliveryLatitude: finalCoords!.latitude,
                  deliveryLongitude: finalCoords!.longitude,
                }),
            notes,
            paymentMethod,
            ...(paymentMethod === 'CREDIT_CARD' && selectedCardId ? { cardId: selectedCardId } : {}),
          },
        },
      });

      const order = data.createOrder;

      // H1: Reconcile client-side price with server total
      const serverTotal = Number(order.total);
      if (Math.abs(serverTotal - finalTotal) > 0.01) {
        alert('Valor atualizado', `O valor do pedido foi atualizado para R$ ${serverTotal.toFixed(2)}`);
      }

      // Remove purchased items from cart
      for (const item of checkoutItems) {
        removeItem(item.id);
      }
      refetchCart();

      if (paymentMethod === 'PIX') {
        // Go straight to order screen where PIX QR code is shown inline
        router.replace(`/order/${order.id}`);
      } else if (paymentMethod === 'CREDIT_CARD' && order.checkoutUrl) {
        alert(
          'Pedido criado!',
          'Voce sera redirecionado para o pagamento.',
          [
            {
              text: 'Pagar agora',
              onPress: () => {
                Linking.openURL(order.checkoutUrl);
                router.replace(`/order/${order.id}`);
              },
            },
          ],
        );
      } else if (paymentMethod === 'CREDIT_CARD' && selectedCardId && !order.checkoutUrl) {
        alert('Pedido realizado!', `Pagamento aprovado! Numero: ${order.orderNumber}`, [
          { text: 'Ver pedido', onPress: () => router.replace(`/order/${order.id}`) },
        ]);
      } else {
        alert('Pedido realizado!', `Numero: ${order.orderNumber}`, [
          { text: 'Ver pedido', onPress: () => router.replace(`/order/${order.id}`) },
        ]);
      }
    } catch (err: any) {
      alert('Erro', err.message || 'Nao foi possivel fazer o pedido');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  const errorBg = isDark ? '#431407' : '#fef2f2';
  const errorBorder = isDark ? '#7c2d12' : '#fecaca';
  const errorText = isDark ? '#fca5a5' : '#dc2626';

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: themeColors.white }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Finalizar pedido</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.storeBadge, { color: themeColors.primary, backgroundColor: themeColors.primary + '15' }]}>{storeName}</Text>

      <FlatList
        data={checkoutItems}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: themeColors.white }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: themeColors.text }]}>{item.name}</Text>
              <Text style={[styles.itemPrice, { color: themeColors.primary }]}>
                {item.isVariableWeight
                  ? `R$ ${((item.price * (item.weightGrams || 0)) / 1000).toFixed(2)}`
                  : `R$ ${(item.price * item.quantity).toFixed(2)}`}
              </Text>
            </View>
            <Text style={[styles.itemQty, { color: themeColors.textLight }]}>
              {item.isVariableWeight
                ? (item.weightGrams || 0) >= 1000
                  ? `${((item.weightGrams || 0) / 1000).toFixed((item.weightGrams || 0) % 1000 === 0 ? 0 : 1)}kg`
                  : `${item.weightGrams || 0}g`
                : `x${item.quantity}`}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            {!ownerPaymentConnected && (
              <View style={[styles.warningBanner, { backgroundColor: themeColors.warning + '18', borderColor: themeColors.warning + '40' }]}>
                <Ionicons name="alert-circle-outline" size={18} color={themeColors.warning} />
                <Text style={[styles.warningBannerText, { color: themeColors.warning }]}>
                  {pickupOnly
                    ? 'Esta loja aceita apenas retirada no local no momento'
                    : 'Esta loja aceita apenas pagamento na entrega'}
                </Text>
              </View>
            )}

            {/* Delivery Type */}
            <View style={[styles.section, { backgroundColor: themeColors.white }]}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Como deseja receber?</Text>
              <View style={styles.deliveryTypeRow}>
                {!pickupOnly && (
                  <TouchableOpacity
                    style={[styles.deliveryTypeOption, { borderColor: themeColors.grayLight }, deliveryType === 'DELIVERY' && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '10' }]}
                    onPress={() => setDeliveryType('DELIVERY')}
                  >
                    <Ionicons name="bicycle-outline" size={18} color={deliveryType === 'DELIVERY' ? themeColors.primary : themeColors.gray} />
                    <Text style={[styles.deliveryTypeLabel, { color: themeColors.gray }, deliveryType === 'DELIVERY' && { color: themeColors.primary }]}>Entrega</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.deliveryTypeOption, { borderColor: themeColors.grayLight }, deliveryType === 'PICKUP' && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '10' }]}
                  onPress={() => setDeliveryType('PICKUP')}
                >
                  <Ionicons name="storefront-outline" size={18} color={deliveryType === 'PICKUP' ? themeColors.primary : themeColors.gray} />
                  <Text style={[styles.deliveryTypeLabel, { color: themeColors.gray }, deliveryType === 'PICKUP' && { color: themeColors.primary }]}>Retirar no local</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Address */}
            {!isPickup && (
              <View style={[styles.section, { backgroundColor: themeColors.white }]}>
                <View style={styles.addressHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Local de entrega</Text>
                  {savedAddresses.length > 0 && (
                    <TouchableOpacity onPress={() => setShowAddressPicker(!showAddressPicker)}>
                      <Text style={[styles.savedAddressesLink, { color: themeColors.primary }]}>{showAddressPicker ? 'Fechar' : 'Meus enderecos'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {showAddressPicker && (
                  <View style={styles.addressPickerList}>
                    {savedAddresses.map((addr: any) => {
                      const label = [addr.street, addr.number, addr.neighborhood, `${addr.city}/${addr.state}`].filter(Boolean).join(', ');
                      return (
                        <TouchableOpacity
                          key={addr.id}
                          style={[styles.addressPickerItem, { backgroundColor: themeColors.background }]}
                          onPress={() => {
                            const parts = [addr.street, addr.number];
                            if (addr.complement) parts.push(addr.complement);
                            parts.push(addr.neighborhood);
                            parts.push(`${addr.city}/${addr.state}`);
                            setAddress(parts.join(', '));
                            setCoords({ latitude: addr.latitude, longitude: addr.longitude });
                            if (storeId) {
                              calcFee({ variables: { storeId, customerLatitude: addr.latitude, customerLongitude: addr.longitude } });
                              calcTime({ variables: { storeId, customerLatitude: addr.latitude, customerLongitude: addr.longitude } });
                            }
                            setShowAddressPicker(false);
                          }}
                        >
                          <Ionicons name="location" size={16} color={addr.isDefault ? themeColors.primary : themeColors.gray} />
                          <Text style={[styles.addressPickerText, { color: themeColors.text }]} numberOfLines={2}>{label}</Text>
                          {addr.isDefault && (
                            <View style={[styles.addressPickerBadge, { backgroundColor: themeColors.primary + '15' }]}>
                              <Text style={[styles.addressPickerBadgeText, { color: themeColors.primary }]}>Principal</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                <View style={styles.locationRow}>
                  <TouchableOpacity style={[styles.locationButton, { backgroundColor: themeColors.primary + '15' }]} onPress={handleGetLocation} disabled={locatingGps}>
                    {locatingGps ? (
                      <ActivityIndicator size="small" color={themeColors.primary} />
                    ) : (
                      <Ionicons name="navigate" size={18} color={themeColors.primary} />
                    )}
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.addressInput, { backgroundColor: themeColors.background, color: themeColors.text }]}
                    placeholder="Digite o endereco ou use o GPS"
                    placeholderTextColor={themeColors.gray}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </View>
              </View>
            )}

            <TextInput
              style={[styles.notesInput, { backgroundColor: themeColors.white, color: themeColors.text }]}
              placeholder="Observacoes (opcional)"
              placeholderTextColor={themeColors.gray}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {/* M3: Coupon input */}
            <View style={[styles.section, { backgroundColor: themeColors.white }]}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Cupom de desconto</Text>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <TextInput
                  style={[styles.addressInput, { backgroundColor: themeColors.background, color: themeColors.text, flex: 1 }]}
                  placeholder="Codigo do cupom"
                  placeholderTextColor={themeColors.gray}
                  value={couponCode}
                  onChangeText={(t) => { setCouponCode(t.toUpperCase()); setCouponApplied(false); }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.locationButton, { backgroundColor: themeColors.primary + '15', width: 'auto' as any, paddingHorizontal: 12 }]}
                  onPress={() => {
                    // TODO: Call validateCoupon query when available in the API
                    if (!couponCode.trim()) {
                      alert('Erro', 'Informe o codigo do cupom');
                      return;
                    }
                    alert('Em breve', 'Cupons de desconto estarao disponiveis em breve!');
                  }}
                >
                  <Text style={{ color: themeColors.primary, fontWeight: '600', fontSize: 12 }}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment */}
            <View style={[styles.section, { backgroundColor: themeColors.white }]}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Forma de pagamento</Text>
              {paymentOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.paymentOption, { borderColor: themeColors.grayLight }, paymentMethod === option.key && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '08' }]}
                  onPress={() => setPaymentMethod(option.key)}
                >
                  <Ionicons name={option.icon as any} size={18} color={paymentMethod === option.key ? themeColors.primary : themeColors.gray} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.paymentLabel, { color: themeColors.text }, paymentMethod === option.key && { color: themeColors.primary }]}>{option.label}</Text>
                    <Text style={[styles.paymentDesc, { color: themeColors.textLight }]}>{option.description}</Text>
                  </View>
                  {paymentMethod === option.key && <Ionicons name="checkmark-circle" size={18} color={themeColors.primary} />}
                </TouchableOpacity>
              ))}

              {paymentMethod === 'CREDIT_CARD' && (
                <View style={styles.cardsSection}>
                  <Text style={[styles.cardsTitle, { color: themeColors.textLight }]}>Cartoes salvos</Text>
                  {(cardsData?.myCards || []).map((card: any) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[styles.cardItem, { borderColor: themeColors.grayLight }, selectedCardId === card.id && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '08' }]}
                      onPress={() => setSelectedCardId(card.id)}
                    >
                      <Ionicons name="card" size={18} color={selectedCardId === card.id ? themeColors.primary : themeColors.gray} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardText, { color: themeColors.text }]}>{card.brand} •••• {card.lastFourDigits}</Text>
                        {card.holderName && <Text style={[styles.cardHolder, { color: themeColors.textLight }]}>{card.holderName}</Text>}
                      </View>
                      {selectedCardId === card.id && <Ionicons name="checkmark-circle" size={18} color={themeColors.primary} />}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.cardItem, { borderColor: themeColors.grayLight }]}
                    onPress={() => { resetCardForm(); setShowCardModal(true); }}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={themeColors.primary} />
                    <Text style={[styles.cardText, { color: themeColors.primary }]}>Adicionar novo cartao</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.manageCardsLink} onPress={() => router.push('/cards')}>
                    <Text style={[styles.manageCardsText, { color: themeColors.primary }]}>Gerenciar cartoes</Text>
                    <Ionicons name="chevron-forward" size={16} color={themeColors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Summary */}
            <View style={[styles.section, { backgroundColor: themeColors.white }]}>
              {belowMinimum && (
                <View style={[styles.minimumOrderWarning, { backgroundColor: errorBg, borderColor: errorBorder }]}>
                  <Ionicons name="alert-circle" size={18} color={errorText} />
                  <Text style={[styles.minimumOrderText, { color: errorText }]}>
                    Pedido minimo desta loja: R$ {effectiveMinimum.toFixed(2)}. Faltam R$ {(effectiveMinimum - subtotal).toFixed(2)}.
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: themeColors.textLight }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: themeColors.text }, belowMinimum && { color: errorText }]}>R$ {subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: themeColors.textLight }]}>{isPickup ? 'Retirada' : 'Taxa de entrega'}</Text>
                {isPickup ? (
                  <Text style={[styles.summaryValue, { color: themeColors.success }]}>Gratis</Text>
                ) : feeLoading ? (
                  <ActivityIndicator size="small" color={themeColors.primary} />
                ) : (
                  // M1: Show 'Gratis' for zero fee when calculation is done, 'Calculando...' only when not yet calculated
                  <Text style={[styles.summaryValue, { color: themeColors.text }]}>
                    {feeCalculated ? (deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Gratis') : 'Calculando...'}
                  </Text>
                )}
              </View>
              {/* M2: Free delivery threshold banner */}
              {!isPickup && storeData?.store?.freeDeliveryAbove && subtotal < Number(storeData.store.freeDeliveryAbove) && (
                <View style={[styles.summaryRow, { marginTop: 4 }]}>
                  <Text style={{ fontSize: 10, color: themeColors.success, fontWeight: '600' }}>
                    Faltam R$ {(Number(storeData.store.freeDeliveryAbove) - subtotal).toFixed(2)} para frete gratis!
                  </Text>
                </View>
              )}
              {!isPickup && timeData?.estimatedDeliveryTime && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: themeColors.textLight }]}>Tempo estimado</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="time-outline" size={16} color={themeColors.primary} />
                    <Text style={[styles.summaryValue, { color: themeColors.primary, fontWeight: '600' }]}>~{Math.ceil(timeData.estimatedDeliveryTime)} min</Text>
                  </View>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: themeColors.grayLight }]}>
                <Text style={[styles.totalLabel, { color: themeColors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: themeColors.primary }]}>R$ {finalTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.checkoutButton, { bottom: insets.bottom + 16, backgroundColor: themeColors.primary }, (loading || belowMinimum || (!isPickup && !coords)) && styles.checkoutDisabled]}
        onPress={handleCheckout}
        disabled={loading || belowMinimum || (!isPickup && !coords)}
      >
        <Text style={styles.checkoutText}>
          {loading ? 'Finalizando...' : belowMinimum ? `Pedido minimo: R$ ${effectiveMinimum.toFixed(2)}` : `Finalizar pedido - R$ ${finalTotal.toFixed(2)}`}
        </Text>
      </TouchableOpacity>

      {/* L6: Full-screen loading overlay during checkout */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingOverlayText}>Processando pedido...</Text>
        </View>
      )}

      {/* Card Registration Modal */}
      <Modal visible={showCardModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="card" size={18} color={themeColors.primary} />
                  <Text style={[styles.modalTitle, { color: themeColors.text }]}>Novo Cartao</Text>
                </View>
                <TouchableOpacity onPress={() => { resetCardForm(); setShowCardModal(false); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={18} color={themeColors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 40, gap: 6 }} keyboardShouldPersistTaps="handled">
                <View>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: themeColors.white, color: themeColors.text, borderColor: cardErrors.cardNumber ? '#ef4444' : themeColors.border }]}
                    placeholder="Numero do cartao"
                    placeholderTextColor={themeColors.gray}
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={(t) => { setCardNumber(formatCardNumber(t)); clearCardError('cardNumber'); }}
                    maxLength={19}
                  />
                  {cardErrors.cardNumber && <Text style={styles.modalFieldError}>{cardErrors.cardNumber}</Text>}
                  {!cardErrors.cardNumber && detectBrand(cardNumber) ? (
                    <Text style={{ fontSize: 10, color: getBrandColor(detectBrand(cardNumber)), marginTop: 3, fontWeight: '600' }}>
                      {detectBrand(cardNumber)}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: themeColors.white, color: themeColors.text, borderColor: cardErrors.holderName ? '#ef4444' : themeColors.border }]}
                    placeholder="Nome do titular (como no cartao)"
                    placeholderTextColor={themeColors.gray}
                    autoCapitalize="characters"
                    value={holderName}
                    onChangeText={(t) => { setHolderName(t); clearCardError('holderName'); }}
                  />
                  {cardErrors.holderName && <Text style={styles.modalFieldError}>{cardErrors.holderName}</Text>}
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: themeColors.white, color: themeColors.text, borderColor: cardErrors.expiry ? '#ef4444' : themeColors.border }]}
                      placeholder="MM/AA"
                      placeholderTextColor={themeColors.gray}
                      keyboardType="numeric"
                      value={cardExpiry}
                      onChangeText={(t) => { setCardExpiry(formatExpiry(t)); clearCardError('expiry'); }}
                      maxLength={5}
                    />
                    {cardErrors.expiry && <Text style={styles.modalFieldError}>{cardErrors.expiry}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: themeColors.white, color: themeColors.text, borderColor: cardErrors.cvv ? '#ef4444' : themeColors.border }]}
                      placeholder="CVV"
                      placeholderTextColor={themeColors.gray}
                      keyboardType="numeric"
                      secureTextEntry
                      value={cvv}
                      onChangeText={(t) => { setCvv(t.replace(/\D/g, '').substring(0, 4)); clearCardError('cvv'); }}
                      maxLength={4}
                    />
                    {cardErrors.cvv && <Text style={styles.modalFieldError}>{cardErrors.cvv}</Text>}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Ionicons name="home" size={18} color={themeColors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: themeColors.text }}>Endereco de cobranca</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: themeColors.white, color: themeColors.text, borderColor: cardErrors.zipCode ? '#ef4444' : themeColors.border }]}
                      placeholder="CEP"
                      placeholderTextColor={themeColors.gray}
                      keyboardType="numeric"
                      value={zipCode}
                      onChangeText={(t) => {
                        const formatted = formatCep(t);
                        setZipCode(formatted);
                        clearCardError('zipCode');
                        if (formatted.replace(/\D/g, '').length === 8) lookupCep(formatted);
                      }}
                      maxLength={9}
                    />
                    {cardErrors.zipCode && <Text style={styles.modalFieldError}>{cardErrors.zipCode}</Text>}
                    {loadingCep && <ActivityIndicator size="small" color={themeColors.primary} style={{ position: 'absolute', right: 12, top: 12 }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: themeColors.white, color: themeColors.text, borderColor: cardErrors.state ? '#ef4444' : themeColors.border }]}
                      placeholder="UF"
                      placeholderTextColor={themeColors.gray}
                      autoCapitalize="characters"
                      value={cardState}
                      onChangeText={(t) => { setCardState(t.substring(0, 2)); clearCardError('state'); }}
                      maxLength={2}
                    />
                    {cardErrors.state && <Text style={styles.modalFieldError}>{cardErrors.state}</Text>}
                  </View>
                </View>

                <TextInput
                  style={[styles.modalInput, { backgroundColor: themeColors.white, color: themeColors.text, borderColor: cardErrors.street ? '#ef4444' : themeColors.border }]}
                  placeholder="Rua"
                  placeholderTextColor={themeColors.gray}
                  value={street}
                  onChangeText={(t) => { setStreet(t); clearCardError('street'); }}
                />
                {cardErrors.street && <Text style={styles.modalFieldError}>{cardErrors.street}</Text>}

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: themeColors.white, color: themeColors.text, borderColor: cardErrors.streetNumber ? '#ef4444' : themeColors.border }]}
                      placeholder="Numero"
                      placeholderTextColor={themeColors.gray}
                      value={streetNumber}
                      onChangeText={(t) => { setStreetNumber(t); clearCardError('streetNumber'); }}
                    />
                    {cardErrors.streetNumber && <Text style={styles.modalFieldError}>{cardErrors.streetNumber}</Text>}
                  </View>
                  <View style={{ flex: 2 }}>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: themeColors.white, color: themeColors.text, borderColor: cardErrors.neighborhood ? '#ef4444' : themeColors.border }]}
                      placeholder="Bairro"
                      placeholderTextColor={themeColors.gray}
                      value={neighborhood}
                      onChangeText={(t) => { setNeighborhood(t); clearCardError('neighborhood'); }}
                    />
                    {cardErrors.neighborhood && <Text style={styles.modalFieldError}>{cardErrors.neighborhood}</Text>}
                  </View>
                </View>

                <TextInput
                  style={[styles.modalInput, { backgroundColor: themeColors.white, color: themeColors.text, borderColor: cardErrors.city ? '#ef4444' : themeColors.border }]}
                  placeholder="Cidade"
                  placeholderTextColor={themeColors.gray}
                  value={city}
                  onChangeText={(t) => { setCity(t); clearCardError('city'); }}
                />
                {cardErrors.city && <Text style={styles.modalFieldError}>{cardErrors.city}</Text>}

                <TouchableOpacity
                  style={[styles.modalSaveButton, savingCard && { opacity: 0.5 }]}
                  onPress={handleSaveCardFromModal}
                  disabled={savingCard}
                >
                  {savingCard ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={16} color="#fff" />
                      <Text style={styles.modalSaveButtonText}>Salvar cartao e continuar</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <Ionicons name="shield-checkmark" size={12} color={themeColors.gray} />
                  <Text style={{ fontSize: 10, color: themeColors.gray }}>Seus dados sao criptografados e protegidos</Text>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 56,
    backgroundColor: colors.white,
  },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text },
  storeBadge: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.primary + '15',
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  list: { padding: 12, paddingBottom: 100 },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  itemPrice: { fontSize: fonts.small, color: colors.primary, fontWeight: '600', marginTop: 4 },
  itemQty: { fontSize: fonts.small, fontWeight: 'bold', color: colors.textLight },
  footer: { marginTop: 12, gap: 6 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warning + '18',
    borderWidth: 1,
    borderColor: colors.warning + '40',
    borderRadius: 10,
    padding: 10,
  },
  warningBannerText: { flex: 1, fontSize: fonts.small, color: colors.warning, fontWeight: '600' },
  section: { backgroundColor: colors.white, borderRadius: 10, padding: 12, gap: 6 },
  sectionTitle: { fontSize: fonts.regular, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  deliveryTypeRow: { flexDirection: 'row', gap: 6 },
  deliveryTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.grayLight,
  },
  deliveryTypeSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  deliveryTypeLabel: { fontSize: fonts.regular, fontWeight: '600', color: colors.gray },
  deliveryTypeLabelSelected: { color: colors.primary },
  addressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  savedAddressesLink: { fontSize: fonts.small, color: colors.primary, fontWeight: '600' },
  addressPickerList: { marginBottom: 12, gap: 6 },
  addressPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
  },
  addressPickerText: { flex: 1, fontSize: fonts.small, color: colors.text },
  addressPickerBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  addressPickerBadgeText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  locationRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.small,
    color: colors.text,
    minHeight: 40,
  },
  notesInput: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.regular,
    color: colors.text,
    minHeight: 40,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.grayLight,
    gap: 6,
  },
  paymentOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  paymentLabel: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  paymentDesc: { fontSize: fonts.small, color: colors.textLight, marginTop: 2 },
  cardsSection: { marginTop: 12, gap: 6 },
  cardsTitle: { fontSize: fonts.small, fontWeight: '600', color: colors.textLight, marginBottom: 4 },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.grayLight,
  },
  cardItemSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  cardText: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  cardHolder: { fontSize: fonts.small, color: colors.textLight, marginTop: 2 },
  manageCardsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  manageCardsText: { fontSize: fonts.small, color: colors.primary, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: fonts.regular, color: colors.textLight },
  summaryValue: { fontSize: fonts.regular, color: colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.grayLight, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text },
  totalValue: { fontSize: fonts.large, fontWeight: 'bold', color: colors.primary },
  checkoutButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  checkoutDisabled: { opacity: 0.6 },
  checkoutText: { color: colors.white, fontSize: fonts.large, fontWeight: 'bold' },
  minimumOrderWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  minimumOrderText: {
    flex: 1,
    fontSize: fonts.small,
    color: '#dc2626',
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingOverlayText: {
    color: '#FFFFFF',
    fontSize: fonts.regular,
    fontWeight: '600',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '92%',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 12,
  },
  modalFieldError: {
    fontSize: 10,
    color: '#ef4444',
    marginTop: 3,
  },
  modalSaveButton: {
    backgroundColor: '#f97316',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
