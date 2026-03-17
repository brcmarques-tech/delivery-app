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
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useLazyQuery, useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCart } from '../src/contexts/CartContext';
import { useAlert } from '../src/contexts/AlertContext';
import { useLocation } from '../src/contexts/LocationContext';
import { CREATE_ORDER } from '../src/lib/graphql/mutations';
import { CALCULATE_DELIVERY_FEE, GET_MY_ADDRESSES, GET_STORE, ESTIMATE_DELIVERY_TIME, LIST_MY_CARDS } from '../src/lib/graphql/queries';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../src/theme';

type PaymentMethod = 'ON_DELIVERY' | 'CREDIT_CARD' | 'PIX';
type DeliveryType = 'DELIVERY' | 'PICKUP';

const ALL_PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: string; description: string; requiresOwnDelivery?: boolean }[] = [
  { key: 'ON_DELIVERY', label: 'Na entrega', icon: 'cash-outline', description: 'Pague ao receber', requiresOwnDelivery: true },
  { key: 'CREDIT_CARD', label: 'Cartao de Credito', icon: 'card-outline', description: 'Pague com cartao salvo ou novo' },
  { key: 'PIX', label: 'PIX', icon: 'qr-code-outline', description: 'Pagamento instantaneo' },
];

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, storeId, storeName, total, updateQuantity, updateWeight, removeItem, clearCart } = useCart();
  const { alert } = useAlert();
  const { location: gpsLocation } = useLocation();
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

  const storeHasOwnDelivery = storeData?.store?.hasOwnDelivery || false;
  const ownerPaymentConnected = storeData?.store?.ownerPaymentConnected ?? true;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);

  // Pre-fill from default saved address
  const savedAddresses = addressesData?.myAddresses || [];
  React.useEffect(() => {
    if (addressLoaded || savedAddresses.length === 0) return;
    const defaultAddr = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0];
    if (defaultAddr) {
      const parts = [defaultAddr.street, defaultAddr.number];
      if (defaultAddr.complement) parts.push(defaultAddr.complement);
      parts.push(defaultAddr.neighborhood);
      parts.push(`${defaultAddr.city}/${defaultAddr.state}`);
      setAddress(parts.join(', '));
      setCoords({ latitude: defaultAddr.latitude, longitude: defaultAddr.longitude });
      if (storeId) {
        const vars = { storeId, customerLatitude: defaultAddr.latitude, customerLongitude: defaultAddr.longitude };
        calcFee({ variables: vars });
        calcTime({ variables: vars });
      }
      setAddressLoaded(true);
    }
  }, [savedAddresses, addressLoaded, storeId]);

  const isPickup = deliveryType === 'PICKUP';
  const deliveryFee = isPickup ? 0 : (feeData?.calculateDeliveryFee ?? 0);
  const finalTotal = total + deliveryFee;

  // If payment not connected and no own delivery, force PICKUP
  const pickupOnly = !ownerPaymentConnected && !storeHasOwnDelivery;
  React.useEffect(() => {
    if (pickupOnly && deliveryType !== 'PICKUP') {
      setDeliveryType('PICKUP');
    }
  }, [pickupOnly]);

  // Filter payment options based on store delivery type and payment connection
  const paymentOptions = ALL_PAYMENT_OPTIONS.filter((opt) => {
    // When payment is not connected, only allow ON_DELIVERY
    if (!ownerPaymentConnected) {
      return opt.key === 'ON_DELIVERY';
    }
    // Otherwise, filter ON_DELIVERY based on own delivery / pickup
    if (opt.requiresOwnDelivery && !storeHasOwnDelivery && !isPickup) {
      return false;
    }
    return true;
  });

  // Reset payment method if current one is no longer available
  React.useEffect(() => {
    if (!paymentOptions.find((o) => o.key === paymentMethod)) {
      setPaymentMethod(paymentOptions[0]?.key || 'ON_DELIVERY');
    }
  }, [storeHasOwnDelivery, isPickup, ownerPaymentConnected]);

  // Geocode address text to coordinates when address changes (debounced)
  useEffect(() => {
    if (!address.trim() || !storeId) return;
    const timer = setTimeout(async () => {
      try {
        const results = await Location.geocodeAsync(address);
        if (results.length > 0) {
          const { latitude, longitude } = results[0];
          setCoords({ latitude, longitude });
          const vars = { storeId, customerLatitude: latitude, customerLongitude: longitude };
          calcFee({ variables: vars });
          calcTime({ variables: vars });
        }
      } catch {
        // geocoding failed, keep previous coords
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [address, storeId]);

  // Button: get GPS location and fill address
  async function handleGetLocation() {
    setLocatingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Erro', 'Permissao de localizacao negada');
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const { latitude, longitude } = current.coords;
      setCoords({ latitude, longitude });

      // Reverse geocode to fill address
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results.length > 0) {
          const r = results[0];
          const city = r.city || r.subregion || '';
          const neighborhood = r.district && r.district !== city ? r.district : '';
          const parts = [
            r.street,
            r.streetNumber,
            neighborhood,
            city,
            r.region,
          ].filter(Boolean);
          setAddress(parts.join(', '));
        }
      } catch {
        // reverse geocoding failed
      }

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
      // If no coords yet, geocode from address text
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
            items: items.map((i) => ({
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
      clearCart();

      if ((paymentMethod === 'CREDIT_CARD' || paymentMethod === 'PIX') && order.checkoutUrl) {
        alert(
          'Pedido criado!',
          paymentMethod === 'PIX'
            ? 'Voce sera redirecionado para pagar com PIX.'
            : 'Voce sera redirecionado para o pagamento.',
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
        // Direct charge — no redirect needed
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

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color={colors.grayLight} />
        <Text style={styles.emptyText}>Seu carrinho esta vazio</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={() => router.back()}>
          <Text style={styles.emptyButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Carrinho</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.storeBadge}>{storeName}</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>
                {item.isVariableWeight
                  ? `R$ ${((item.price * (item.weightGrams || 0)) / 1000).toFixed(2)}`
                  : `R$ ${(item.price * item.quantity).toFixed(2)}`}
              </Text>
            </View>
            {item.isVariableWeight ? (
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateWeight(item.productId, (item.weightGrams || 0) - 100)}
                >
                  <Ionicons name={(item.weightGrams || 0) <= 100 ? 'trash-outline' : 'remove'} size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>
                  {(item.weightGrams || 0) >= 1000
                    ? `${((item.weightGrams || 0) / 1000).toFixed((item.weightGrams || 0) % 1000 === 0 ? 0 : 1)}kg`
                    : `${item.weightGrams || 0}g`}
                </Text>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateWeight(item.productId, (item.weightGrams || 0) + 100)}
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            {/* Warning banner when payment is not connected */}
            {!ownerPaymentConnected && (
              <View style={styles.warningBanner}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
                <Text style={styles.warningBannerText}>
                  {pickupOnly
                    ? 'Esta loja aceita apenas retirada no local no momento'
                    : 'Esta loja aceita apenas pagamento na entrega'}
                </Text>
              </View>
            )}

            {/* Delivery Type Selector */}
            <View style={styles.deliveryTypeSection}>
              <Text style={styles.deliveryTypeTitle}>Como deseja receber?</Text>
              <View style={styles.deliveryTypeRow}>
                {!pickupOnly && (
                <TouchableOpacity
                  style={[
                    styles.deliveryTypeOption,
                    deliveryType === 'DELIVERY' && styles.deliveryTypeSelected,
                  ]}
                  onPress={() => setDeliveryType('DELIVERY')}
                >
                  <Ionicons
                    name="bicycle-outline"
                    size={24}
                    color={deliveryType === 'DELIVERY' ? colors.primary : colors.gray}
                  />
                  <Text
                    style={[
                      styles.deliveryTypeLabel,
                      deliveryType === 'DELIVERY' && styles.deliveryTypeLabelSelected,
                    ]}
                  >
                    Entrega
                  </Text>
                </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.deliveryTypeOption,
                    deliveryType === 'PICKUP' && styles.deliveryTypeSelected,
                  ]}
                  onPress={() => setDeliveryType('PICKUP')}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={24}
                    color={deliveryType === 'PICKUP' ? colors.primary : colors.gray}
                  />
                  <Text
                    style={[
                      styles.deliveryTypeLabel,
                      deliveryType === 'PICKUP' && styles.deliveryTypeLabelSelected,
                    ]}
                  >
                    Retirar no local
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location + Address Section (only for delivery) */}
            {!isPickup && (
            <View style={styles.mapSection}>
              <View style={styles.addressHeaderRow}>
                <Text style={styles.mapLabel}>Local de entrega</Text>
                {savedAddresses.length > 0 && (
                  <TouchableOpacity onPress={() => setShowAddressPicker(!showAddressPicker)}>
                    <Text style={styles.savedAddressesLink}>
                      {showAddressPicker ? 'Fechar' : 'Meus enderecos'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {showAddressPicker && (
                <View style={styles.addressPickerList}>
                  {savedAddresses.map((addr: any) => {
                    const label = [addr.street, addr.number, addr.neighborhood, `${addr.city}/${addr.state}`]
                      .filter(Boolean).join(', ');
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={styles.addressPickerItem}
                        onPress={() => {
                          const parts = [addr.street, addr.number];
                          if (addr.complement) parts.push(addr.complement);
                          parts.push(addr.neighborhood);
                          parts.push(`${addr.city}/${addr.state}`);
                          setAddress(parts.join(', '));
                          setCoords({ latitude: addr.latitude, longitude: addr.longitude });
                          if (storeId) {
                            const vars = { storeId, customerLatitude: addr.latitude, customerLongitude: addr.longitude };
                            calcFee({ variables: vars });
                            calcTime({ variables: vars });
                          }
                          setShowAddressPicker(false);
                        }}
                      >
                        <Ionicons name="location" size={16} color={addr.isDefault ? colors.primary : colors.gray} />
                        <Text style={styles.addressPickerText} numberOfLines={2}>{label}</Text>
                        {addr.isDefault && (
                          <View style={styles.addressPickerBadge}>
                            <Text style={styles.addressPickerBadgeText}>Principal</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.locationRow}>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleGetLocation}
                  disabled={locatingGps}
                >
                  {locatingGps ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="navigate" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Digite o endereco ou use o GPS"
                  placeholderTextColor={colors.gray}
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>
            </View>
            )}

            <TextInput
              style={styles.notesInput}
              placeholder="Observacoes (opcional)"
              placeholderTextColor={colors.gray}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Forma de pagamento</Text>
              {paymentOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.paymentOption,
                    paymentMethod === option.key && styles.paymentOptionSelected,
                  ]}
                  onPress={() => setPaymentMethod(option.key)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={paymentMethod === option.key ? colors.primary : colors.gray}
                  />
                  <View style={styles.paymentOptionText}>
                    <Text
                      style={[
                        styles.paymentOptionLabel,
                        paymentMethod === option.key && styles.paymentOptionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.paymentOptionDesc}>{option.description}</Text>
                  </View>
                  {paymentMethod === option.key && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {paymentMethod === 'CREDIT_CARD' && (
                <View style={styles.savedCardsSection}>
                  <Text style={styles.savedCardsTitle}>Cartoes salvos</Text>
                  {(cardsData?.myCards || []).map((card: any) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[
                        styles.savedCardItem,
                        selectedCardId === card.id && styles.savedCardSelected,
                      ]}
                      onPress={() => setSelectedCardId(card.id)}
                    >
                      <Ionicons name="card" size={20} color={selectedCardId === card.id ? colors.primary : colors.gray} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.savedCardText}>
                          {card.brand} •••• {card.lastFourDigits}
                        </Text>
                        {card.holderName && (
                          <Text style={styles.savedCardHolder}>{card.holderName}</Text>
                        )}
                      </View>
                      {selectedCardId === card.id && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.savedCardItem,
                      !selectedCardId && styles.savedCardSelected,
                    ]}
                    onPress={() => setSelectedCardId(null)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={!selectedCardId ? colors.primary : colors.gray} />
                    <Text style={[styles.savedCardText, !selectedCardId && { color: colors.primary }]}>
                      Usar novo cartao (link de pagamento)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.manageCardsLink}
                    onPress={() => router.push('/cards')}
                  >
                    <Text style={styles.manageCardsText}>Gerenciar cartoes</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>R$ {total.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {isPickup ? 'Retirada' : 'Taxa de entrega'}
                </Text>
                {isPickup ? (
                  <Text style={[styles.summaryValue, { color: colors.success || '#22c55e' }]}>Gratis</Text>
                ) : feeLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.summaryValue}>
                    {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Calculando...'}
                  </Text>
                )}
              </View>
              {!isPickup && timeData?.estimatedDeliveryTime && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tempo estimado</Text>
                  <View style={styles.estimateRow}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: '600' }]}>
                      ~{Math.ceil(timeData.estimatedDeliveryTime)} min
                    </Text>
                  </View>
                </View>
              )}
              {!isPickup && timeLoading && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tempo estimado</Text>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>R$ {finalTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.checkoutButton, { bottom: insets.bottom + 24 }, (loading || (!isPickup && !coords)) && styles.checkoutDisabled]}
        onPress={handleCheckout}
        disabled={loading || (!isPickup && !coords)}
      >
        <Text style={styles.checkoutText}>
          {loading ? 'Finalizando...' : `Finalizar pedido - R$ ${finalTotal.toFixed(2)}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { fontSize: fonts.regular, color: colors.textLight },
  emptyButton: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyButtonText: { color: colors.white, fontWeight: 'bold' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 56,
    backgroundColor: colors.white,
  },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text },
  clearText: { color: colors.danger, fontSize: fonts.regular },
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
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { fontSize: fonts.regular, fontWeight: 'bold', color: colors.text },
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
  warningBannerText: {
    flex: 1,
    fontSize: fonts.small,
    color: colors.warning,
    fontWeight: '600',
  },
  // Delivery type styles
  deliveryTypeSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
  },
  deliveryTypeTitle: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  deliveryTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
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
  deliveryTypeSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  deliveryTypeLabel: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: colors.gray,
  },
  deliveryTypeLabelSelected: {
    color: colors.primary,
  },
  // Location styles
  mapSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapLabel: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: colors.text,
  },
  savedAddressesLink: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600',
  },
  addressPickerList: {
    marginBottom: 12,
    gap: 6,
  },
  addressPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
  },
  addressPickerText: {
    flex: 1,
    fontSize: fonts.small,
    color: colors.text,
  },
  addressPickerBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  addressPickerBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
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
  paymentSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  paymentTitle: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
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
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  paymentOptionText: { flex: 1 },
  paymentOptionLabel: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: colors.text,
  },
  paymentOptionLabelSelected: {
    color: colors.primary,
  },
  paymentOptionDesc: {
    fontSize: fonts.small,
    color: colors.textLight,
    marginTop: 2,
  },
  summary: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: fonts.regular, color: colors.textLight },
  summaryValue: { fontSize: fonts.regular, color: colors.text },
  estimateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
  savedCardsSection: { marginTop: 12, gap: 6 },
  savedCardsTitle: { fontSize: fonts.small, fontWeight: '600', color: colors.textLight, marginBottom: 4 },
  savedCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.grayLight,
  },
  savedCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  savedCardText: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  savedCardHolder: { fontSize: fonts.small, color: colors.textLight, marginTop: 2 },
  manageCardsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  manageCardsText: { fontSize: fonts.small, color: colors.primary, fontWeight: '600' },
});
