import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Alert, Modal, TextInput, Share, Image } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { GET_ORDER } from '../../src/lib/graphql/queries';
import { CONFIRM_RECEIPT, CONFIRM_PICKUP, CONFIRM_DELIVERY, CUSTOMER_DENY_DELIVERY, CANCEL_ORDER, DISPUTE_COMPLETED_ORDER } from '../../src/lib/graphql/mutations';
import { ORDER_UPDATED, DELIVERY_UPDATED } from '../../src/lib/graphql/subscriptions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { fonts } from '../../src/theme';

// M9: AWAITING_PAYMENT added as first status step
const statusSteps = [
  { key: 'AWAITING_PAYMENT', label: 'Aguardando pagamento', icon: 'card-outline' as const },
  { key: 'PENDING', label: 'Pendente', icon: 'time-outline' as const },
  { key: 'ACCEPTED', label: 'Aceito', icon: 'checkmark-circle-outline' as const },
  { key: 'PREPARING', label: 'Preparando', icon: 'restaurant-outline' as const },
  { key: 'READY', label: 'Pronto', icon: 'bag-check-outline' as const },
  { key: 'PICKED_UP', label: 'Coletado', icon: 'bicycle-outline' as const },
  { key: 'VENDOR_CONFIRMED_PICKUP', label: 'Saiu da loja', icon: 'storefront-outline' as const },
  { key: 'DELIVERING', label: 'A caminho', icon: 'navigate-outline' as const },
  { key: 'DELIVERER_CONFIRMED_DELIVERY', label: 'Entregue', icon: 'checkmark-done-outline' as const },
  { key: 'COMPLETED', label: 'Finalizado', icon: 'checkmark-circle' as const },
];

const terminalStatuses = ['REJECTED', 'DISPUTED', 'CANCELLED'];

const denyReasonOptions = [
  'Pedido não chegou',
  'Pedido incompleto',
  'Pedido errado',
  'Produto danificado',
  'Outro',
];

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
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
  const [customerDenyDelivery, { loading: denying }] = useMutation(CUSTOMER_DENY_DELIVERY);
  const [confirmPickup, { loading: pickingUp }] = useMutation(CONFIRM_PICKUP);
  const [confirmDelivery, { loading: delivering }] = useMutation(CONFIRM_DELIVERY);
  const [cancelOrder, { loading: cancelling }] = useMutation(CANCEL_ORDER);
  const [disputeCompleted, { loading: disputing }] = useMutation(DISPUTE_COMPLETED_ORDER);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [denyModalVisible, setDenyModalVisible] = useState(false);
  const [selectedDenyReason, setSelectedDenyReason] = useState<string | null>(null);
  const [customDenyReason, setCustomDenyReason] = useState('');
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [selectedDisputeReason, setSelectedDisputeReason] = useState<string | null>(null);
  const [customDisputeReason, setCustomDisputeReason] = useState('');
  const [pixModalVisible, setPixModalVisible] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(600); // 10 min

  const order = data?.order;
  const isDeliverer = user?.role === 'DELIVERER' || user?.isDeliverer;

  // Countdown timer for delivery confirmation (customer)
  const needsCustomerAction = order?.status === 'DELIVERER_CONFIRMED_DELIVERY';
  const delivererConfirmedAt = order?.delivererConfirmedDeliveryAt;

  useEffect(() => {
    if (!needsCustomerAction || !delivererConfirmedAt) {
      setTimeLeft(null);
      return;
    }

    const calcRemaining = () => {
      const elapsed = Date.now() - new Date(delivererConfirmedAt).getTime();
      const remaining = Math.max(0, 10 * 60 * 1000 - elapsed);
      setTimeLeft(Math.ceil(remaining / 1000));
    };

    calcRemaining();
    const interval = setInterval(calcRemaining, 1000);
    return () => clearInterval(interval);
  }, [needsCustomerAction, delivererConfirmedAt]);

  // Auto-open PIX modal when arriving at order with pending PIX payment
  // H5: Calculate PIX expiry from order creation time (30 min from creation, matching API's 30-minute expiry)
  useEffect(() => {
    if (order?.status === 'AWAITING_PAYMENT' && order?.paymentMethod === 'PIX' && order?.pixQrCode) {
      const pixExpiry = order.createdAt
        ? Math.max(0, 1800 - Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000))
        : 600;
      setPixTimeLeft(pixExpiry);
      setPixModalVisible(true);
    }
  }, [order?.status, order?.paymentMethod, order?.pixQrCode]);

  // PIX countdown timer (10 min)
  useEffect(() => {
    if (!pixModalVisible || pixTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setPixTimeLeft((prev) => {
        if (prev <= 1) {
          setPixModalVisible(false);
          Alert.alert('PIX expirado', 'O tempo para pagamento expirou. Gere um novo PIX.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pixModalVisible, pixTimeLeft]);

  const handleCopyPixCode = async () => {
    if (!order?.pixQrCode) return;
    await Clipboard.setStringAsync(order.pixQrCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const handleSharePixCode = async () => {
    if (!order?.pixQrCode) return;
    await Share.share({
      message: order.pixQrCode,
      title: `PIX - Pedido #${order.orderNumber}`,
    });
  };

  // M10: Confirmation dialog before confirming receipt
  const handleConfirmReceipt = async () => {
    Alert.alert(
      'Confirmar recebimento?',
      'Ao confirmar, o pagamento sera liberado ao entregador.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await confirmReceipt({ variables: { orderId: id } });
              Alert.alert('Confirmado!', 'Recebimento confirmado com sucesso.');
              refetch();
            } catch (err: any) {
              Alert.alert('Erro', err.message);
            }
          },
        },
      ],
    );
  };

  const handleDenyDelivery = async () => {
    const reason = selectedDenyReason === 'Outro' ? customDenyReason.trim() : selectedDenyReason;
    if (!reason) {
      Alert.alert('Erro', 'Selecione ou digite um motivo.');
      return;
    }
    try {
      await customerDenyDelivery({ variables: { orderId: id, reason } });
      setDenyModalVisible(false);
      setSelectedDenyReason(null);
      setCustomDenyReason('');
      Alert.alert('Enviado', 'Sua contestação foi registrada.');
      refetch();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleConfirmPickup = async () => {
    if (!order?.delivery?.id) return;
    try {
      await confirmPickup({ variables: { deliveryId: order.delivery.id } });
      Alert.alert('Confirmado!', 'Retirada confirmada.');
      refetch();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order?.delivery?.id) return;
    try {
      await confirmDelivery({ variables: { deliveryId: order.delivery.id } });
      Alert.alert('Confirmado!', 'Entrega confirmada.');
      refetch();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancelar pedido',
      'Tem certeza que deseja cancelar este pedido?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder({ variables: { orderId: id } });
              // M8: Show payment-method-specific refund message
              const refundMsg = order?.paymentMethod === 'PIX'
                ? 'O reembolso via PIX sera processado em ate 24h.'
                : order?.paymentMethod === 'CREDIT_CARD'
                ? 'O estorno sera processado em ate 7 dias uteis.'
                : 'Nenhuma cobranca foi efetuada.';
              Alert.alert('Cancelado', `Pedido cancelado. ${refundMsg}`);
              refetch();
            } catch (err: any) {
              Alert.alert('Erro', err.message);
            }
          },
        },
      ],
    );
  };

  const disputeReasonOptions = [
    'Pedido não chegou',
    'Pedido incompleto',
    'Pedido errado',
    'Produto danificado',
    'Produto com defeito',
    'Outro',
  ];

  const handleDisputeCompleted = async () => {
    const reason = selectedDisputeReason === 'Outro' ? customDisputeReason.trim() : selectedDisputeReason;
    if (!reason) {
      Alert.alert('Erro', 'Selecione ou digite um motivo.');
      return;
    }
    try {
      await disputeCompleted({ variables: { orderId: id, reason } });
      setDisputeModalVisible(false);
      setSelectedDisputeReason(null);
      setCustomDisputeReason('');
      Alert.alert('Enviado', 'Sua reclamação foi registrada. Analisaremos em breve.');
      refetch();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  };

  // Check if dispute is within 48h window
  const canDisputeCompleted = order?.status === 'COMPLETED' && order?.completedAt && !isDeliverer &&
    (Date.now() - new Date(order.completedAt).getTime()) < 48 * 60 * 60 * 1000;

  if (loading || !order) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Carregando...</Text>
      </View>
    );
  }

  const isAwaitingPayment = order.status === 'AWAITING_PAYMENT';
  const isTerminal = terminalStatuses.includes(order.status);
  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  // ETA calculation
  const etaMinutes = order.estimatedDeliveryEta
    ? Math.max(0, Math.ceil((new Date(order.estimatedDeliveryEta).getTime() - Date.now()) / 60000))
    : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Pedido #{order.orderNumber}</Text>
        <View style={{ width: 24 }} />
      </View>

      {isAwaitingPayment && (
        <View style={[styles.paymentBanner, { backgroundColor: isDark ? '#4A3A1A' : '#FFF3CD' }]}>
          <Ionicons name="alert-circle" size={18} color={colors.warning} />
          <Text style={[styles.paymentBannerText, { color: isDark ? '#FBBF24' : '#856404' }]}>Aguardando pagamento</Text>
        </View>
      )}

      {isAwaitingPayment && order.paymentMethod === 'PIX' && order.pixQrCode && (
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: '#00B4D8' }]}
          onPress={() => setPixModalVisible(true)}
        >
          <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
          <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>Pagar com PIX</Text>
        </TouchableOpacity>
      )}

      {isAwaitingPayment && order.paymentMethod === 'CREDIT_CARD' && order.checkoutUrl && (
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            const url = order.checkoutUrl;
            if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
              Linking.openURL(url);
            }
          }}
        >
          <Ionicons name="card-outline" size={18} color="#FFFFFF" />
          <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>Ir para pagamento</Text>
        </TouchableOpacity>
      )}

      {/* Terminal status banners */}
      {order.status === 'REJECTED' && (
        <View style={[styles.terminalBanner, { backgroundColor: isDark ? '#3A1A1A' : '#F8D7DA' }]}>
          <Ionicons name="close-circle" size={18} color={colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.terminalBannerTitle, { color: isDark ? '#FCA5A5' : '#721C24' }]}>Pedido rejeitado</Text>
            {order.rejectionReason && (
              <Text style={[styles.terminalBannerSub, { color: isDark ? '#FCA5A5' : '#721C24' }]}>
                Motivo: {order.rejectionReason}
              </Text>
            )}
          </View>
        </View>
      )}

      {order.status === 'DISPUTED' && (
        <View style={[styles.terminalBanner, { backgroundColor: isDark ? '#4A3A1A' : '#FFF3CD' }]}>
          <Ionicons name="warning" size={18} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.terminalBannerTitle, { color: isDark ? '#FBBF24' : '#856404' }]}>Em disputa</Text>
            {order.disputeReason && (
              <Text style={[styles.terminalBannerSub, { color: isDark ? '#FBBF24' : '#856404' }]}>
                Motivo: {order.disputeReason}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Status tracker - only show for non-terminal statuses */}
      {!isTerminal && (
        <View style={[styles.statusContainer, { backgroundColor: colors.card }]}>
          {statusSteps.map((step, idx) => {
            const isActive = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepIndicator}>
                  <View style={[
                    styles.stepDot,
                    { backgroundColor: colors.grayLight },
                    isActive && { backgroundColor: colors.success },
                    isCurrent && { backgroundColor: colors.primary },
                  ]}>
                    <Ionicons
                      name={step.icon}
                      size={16}
                      color={isActive ? '#FFFFFF' : colors.gray}
                    />
                  </View>
                  {idx < statusSteps.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: colors.grayLight }, isActive && { backgroundColor: colors.success }]} />
                  )}
                </View>
                <Text style={[styles.stepLabel, { color: colors.gray }, isActive && { color: colors.text, fontWeight: '600' }]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* ETA display */}
      {etaMinutes !== null && etaMinutes > 0 && !isTerminal && order.status !== 'COMPLETED' && (
        <View style={[styles.etaBanner, { backgroundColor: isDark ? '#1A2A3A' : '#D1ECF1' }]}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={[styles.etaText, { color: isDark ? '#93C5FD' : '#0C5460' }]}>
            Chega em ~{etaMinutes} min
          </Text>
        </View>
      )}

      {order.delivery?.deliverer && (
        <View style={[styles.delivererCard, { backgroundColor: colors.card }]}>
          <Ionicons name="bicycle" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.delivererName, { color: colors.text }]}>{order.delivery.deliverer.name}</Text>
            <Text style={[styles.delivererPhone, { color: colors.textLight }]}>{order.delivery.deliverer.phone}</Text>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Deliverer action buttons */}
      {isDeliverer && order.status === 'VENDOR_CONFIRMED_PICKUP' && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleConfirmPickup}
          disabled={pickingUp}
        >
          {pickingUp ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="bag-check-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Confirmar Retirada</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {isDeliverer && order.status === 'DELIVERING' && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={handleConfirmDelivery}
          disabled={delivering}
        >
          {delivering ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Confirmar Entrega</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Customer confirmation card when deliverer confirmed delivery */}
      {needsCustomerAction && !isDeliverer && (
        <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.success }]}>
          <View style={styles.confirmHeader}>
            <Ionicons name="checkmark-circle" size={26} color={colors.success} />
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Pedido entregue!</Text>
          </View>
          <Text style={[styles.confirmSubtitle, { color: colors.textLight }]}>
            Confirme que recebeu seu pedido para liberar o pagamento ao entregador.
          </Text>
          {timeLeft !== null && timeLeft > 0 && (
            <Text style={[styles.confirmTimer, { color: colors.primary }]}>
              Confirme em {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </Text>
          )}
          {timeLeft === 0 && (
            <Text style={[styles.confirmTimer, { color: colors.primary }]}>Confirmando automaticamente...</Text>
          )}
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.success }]}
            onPress={handleConfirmReceipt}
            disabled={confirming}
          >
            {confirming ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>Confirmar Recebimento</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.denyButton, { borderColor: colors.danger }]}
            onPress={() => setDenyModalVisible(true)}
            disabled={denying}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            <Text style={[styles.denyButtonText, { color: colors.danger }]}>Não recebi o pedido</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.customerConfirmedAt && (order.status === 'COMPLETED' || order.status === 'DELIVERED') && (
        <View style={[styles.confirmedBanner, { backgroundColor: isDark ? '#1A3A2A' : '#D4EDDA' }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[styles.confirmedText, { color: isDark ? '#6EE7B7' : '#155724' }]}>
            Recebimento confirmado em {new Date(order.customerConfirmedAt).toLocaleString('pt-BR')}
          </Text>
        </View>
      )}

      {order.completedAt && order.status === 'COMPLETED' && (
        <View style={[styles.confirmedBanner, { backgroundColor: isDark ? '#1A3A2A' : '#D4EDDA' }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[styles.confirmedText, { color: isDark ? '#6EE7B7' : '#155724' }]}>
            Pedido finalizado em {new Date(order.completedAt).toLocaleString('pt-BR')}
          </Text>
        </View>
      )}

      {/* Dispute button - 48h after COMPLETED */}
      {canDisputeCompleted && (
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.warning }]}
          onPress={() => setDisputeModalVisible(true)}
        >
          <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
          <Text style={[styles.cancelButtonText, { color: colors.warning }]}>Tive um problema</Text>
        </TouchableOpacity>
      )}

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Itens</Text>
        {order.items.map((item: any) => {
          const weightLabel = item.weightGrams
            ? item.weightGrams >= 1000
              ? `${(item.weightGrams / 1000).toFixed(item.weightGrams % 1000 === 0 ? 0 : 1)}kg`
              : `${item.weightGrams}g`
            : null;
          return (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.itemQty, { color: colors.textLight }]}>{weightLabel ? weightLabel : `${item.quantity}x`}</Text>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.product?.name || 'Produto removido'}</Text>
              <Text style={[styles.itemPrice, { color: colors.text }]}>R$ {Number(item.totalPrice).toFixed(2)}</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Endereco</Text>
        <Text style={[styles.address, { color: colors.textLight }]}>{order.deliveryAddress}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.textLight }]}>Subtotal</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>R$ {Number(order.subtotal).toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.textLight }]}>Entrega</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>R$ {Number(order.deliveryFee).toFixed(2)}</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal, { borderTopColor: colors.grayLight }]}>
          <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.grandTotalValue, { color: colors.primary }]}>R$ {Number(order.total).toFixed(2)}</Text>
        </View>
      </View>

      {/* Cancel button - PENDING or ACCEPTED (before PREPARING) */}
      {(order.status === 'PENDING' || order.status === 'ACCEPTED') && !isDeliverer && (
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.danger }]}
          onPress={handleCancelOrder}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
              <Text style={[styles.cancelButtonText, { color: colors.danger }]}>Cancelar pedido</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={{ height: insets.bottom + 16 }} />

      {/* PIX payment modal */}
      <Modal
        visible={pixModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPixModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pixModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Pagar com PIX</Text>
              <TouchableOpacity onPress={() => setPixModalVisible(false)}>
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Timer */}
            <View style={[styles.pixTimerBar, { backgroundColor: pixTimeLeft < 60 ? '#FEE2E2' : isDark ? '#1A2A1A' : '#ECFDF5' }]}>
              <Ionicons name="time-outline" size={18} color={pixTimeLeft < 60 ? '#DC2626' : '#10B981'} />
              <Text style={[styles.pixTimerText, { color: pixTimeLeft < 60 ? '#DC2626' : '#10B981' }]}>
                {Math.floor(pixTimeLeft / 60)}:{(pixTimeLeft % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            {/* QR Code */}
            {order?.pixQrCodeBase64 ? (
              <View style={styles.pixQrContainer}>
                <Image
                  source={{ uri: order.pixQrCodeBase64 }}
                  style={styles.pixQrImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            {/* Amount */}
            <Text style={[styles.pixAmount, { color: colors.text }]}>
              R$ {Number(order?.total || 0).toFixed(2)}
            </Text>
            <Text style={[styles.pixLabel, { color: colors.textLight }]}>
              Pedido #{order?.orderNumber}
            </Text>

            {/* Copy button */}
            <TouchableOpacity
              style={[styles.pixCopyButton, { backgroundColor: pixCopied ? '#10B981' : '#00B4D8' }]}
              onPress={handleCopyPixCode}
            >
              <Ionicons name={pixCopied ? 'checkmark-circle' : 'copy-outline'} size={18} color="#FFFFFF" />
              <Text style={styles.pixCopyButtonText}>
                {pixCopied ? 'Codigo copiado!' : 'Copiar codigo PIX'}
              </Text>
            </TouchableOpacity>

            {/* Share button */}
            <TouchableOpacity
              style={[styles.pixShareButton, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}
              onPress={handleSharePixCode}
            >
              <Ionicons name="share-outline" size={18} color={colors.text} />
              <Text style={[styles.pixShareButtonText, { color: colors.text }]}>
                Enviar para app do banco
              </Text>
            </TouchableOpacity>

            <Text style={[styles.pixHint, { color: colors.gray }]}>
              Abra o app do seu banco e cole o codigo PIX, ou escaneie o QR Code acima.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Deny delivery modal */}
      <Modal
        visible={denyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDenyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Contestar entrega</Text>
              <TouchableOpacity onPress={() => setDenyModalVisible(false)}>
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textLight }]}>
              Selecione o motivo da contestação:
            </Text>
            {denyReasonOptions.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  { borderColor: colors.grayLight },
                  selectedDenyReason === reason && { borderColor: colors.primary, backgroundColor: isDark ? '#3A2A1A' : '#FFF5F0' },
                ]}
                onPress={() => setSelectedDenyReason(reason)}
              >
                <Ionicons
                  name={selectedDenyReason === reason ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selectedDenyReason === reason ? colors.primary : colors.gray}
                />
                <Text style={[styles.reasonText, { color: colors.text }]}>{reason}</Text>
              </TouchableOpacity>
            ))}
            {selectedDenyReason === 'Outro' && (
              <TextInput
                style={[styles.reasonInput, { borderColor: colors.grayLight, color: colors.text, backgroundColor: isDark ? '#2D2D2D' : '#F9F9F9' }]}
                placeholder="Descreva o motivo..."
                placeholderTextColor={colors.gray}
                value={customDenyReason}
                onChangeText={setCustomDenyReason}
                multiline
              />
            )}
            <TouchableOpacity
              style={[styles.modalConfirmButton, { backgroundColor: colors.danger }]}
              onPress={handleDenyDelivery}
              disabled={denying || (!selectedDenyReason || (selectedDenyReason === 'Outro' && !customDenyReason.trim()))}
            >
              {denying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalConfirmButtonText}>Enviar contestação</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dispute completed order modal */}
      <Modal
        visible={disputeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDisputeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Relatar problema</Text>
              <TouchableOpacity onPress={() => setDisputeModalVisible(false)}>
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textLight }]}>
              O que aconteceu com seu pedido?
            </Text>
            {disputeReasonOptions.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  { borderColor: colors.grayLight },
                  selectedDisputeReason === reason && { borderColor: colors.primary, backgroundColor: isDark ? '#3A2A1A' : '#FFF5F0' },
                ]}
                onPress={() => setSelectedDisputeReason(reason)}
              >
                <Ionicons
                  name={selectedDisputeReason === reason ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selectedDisputeReason === reason ? colors.primary : colors.gray}
                />
                <Text style={[styles.reasonText, { color: colors.text }]}>{reason}</Text>
              </TouchableOpacity>
            ))}
            {selectedDisputeReason === 'Outro' && (
              <TextInput
                style={[styles.reasonInput, { borderColor: colors.grayLight, color: colors.text, backgroundColor: isDark ? '#2D2D2D' : '#F9F9F9' }]}
                placeholder="Descreva o problema..."
                placeholderTextColor={colors.gray}
                value={customDisputeReason}
                onChangeText={setCustomDisputeReason}
                multiline
              />
            )}
            <TouchableOpacity
              style={[styles.modalConfirmButton, { backgroundColor: colors.warning }]}
              onPress={handleDisputeCompleted}
              disabled={disputing || (!selectedDisputeReason || (selectedDisputeReason === 'Outro' && !customDisputeReason.trim()))}
            >
              {disputing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalConfirmButtonText}>Enviar reclamação</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 56,
  },
  title: { fontSize: fonts.large, fontWeight: 'bold' },
  statusContainer: {
    margin: 12,
    borderRadius: 10,
    padding: 10,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  stepIndicator: { alignItems: 'center' },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: { width: 2, height: 24 },
  stepLabel: { fontSize: fonts.regular, marginTop: 6 },
  delivererCard: {
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  delivererName: { fontSize: fonts.regular, fontWeight: '600' },
  delivererPhone: { fontSize: fonts.small },
  callButton: { padding: 8 },
  section: {
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: fonts.large, fontWeight: '600', marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  itemQty: { width: 30, fontSize: fonts.regular },
  itemName: { flex: 1, fontSize: fonts.regular },
  itemPrice: { fontSize: fonts.regular },
  address: { fontSize: fonts.regular },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: fonts.regular },
  totalValue: { fontSize: fonts.regular },
  grandTotal: { borderTopWidth: 1, paddingTop: 12, marginTop: 8 },
  grandTotalLabel: { fontSize: fonts.large, fontWeight: 'bold' },
  grandTotalValue: { fontSize: fonts.large, fontWeight: 'bold' },
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 10,
    padding: 10,
  },
  paymentBannerText: { fontSize: fonts.regular, fontWeight: '600' },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
  },
  payButtonText: { fontSize: fonts.regular, fontWeight: 'bold' },
  confirmCard: {
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 6,
  },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmTitle: { fontSize: fonts.xlarge, fontWeight: 'bold' },
  confirmSubtitle: { fontSize: fonts.regular, textAlign: 'center' },
  confirmTimer: { fontSize: fonts.small, fontWeight: '600' },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
  },
  confirmButtonText: { fontSize: fonts.regular, fontWeight: 'bold' },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 12,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  confirmedText: { fontSize: fonts.small, fontWeight: '600' },
  terminalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 10,
    padding: 12,
  },
  terminalBannerTitle: { fontSize: fonts.regular, fontWeight: '700' },
  terminalBannerSub: { fontSize: fonts.small, marginTop: 2 },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    padding: 10,
  },
  etaText: { fontSize: fonts.regular, fontWeight: '600' },
  denyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    borderWidth: 2,
  },
  denyButtonText: { fontSize: fonts.regular, fontWeight: 'bold' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    paddingVertical: 12,
  },
  actionButtonText: { fontSize: fonts.regular, fontWeight: 'bold', color: '#FFFFFF' },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 2,
  },
  cancelButtonText: { fontSize: fonts.regular, fontWeight: 'bold' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 12,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: fonts.xlarge, fontWeight: 'bold' },
  modalSubtitle: { fontSize: fonts.regular, marginBottom: 12 },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  reasonText: { fontSize: fonts.regular },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: fonts.regular,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  modalConfirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
  },
  modalConfirmButtonText: { fontSize: fonts.regular, fontWeight: 'bold', color: '#FFFFFF' },
  // PIX modal styles
  pixModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 12,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pixTimerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  pixTimerText: {
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  pixQrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  pixQrImage: {
    width: 200,
    height: 200,
  },
  pixAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pixLabel: {
    fontSize: fonts.small,
    marginBottom: 14,
  },
  pixCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  pixCopyButtonText: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pixShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  pixShareButtonText: {
    fontSize: fonts.regular,
    fontWeight: '600',
  },
  pixHint: {
    fontSize: fonts.small,
    textAlign: 'center',
    lineHeight: 20,
  },
});
