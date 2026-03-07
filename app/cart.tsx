import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../src/contexts/CartContext';
import { useAlert } from '../src/contexts/AlertContext';
import { CREATE_ORDER } from '../src/lib/graphql/mutations';
import { colors, fonts } from '../src/theme';

type PaymentMethod = 'ON_DELIVERY' | 'MERCADO_PAGO' | 'PIX';

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: string; description: string }[] = [
  { key: 'ON_DELIVERY', label: 'Na entrega', icon: 'cash-outline', description: 'Pague ao receber' },
  { key: 'MERCADO_PAGO', label: 'Mercado Pago', icon: 'card-outline', description: 'Cartao, boleto ou debito' },
  { key: 'PIX', label: 'PIX', icon: 'qr-code-outline', description: 'Pagamento instantaneo' },
];

export default function CartScreen() {
  const { items, storeId, storeName, total, updateQuantity, removeItem, clearCart } = useCart();
  const { alert } = useAlert();
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ON_DELIVERY');
  const [createOrder] = useMutation(CREATE_ORDER);

  const deliveryFee = 5.99; // TODO: pegar da loja
  const finalTotal = total + deliveryFee;

  async function handleCheckout() {
    if (!address.trim()) {
      alert('Erro', 'Informe o endereco de entrega');
      return;
    }
    setLoading(true);
    try {
      const { data } = await createOrder({
        variables: {
          input: {
            storeId,
            items: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              notes: i.notes,
            })),
            deliveryAddress: address,
            deliveryLatitude: -23.5505, // TODO: geocoding real
            deliveryLongitude: -46.6333,
            notes,
            paymentMethod,
          },
        },
      });

      const order = data.createOrder;
      clearCart();

      if (paymentMethod === 'MERCADO_PAGO' && order.checkoutUrl) {
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
      } else if (paymentMethod === 'PIX' && order.pixQrCode) {
        router.replace({ pathname: `/order/${order.id}`, params: { showPix: '1' } });
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
      <View style={styles.header}>
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
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>R$ {(item.price * item.quantity).toFixed(2)}</Text>
            </View>
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
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <TextInput
              style={styles.addressInput}
              placeholder="Endereco de entrega"
              placeholderTextColor={colors.gray}
              value={address}
              onChangeText={setAddress}
            />
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
              {PAYMENT_OPTIONS.map((option) => (
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
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>R$ {total.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxa de entrega</Text>
                <Text style={styles.summaryValue}>R$ {deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>R$ {finalTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.checkoutButton, loading && styles.checkoutDisabled]}
        onPress={handleCheckout}
        disabled={loading}
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
  addressInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: fonts.regular,
    color: colors.text,
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
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
});
