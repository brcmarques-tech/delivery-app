import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useLazyQuery, useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCart } from '../src/contexts/CartContext';
import { useAlert } from '../src/contexts/AlertContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { CREATE_ORDER } from '../src/lib/graphql/mutations';
import { CALCULATE_DELIVERY_FEE, GET_MY_ADDRESSES, GET_STORE, ESTIMATE_DELIVERY_TIME, LIST_MY_CARDS, GET_MINIMUM_ORDER_PLATFORM } from '../src/lib/graphql/queries';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../src/theme';

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
  const checkoutItems: CheckoutItem[] = params.selectedItems ? JSON.parse(params.selectedItems) : [];

  const subtotal = checkoutItems.reduce((sum, item) => {
    if (item.isVariableWeight) {
      return sum + (item.price * (item.weightGrams || 0)) / 1000;
    }
    return sum + item.price * item.quantity;
  }, 0);

  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ON_DELIVERY');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [createOrder] = useMutation(CREATE_ORDER);
  const [calcFee, { data: feeData, loading: feeLoading }] = useLazyQuery(CALCULATE_DELIVERY_FEE);
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
    if (!isPickup && !address.trim()) {
      alert('Erro', 'Informe o endereco de entrega');
      return;
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
    try {
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
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: themeColors.white }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Finalizar pedido</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={[styles.storeBadge, { color: themeColors.primary, backgroundColor: themeColors.primary + '15' }]}>{storeName}</Text>

      <FlatList
        data={checkoutItems}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
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
                <Ionicons name="alert-circle-outline" size={20} color={themeColors.warning} />
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
                    <Ionicons name="bicycle-outline" size={24} color={deliveryType === 'DELIVERY' ? themeColors.primary : themeColors.gray} />
                    <Text style={[styles.deliveryTypeLabel, { color: themeColors.gray }, deliveryType === 'DELIVERY' && { color: themeColors.primary }]}>Entrega</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.deliveryTypeOption, { borderColor: themeColors.grayLight }, deliveryType === 'PICKUP' && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '10' }]}
                  onPress={() => setDeliveryType('PICKUP')}
                >
                  <Ionicons name="storefront-outline" size={24} color={deliveryType === 'PICKUP' ? themeColors.primary : themeColors.gray} />
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
                      <Ionicons name="navigate" size={22} color={themeColors.primary} />
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

            {/* Payment */}
            <View style={[styles.section, { backgroundColor: themeColors.white }]}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Forma de pagamento</Text>
              {paymentOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.paymentOption, { borderColor: themeColors.grayLight }, paymentMethod === option.key && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '08' }]}
                  onPress={() => setPaymentMethod(option.key)}
                >
                  <Ionicons name={option.icon as any} size={24} color={paymentMethod === option.key ? themeColors.primary : themeColors.gray} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.paymentLabel, { color: themeColors.text }, paymentMethod === option.key && { color: themeColors.primary }]}>{option.label}</Text>
                    <Text style={[styles.paymentDesc, { color: themeColors.textLight }]}>{option.description}</Text>
                  </View>
                  {paymentMethod === option.key && <Ionicons name="checkmark-circle" size={24} color={themeColors.primary} />}
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
                      <Ionicons name="card" size={20} color={selectedCardId === card.id ? themeColors.primary : themeColors.gray} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardText, { color: themeColors.text }]}>{card.brand} •••• {card.lastFourDigits}</Text>
                        {card.holderName && <Text style={[styles.cardHolder, { color: themeColors.textLight }]}>{card.holderName}</Text>}
                      </View>
                      {selectedCardId === card.id && <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.cardItem, { borderColor: themeColors.grayLight }, !selectedCardId && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '08' }]}
                    onPress={() => setSelectedCardId(null)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={!selectedCardId ? themeColors.primary : themeColors.gray} />
                    <Text style={[styles.cardText, { color: themeColors.text }, !selectedCardId && { color: themeColors.primary }]}>Usar novo cartao (link de pagamento)</Text>
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
                  <Text style={[styles.summaryValue, { color: themeColors.text }]}>{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Calculando...'}</Text>
                )}
              </View>
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
        style={[styles.checkoutButton, { bottom: insets.bottom + 24, backgroundColor: themeColors.primary }, (loading || belowMinimum || (!isPickup && !coords)) && styles.checkoutDisabled]}
        onPress={handleCheckout}
        disabled={loading || belowMinimum || (!isPickup && !coords)}
      >
        <Text style={styles.checkoutText}>
          {loading ? 'Finalizando...' : belowMinimum ? `Pedido minimo: R$ ${effectiveMinimum.toFixed(2)}` : `Finalizar pedido - R$ ${finalTotal.toFixed(2)}`}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
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
    marginLeft: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  list: { padding: 16, paddingBottom: 100 },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  itemPrice: { fontSize: fonts.small, color: colors.primary, fontWeight: '600', marginTop: 4 },
  itemQty: { fontSize: fonts.small, fontWeight: 'bold', color: colors.textLight },
  footer: { marginTop: 16, gap: 12 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.warning + '18',
    borderWidth: 1,
    borderColor: colors.warning + '40',
    borderRadius: 12,
    padding: 14,
  },
  warningBannerText: { flex: 1, fontSize: fonts.small, color: colors.warning, fontWeight: '600' },
  section: { backgroundColor: colors.white, borderRadius: 12, padding: 16, gap: 8 },
  sectionTitle: { fontSize: fonts.regular, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  deliveryTypeRow: { flexDirection: 'row', gap: 12 },
  deliveryTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
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
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
  },
  addressPickerText: { flex: 1, fontSize: fonts.small, color: colors.text },
  addressPickerBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  addressPickerBadgeText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  locationRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
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
    minHeight: 44,
  },
  notesInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: fonts.regular,
    color: colors.text,
    minHeight: 60,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.grayLight,
    gap: 12,
  },
  paymentOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '08' },
  paymentLabel: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  paymentDesc: { fontSize: fonts.small, color: colors.textLight, marginTop: 2 },
  cardsSection: { marginTop: 12, gap: 6 },
  cardsTitle: { fontSize: fonts.small, fontWeight: '600', color: colors.textLight, marginBottom: 4 },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  checkoutDisabled: { opacity: 0.6 },
  checkoutText: { color: colors.white, fontSize: fonts.large, fontWeight: 'bold' },
  minimumOrderWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  minimumOrderText: {
    flex: 1,
    fontSize: fonts.small,
    color: '#dc2626',
    fontWeight: '600',
  },
});
