import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { GET_MY_ORDERS } from '../lib/graphql/queries';
import { CONFIRM_RECEIPT } from '../lib/graphql/mutations';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { colors, fonts } from '../theme';

interface PendingOrder {
  id: string;
  orderNumber: string;
  deliveredAt: string;
}

export function DeliveryConfirmationModal() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [confirming, setConfirming] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data } = useQuery(GET_MY_ORDERS, {
    pollInterval: 15000,
    skip: !user || user.role !== 'CUSTOMER',
  });

  const [confirmReceipt] = useMutation(CONFIRM_RECEIPT);

  // Find orders that are DELIVERED but not confirmed by customer
  const pendingOrder: PendingOrder | null = React.useMemo(() => {
    if (!data?.myOrders) return null;
    const order = data.myOrders.find(
      (o: any) =>
        o.status === 'DELIVERED' &&
        !o.customerConfirmedAt &&
        o.delivery?.deliveredAt &&
        !dismissed.has(o.id),
    );
    if (!order) return null;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      deliveredAt: order.delivery.deliveredAt,
    };
  }, [data, dismissed]);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!pendingOrder) {
      setTimeLeft(null);
      return;
    }

    const calcRemaining = () => {
      const elapsed = Date.now() - new Date(pendingOrder.deliveredAt).getTime();
      const remaining = Math.max(0, 10 * 60 * 1000 - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));
    };

    calcRemaining();
    const interval = setInterval(calcRemaining, 1000);
    return () => clearInterval(interval);
  }, [pendingOrder?.id, pendingOrder?.deliveredAt]);

  if (!pendingOrder) return null;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await confirmReceipt({ variables: { orderId: pendingOrder.id } });
      setDismissed((prev) => new Set(prev).add(pendingOrder.id));
      showAlert({
        title: 'Recebimento confirmado!',
        message: 'Obrigado por confirmar. O pagamento sera liberado ao entregador.',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Erro',
        message: err.message || 'Nao foi possivel confirmar o recebimento.',
        type: 'error',
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleNotReceived = () => {
    showAlert({
      title: 'Nao recebeu o pedido?',
      message:
        'Entre em contato conosco pelo WhatsApp para resolver:\n\nA confirmacao automatica acontecera em alguns minutos caso nao haja contato.',
      type: 'warning',
      buttons: [
        { text: 'Entendi', style: 'default' },
      ],
    });
    // Don't dismiss - keep showing the modal so they still need to confirm or wait for auto-confirm
  };

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>

          <Text style={styles.title}>Pedido #{pendingOrder.orderNumber}</Text>
          <Text style={styles.subtitle}>entregue!</Text>

          <Text style={styles.description}>
            Confirme que voce recebeu seu pedido para liberar o pagamento ao entregador.
          </Text>

          {timeLeft !== null && timeLeft > 0 && (
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.timerText}>
                Confirmacao automatica em{' '}
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </Text>
            </View>
          )}
          {timeLeft === 0 && (
            <Text style={styles.timerText}>Confirmando automaticamente...</Text>
          )}

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={22} color={colors.white} />
                <Text style={styles.confirmButtonText}>Sim, recebi meu pedido</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={handleNotReceived}
            disabled={confirming}
          >
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.reportButtonText}>Nao recebi meu pedido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 16,
  },
  title: {
    fontSize: fonts.title,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.xlarge,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 16,
  },
  description: {
    fontSize: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  timerText: {
    fontSize: fonts.small,
    color: colors.primary,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  reportButtonText: {
    color: colors.danger,
    fontSize: fonts.regular,
    fontWeight: '600',
  },
});
