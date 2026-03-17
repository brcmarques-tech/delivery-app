import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { GET_ORDER } from '../../src/lib/graphql/queries';
import { CONFIRM_RECEIPT } from '../../src/lib/graphql/mutations';
import { ORDER_UPDATED, DELIVERY_UPDATED } from '../../src/lib/graphql/subscriptions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../src/theme';

const statusSteps = [
  { key: 'PENDING', label: 'Pendente', icon: 'time-outline' as const },
  { key: 'ACCEPTED', label: 'Aceito', icon: 'checkmark-circle-outline' as const },
  { key: 'PREPARING', label: 'Preparando', icon: 'restaurant-outline' as const },
  { key: 'READY', label: 'Pronto', icon: 'bag-check-outline' as const },
  { key: 'PICKED_UP', label: 'Coletado', icon: 'bicycle-outline' as const },
  { key: 'DELIVERING', label: 'A caminho', icon: 'navigate-outline' as const },
  { key: 'DELIVERED', label: 'Entregue', icon: 'checkmark-done-outline' as const },
];

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, refetch } = useQuery(GET_ORDER, {
    variables: { id },
    pollInterval: 5000,
  });

  // Real-time updates for this order
  useSubscription(ORDER_UPDATED, {
    variables: { orderId: id },
    onData: () => { refetch(); },
  });
  useSubscription(DELIVERY_UPDATED, {
    variables: { orderId: id },
    onData: () => { refetch(); },
  });
  const [confirmReceipt, { loading: confirming }] = useMutation(CONFIRM_RECEIPT);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const order = data?.order;

  // Countdown timer for delivery confirmation
  const needsConfirmation = order?.status === 'DELIVERED' && !order?.customerConfirmedAt;
  const deliveredAt = order?.delivery?.deliveredAt;

  useEffect(() => {
    if (!needsConfirmation || !deliveredAt) {
      setTimeLeft(null);
      return;
    }

    const calcRemaining = () => {
      const elapsed = Date.now() - new Date(deliveredAt).getTime();
      const remaining = Math.max(0, 10 * 60 * 1000 - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));
    };

    calcRemaining();
    const interval = setInterval(calcRemaining, 1000);
    return () => clearInterval(interval);
  }, [needsConfirmation, deliveredAt]);

  const handleConfirmReceipt = async () => {
    try {
      await confirmReceipt({ variables: { orderId: id } });
      Alert.alert('Confirmado!', 'Recebimento confirmado com sucesso.');
      refetch();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.loading}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  const isAwaitingPayment = order.status === 'AWAITING_PAYMENT';
  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Pedido #{order.orderNumber}</Text>
        <View style={{ width: 24 }} />
      </View>

      {isAwaitingPayment && (
        <View style={styles.paymentBanner}>
          <Ionicons name="alert-circle" size={24} color={colors.warning} />
          <Text style={styles.paymentBannerText}>Aguardando pagamento</Text>
        </View>
      )}

      {isAwaitingPayment && (order.paymentMethod === 'CREDIT_CARD' || order.paymentMethod === 'PIX') && order.checkoutUrl && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => Linking.openURL(order.checkoutUrl)}
        >
          <Ionicons name={order.paymentMethod === 'PIX' ? 'qr-code-outline' : 'card-outline'} size={20} color={colors.white} />
          <Text style={styles.payButtonText}>
            {order.paymentMethod === 'PIX' ? 'Pagar com PIX' : 'Ir para pagamento'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.statusContainer}>
        {statusSteps.map((step, idx) => {
          const isActive = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, isActive && styles.stepDotActive, isCurrent && styles.stepDotCurrent]}>
                  <Ionicons
                    name={step.icon}
                    size={16}
                    color={isActive ? colors.white : colors.gray}
                  />
                </View>
                {idx < statusSteps.length - 1 && (
                  <View style={[styles.stepLine, isActive && styles.stepLineActive]} />
                )}
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {order.delivery?.deliverer && (
        <View style={styles.delivererCard}>
          <Ionicons name="bicycle" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.delivererName}>{order.delivery.deliverer.name}</Text>
            <Text style={styles.delivererPhone}>{order.delivery.deliverer.phone}</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {needsConfirmation && (
        <View style={styles.confirmCard}>
          <View style={styles.confirmHeader}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={styles.confirmTitle}>Pedido entregue!</Text>
          </View>
          <Text style={styles.confirmSubtitle}>
            Confirme que recebeu seu pedido para liberar o pagamento ao entregador.
          </Text>
          {timeLeft !== null && timeLeft > 0 && (
            <Text style={styles.confirmTimer}>
              Confirmacao automatica em {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </Text>
          )}
          {timeLeft === 0 && (
            <Text style={styles.confirmTimer}>Confirmando automaticamente...</Text>
          )}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmReceipt}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={20} color={colors.white} />
                <Text style={styles.confirmButtonText}>Confirmar recebimento</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {order.customerConfirmedAt && order.status === 'DELIVERED' && (
        <View style={styles.confirmedBanner}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.confirmedText}>
            Recebimento confirmado em {new Date(order.customerConfirmedAt).toLocaleString('pt-BR')}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Itens</Text>
        {order.items.map((item: any) => {
          const weightLabel = item.weightGrams
            ? item.weightGrams >= 1000
              ? `${(item.weightGrams / 1000).toFixed(item.weightGrams % 1000 === 0 ? 0 : 1)}kg`
              : `${item.weightGrams}g`
            : null;
          return (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemQty}>{weightLabel ? weightLabel : `${item.quantity}x`}</Text>
              <Text style={styles.itemName}>{item.product?.name || 'Produto removido'}</Text>
              <Text style={styles.itemPrice}>R$ {Number(item.totalPrice).toFixed(2)}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Endereco</Text>
        <Text style={styles.address}>{order.deliveryAddress}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>R$ {Number(order.subtotal).toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Entrega</Text>
          <Text style={styles.totalValue}>R$ {Number(order.deliveryFee).toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>R$ {Number(order.total).toFixed(2)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 56,
    backgroundColor: colors.white,
  },
  title: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text },
  statusContainer: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepIndicator: { alignItems: 'center' },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: { backgroundColor: colors.success },
  stepDotCurrent: { backgroundColor: colors.primary },
  stepLine: { width: 2, height: 24, backgroundColor: colors.grayLight },
  stepLineActive: { backgroundColor: colors.success },
  stepLabel: { fontSize: fonts.regular, color: colors.gray, marginTop: 6 },
  stepLabelActive: { color: colors.text, fontWeight: '600' },
  delivererCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  delivererName: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  delivererPhone: { fontSize: fonts.small, color: colors.textLight },
  callButton: { padding: 8 },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: fonts.large, fontWeight: '600', color: colors.text, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  itemQty: { width: 30, fontSize: fonts.regular, color: colors.textLight },
  itemName: { flex: 1, fontSize: fonts.regular, color: colors.text },
  itemPrice: { fontSize: fonts.regular, color: colors.text },
  address: { fontSize: fonts.regular, color: colors.textLight },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: fonts.regular, color: colors.textLight },
  totalValue: { fontSize: fonts.regular, color: colors.text },
  grandTotal: { borderTopWidth: 1, borderTopColor: colors.grayLight, paddingTop: 12, marginTop: 8 },
  grandTotalLabel: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text },
  grandTotalValue: { fontSize: fonts.large, fontWeight: 'bold', color: colors.primary },
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3CD',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
  },
  paymentBannerText: { fontSize: fonts.regular, fontWeight: '600', color: '#856404' },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  payButtonText: { color: colors.white, fontSize: fonts.regular, fontWeight: 'bold' },
  confirmCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: 'center',
    gap: 12,
  },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmTitle: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text },
  confirmSubtitle: { fontSize: fonts.regular, color: colors.textLight, textAlign: 'center' },
  confirmTimer: { fontSize: fonts.small, color: colors.primary, fontWeight: '600' },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  confirmButtonText: { color: colors.white, fontSize: fonts.regular, fontWeight: 'bold' },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D4EDDA',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  confirmedText: { fontSize: fonts.small, fontWeight: '600', color: '#155724' },
});
