import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { AnimatedListItem } from '../../src/components/AnimatedListItem';
import { AnimatedPressable } from '../../src/components/AnimatedPressable';
import { AnimatedItem } from '../../src/components/AnimatedItem';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GET_MY_ORDERS, MY_APPOINTMENTS } from '../../src/lib/graphql/queries';
import { CANCEL_APPOINTMENT } from '../../src/lib/graphql/mutations';
import { ORDER_UPDATED } from '../../src/lib/graphql/subscriptions';
import { useAuth } from '../../src/contexts/AuthContext'; // KAN-238
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as staticColors, fonts } from '../../src/theme';

type ActiveTab = 'orders' | 'appointments';

const appointmentStatusLabels: Record<string, { label: string; colorKey: string }> = {
  PENDING: { label: 'Pendente', colorKey: 'warning' },
  CONFIRMED: { label: 'Confirmado', colorKey: 'primary' },
  COMPLETED: { label: 'Concluido', colorKey: 'success' },
  CANCELLED: { label: 'Cancelado', colorKey: 'gray' },
  NO_SHOW: { label: 'Nao compareceu', colorKey: 'danger' },
  QUOTE_REQUESTED: { label: 'Orcamento solicitado', colorKey: 'warning' },
  QUOTED: { label: 'Orcamento recebido', colorKey: 'primary' },
  QUOTE_ACCEPTED: { label: 'Orcamento aceito', colorKey: 'primary' },
  QUOTE_REJECTED: { label: 'Orcamento recusado', colorKey: 'gray' },
};

export default function OrdersScreen() {
  const { user } = useAuth(); // KAN-238: guard das subscriptions
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');

  // Orders
  const { data, loading, refetch } = useQuery(GET_MY_ORDERS);
  const orders = data?.myOrders || [];
  // KAN-255: useRef exige valor inicial (ou `undefined` no tipo).
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const debouncedRefetch = useCallback(() => {
    clearTimeout(refetchTimeoutRef.current);
    refetchTimeoutRef.current = setTimeout(() => refetch(), 1000);
  }, [refetch]);

  // Appointments
  const { data: appointmentsData, loading: appointmentsLoading, refetch: refetchAppointments } = useQuery(MY_APPOINTMENTS);
  const appointments = appointmentsData?.myAppointments || [];
  const [cancelAppointment] = useMutation(CANCEL_APPOINTMENT);

  const statusLabels: Record<string, { label: string; color: string }> = {
    AWAITING_PAYMENT: { label: 'Aguardando pagamento', color: colors.warning },
    PAYMENT_REVIEW: { label: 'Em analise', color: colors.warning },
    PENDING: { label: 'Pendente', color: colors.warning },
    ACCEPTED: { label: 'Aceito', color: colors.primary },
    PREPARING: { label: 'Preparando', color: colors.primary },
    READY: { label: 'Pronto', color: colors.success },
    PICKED_UP: { label: 'Coletado', color: colors.success },
    DELIVERING: { label: 'A caminho', color: colors.success },
    DELIVERED: { label: 'Entregue', color: colors.grayDark },
    CANCELLED: { label: 'Cancelado', color: colors.danger },
    COMPLETED: { label: 'Entregue', color: colors.success },
    REJECTED: { label: 'Rejeitado', color: colors.danger },
    DISPUTED: { label: 'Em reclamacao', color: colors.warning },
    VENDOR_CONFIRMED_PICKUP: { label: 'Retirado', color: colors.primary },
    DELIVERER_CONFIRMED_DELIVERY: { label: 'Entrega confirmada', color: colors.success },
    EXPIRED: { label: 'Nao aceito', color: colors.danger },
  };

  // Real-time order updates (debounced to prevent excessive refetches)
  // KAN-238: `skip: !user` — sem isso a subscription continuava ativa mesmo
  // deslogado, abrindo WS e gerando erro de auth no servidor. O mesmo guard ja
  // existia no listener global (useOrderNotifications); aqui faltava.
  useSubscription(ORDER_UPDATED, {
    skip: !user,
    onData: () => { debouncedRefetch(); },
  });

  function getAppointmentStatusColor(status: string): string {
    const entry = appointmentStatusLabels[status];
    if (!entry) return colors.gray;
    const map: Record<string, string> = {
      warning: colors.warning,
      primary: colors.primary,
      success: colors.success,
      gray: colors.gray,
      danger: colors.danger,
    };
    return map[entry.colorKey] || colors.gray;
  }

  async function handleCancelAppointment(id: string) {
    showAlert({
      title: 'Cancelar agendamento',
      message: 'Tem certeza que deseja cancelar este agendamento?',
      buttons: [
        { text: 'Nao', style: 'cancel' },
        {
          text: 'Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment({ variables: { id } });
              refetchAppointments();
            } catch (err: any) {
              showAlert({ title: 'Erro', message: err.message || 'Erro ao cancelar agendamento' });
            }
          },
        },
      ],
    });
  }

  function formatAppointmentDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  const renderAppointmentCard = useCallback(({ item, index }: { item: any; index: number }) => {
    const statusEntry = appointmentStatusLabels[item.status];
    const statusLabel = statusEntry?.label || item.status;
    const statusColor = getAppointmentStatusColor(item.status);
    const canCancel = ['PENDING', 'CONFIRMED', 'QUOTE_REQUESTED', 'QUOTED'].includes(item.status);

    return (
      <AnimatedListItem index={index}>
        <AnimatedPressable
          activeOpacity={0.7}
          onPress={() => router.push(`/appointment/${item.id}`)}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                {item.store?.logoUrl ? (
                  <Image source={{ uri: item.store.logoUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                ) : null}
                <Text style={[styles.storeName, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {item.store?.name}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            <Text style={[styles.orderNumber, { color: colors.textLight }]}>
              {item.service?.name}
            </Text>

            <View style={{ marginTop: 8, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                <Text style={{ fontSize: fonts.small, color: colors.text }}>
                  {formatAppointmentDate(item.scheduledDate)}
                </Text>
                <Ionicons name="time-outline" size={14} color={colors.textLight} style={{ marginLeft: 8 }} />
                <Text style={{ fontSize: fonts.small, color: colors.text }}>
                  {item.scheduledTime}{item.endTime ? ` - ${item.endTime}` : ''}
                </Text>
              </View>
            </View>

            {item.notes ? (
              <Text style={{ fontSize: fonts.small, color: colors.textLight, marginTop: 4 }}>
                {item.notes}
              </Text>
            ) : null}

            <View style={[styles.cardFooter, { borderTopColor: colors.grayLight }]}>
              {item.price ? (
                <Text style={[styles.total, { color: colors.text }]}>R$ {Number(item.price).toFixed(2)}</Text>
              ) : (
                <Text style={{ fontSize: fonts.small, color: colors.textLight }}>Preco a definir</Text>
              )}
              {canCancel && (
                <TouchableOpacity onPress={() => handleCancelAppointment(item.id)}>
                  <Text style={{ fontSize: fonts.small, color: colors.danger, fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </AnimatedPressable>
      </AnimatedListItem>
    );
  }, [colors, handleCancelAppointment]);

  const renderOrderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const status = statusLabels[item.status] || { label: item.status, color: colors.gray };
    return (
      <AnimatedListItem index={index}>
        <AnimatedPressable
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => router.push(`/order/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.storeName, { color: colors.text }]}>{item.store.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={[styles.orderNumber, { color: colors.textLight }]}>#{item.orderNumber}</Text>
          {item.rejectionReason && (item.status === 'REJECTED' || item.status === 'CANCELLED') && (
            <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>Motivo: {item.rejectionReason}</Text>
          )}
          <View style={styles.itemsList}>
            {item.items.slice(0, 3).map((oi: any) => (
              <Text key={oi.id} style={[styles.itemText, { color: colors.text }]}>
                {oi.quantity}x {oi.product?.name || 'Produto removido'}
              </Text>
            ))}
            {item.items.length > 3 && (
              <Text style={[styles.moreItems, { color: colors.textLight }]}>+{item.items.length - 3} itens</Text>
            )}
          </View>
          <View style={[styles.cardFooter, { borderTopColor: colors.grayLight }]}>
            <Text style={[styles.total, { color: colors.text }]}>R$ {Number(item.total).toFixed(2)}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.gray} />
          </View>
        </AnimatedPressable>
      </AnimatedListItem>
    );
  }, [colors, statusLabels]);

  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);

  function handleTabPress(tab: ActiveTab) {
    setActiveTab(tab);
    pagerRef.current?.scrollTo({ x: tab === 'orders' ? 0 : width, animated: true });
  }

  function handlePagerScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    const tab = page === 0 ? 'orders' : 'appointments';
    if (tab !== activeTab) setActiveTab(tab);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.white, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {activeTab === 'orders' ? 'Meus pedidos' : 'Meus agendamentos'}
        </Text>

        {/* Segment control */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.grayLight + '50' }]}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'orders' && { backgroundColor: colors.primary },
            ]}
            onPress={() => handleTabPress('orders')}
          >
            <Text style={[
              styles.segmentText,
              { color: activeTab === 'orders' ? '#FFFFFF' : colors.textLight },
            ]}>
              Pedidos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'appointments' && { backgroundColor: colors.primary },
            ]}
            onPress={() => handleTabPress('appointments')}
          >
            <Text style={[
              styles.segmentText,
              { color: activeTab === 'appointments' ? '#FFFFFF' : colors.textLight },
            ]}>
              Agendamentos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePagerScroll}
        scrollEventThrottle={16}
      >
        <View style={{ width }}>
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, orders.length === 0 && { flexGrow: 1, justifyContent: 'center' }]}
            removeClippedSubviews
            maxToRenderPerBatch={8}
            windowSize={5}
            initialNumToRender={6}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
            renderItem={renderOrderItem}
            ListEmptyComponent={
              !loading ? (
                <AnimatedItem delay={100} fromY={20}>
                  <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={56} color={colors.grayLight} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Nada por aqui ainda</Text>
                    <Text style={[styles.emptyText, { color: colors.textLight }]}>Explore as lojas na aba de busca e faca seu primeiro pedido!</Text>
                    <TouchableOpacity
                      style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                      onPress={() => router.push('/(tabs)/search')}
                    >
                      <Ionicons name="search" size={18} color="#FFFFFF" />
                      <Text style={styles.emptyButtonText}>Explorar lojas</Text>
                    </TouchableOpacity>
                  </View>
                </AnimatedItem>
              ) : null
            }
          />
        </View>
        <View style={{ width }}>
          <FlatList
            data={appointments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, appointments.length === 0 && { flexGrow: 1, justifyContent: 'center' }]}
            removeClippedSubviews
            maxToRenderPerBatch={8}
            windowSize={5}
            initialNumToRender={6}
            refreshControl={<RefreshControl refreshing={appointmentsLoading} onRefresh={refetchAppointments} />}
            renderItem={renderAppointmentCard}
            ListEmptyComponent={
              !appointmentsLoading ? (
                <AnimatedItem delay={100} fromY={20}>
                  <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={56} color={colors.grayLight} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum agendamento</Text>
                    <Text style={[styles.emptyText, { color: colors.textLight }]}>Explore servicos na aba de busca</Text>
                    <TouchableOpacity
                      style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                      onPress={() => router.push('/(tabs)/search')}
                    >
                      <Ionicons name="search" size={18} color="#FFFFFF" />
                      <Text style={styles.emptyButtonText}>Explorar servicos</Text>
                    </TouchableOpacity>
                  </View>
                </AnimatedItem>
              ) : null
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: staticColors.background },
  header: { padding: 12, paddingTop: 56, backgroundColor: staticColors.white },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: staticColors.text },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginTop: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: fonts.regular,
    fontWeight: '600',
  },
  list: { padding: 12, gap: 6 },
  card: { backgroundColor: staticColors.white, borderRadius: 10, padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: fonts.large, fontWeight: '600', color: staticColors.text },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: fonts.tiny, fontWeight: '600' },
  orderNumber: { fontSize: fonts.small, color: staticColors.textLight, marginTop: 4 },
  itemsList: { marginTop: 12, gap: 4 },
  itemText: { fontSize: fonts.small, color: staticColors.text },
  moreItems: { fontSize: fonts.small, color: staticColors.textLight },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: staticColors.grayLight },
  total: { fontSize: fonts.large, fontWeight: 'bold', color: staticColors.text },
  emptyContainer: { alignItems: 'center', gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: fonts.large, fontWeight: '700' },
  emptyText: { fontSize: fonts.regular, color: staticColors.textLight, textAlign: 'center', lineHeight: 22 },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: fonts.regular },
});
