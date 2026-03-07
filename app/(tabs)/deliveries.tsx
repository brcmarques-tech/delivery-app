import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { GET_AVAILABLE_DELIVERIES, GET_MY_DELIVERIES } from '../../src/lib/graphql/queries';
import { ACCEPT_DELIVERY, CONFIRM_PICKUP, CONFIRM_DELIVERY } from '../../src/lib/graphql/mutations';
import { colors, fonts } from '../../src/theme';

const statusLabels: Record<string, { label: string; color: string }> = {
  PICKED_UP: { label: 'Coletado', color: colors.warning },
  DELIVERING: { label: 'A caminho', color: colors.primary },
  DELIVERED: { label: 'Entregue', color: colors.success },
};

type Tab = 'available' | 'my';

export default function DeliveriesScreen() {
  const [tab, setTab] = useState<Tab>('available');

  const {
    data: availableData,
    loading: loadingAvailable,
    refetch: refetchAvailable,
  } = useQuery(GET_AVAILABLE_DELIVERIES, { pollInterval: 10000 });

  const {
    data: myData,
    loading: loadingMy,
    refetch: refetchMy,
  } = useQuery(GET_MY_DELIVERIES, { pollInterval: 10000 });

  const [acceptDelivery] = useMutation(ACCEPT_DELIVERY);
  const [confirmPickup] = useMutation(CONFIRM_PICKUP);
  const [confirmDeliveryMut] = useMutation(CONFIRM_DELIVERY);

  const availableOrders = availableData?.availableDeliveries || [];
  const myDeliveries = myData?.myDeliveries || [];
  const activeDeliveries = myDeliveries.filter((d: any) => !d.deliveredAt);
  const completedDeliveries = myDeliveries.filter((d: any) => d.deliveredAt);

  async function handleAccept(orderId: string, orderNumber: string) {
    Alert.alert('Aceitar entrega', `Aceitar pedido #${orderNumber}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aceitar',
        onPress: async () => {
          try {
            await acceptDelivery({ variables: { orderId } });
            refetchAvailable();
            refetchMy();
            setTab('my');
            Alert.alert('Sucesso', 'Entrega aceita! Va ate a loja para coletar.');
          } catch {
            Alert.alert('Erro', 'Nao foi possivel aceitar a entrega.');
          }
        },
      },
    ]);
  }

  async function handleConfirmPickup(deliveryId: string) {
    Alert.alert('Confirmar coleta', 'Voce ja retirou o pedido na loja?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, coletei',
        onPress: async () => {
          try {
            await confirmPickup({ variables: { deliveryId } });
            refetchMy();
          } catch {
            Alert.alert('Erro', 'Nao foi possivel confirmar a coleta.');
          }
        },
      },
    ]);
  }

  async function handleConfirmDelivery(deliveryId: string) {
    Alert.alert('Confirmar entrega', 'O pedido foi entregue ao cliente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, entreguei',
        onPress: async () => {
          try {
            await confirmDeliveryMut({ variables: { deliveryId } });
            refetchMy();
            refetchAvailable();
          } catch {
            Alert.alert('Erro', 'Nao foi possivel confirmar a entrega.');
          }
        },
      },
    ]);
  }

  function renderAvailableOrder({ item }: { item: any }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.storeInfo}>
            <Ionicons name="storefront" size={20} color={colors.primary} />
            <Text style={styles.storeName}>{item.store.name}</Text>
          </View>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        </View>

        <View style={styles.addressSection}>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressLabel}>Retirar em</Text>
              <Text style={styles.addressText}>
                {item.store.street}, {item.store.number} - {item.store.neighborhood}
              </Text>
            </View>
          </View>
          <View style={styles.addressDivider} />
          <View style={styles.addressRow}>
            <Ionicons name="flag" size={16} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressLabel}>Entregar em</Text>
              <Text style={styles.addressText}>{item.deliveryAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.itemsList}>
          {item.items.map((oi: any) => (
            <Text key={oi.id} style={styles.itemText}>
              {oi.quantity}x {oi.product.name}
            </Text>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.feeLabel}>Taxa de entrega</Text>
            <Text style={styles.feeValue}>R$ {Number(item.deliveryFee).toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAccept(item.id, item.orderNumber)}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={styles.acceptButtonText}>Aceitar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderMyDelivery({ item }: { item: any }) {
    const order = item.order;
    const status = statusLabels[order.status] || { label: order.status, color: colors.gray };
    const isActive = !item.deliveredAt;

    return (
      <View style={[styles.card, isActive && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.storeName}>{order.store.name}</Text>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {isActive && (
          <>
            <View style={styles.addressSection}>
              <View style={styles.addressRow}>
                <Ionicons name="storefront" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressLabel}>Loja</Text>
                  <Text style={styles.addressText}>
                    {order.store.street}, {order.store.number} - {order.store.neighborhood}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.store.phone}`)}>
                  <Ionicons name="call" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.addressDivider} />
              <View style={styles.addressRow}>
                <Ionicons name="flag" size={16} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressLabel}>Cliente: {order.customer.name}</Text>
                  <Text style={styles.addressText}>{order.deliveryAddress}</Text>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.customer.phone}`)}>
                  <Ionicons name="call" size={20} color={colors.success} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.itemsList}>
              {order.items.map((oi: any) => (
                <Text key={oi.id} style={styles.itemText}>
                  {oi.quantity}x {oi.product.name}
                </Text>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.totalText}>R$ {Number(order.total).toFixed(2)}</Text>
              {order.status === 'PICKED_UP' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleConfirmPickup(item.id)}
                >
                  <Ionicons name="bag-check" size={18} color={colors.white} />
                  <Text style={styles.actionButtonText}>Confirmar coleta</Text>
                </TouchableOpacity>
              )}
              {order.status === 'DELIVERING' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.success }]}
                  onPress={() => handleConfirmDelivery(item.id)}
                >
                  <Ionicons name="checkmark-done" size={18} color={colors.white} />
                  <Text style={styles.actionButtonText}>Confirmar entrega</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {!isActive && (
          <View style={styles.completedInfo}>
            <Text style={styles.completedText}>
              {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} - R$ {Number(order.total).toFixed(2)}
            </Text>
            <Text style={styles.completedDate}>
              {new Date(item.deliveredAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        )}
      </View>
    );
  }

  const isAvailableTab = tab === 'available';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Entregas</Text>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, isAvailableTab && styles.tabButtonActive]}
            onPress={() => setTab('available')}
          >
            <Text style={[styles.tabText, isAvailableTab && styles.tabTextActive]}>
              Disponiveis ({availableOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, !isAvailableTab && styles.tabButtonActive]}
            onPress={() => setTab('my')}
          >
            <Text style={[styles.tabText, !isAvailableTab && styles.tabTextActive]}>
              Minhas ({activeDeliveries.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isAvailableTab ? (
        <FlatList
          data={availableOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loadingAvailable} onRefresh={refetchAvailable} />}
          renderItem={renderAvailableOrder}
          ListEmptyComponent={
            !loadingAvailable ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="bicycle-outline" size={64} color={colors.grayLight} />
                <Text style={styles.emptyText}>Nenhuma entrega disponivel</Text>
                <Text style={styles.emptySubtext}>
                  Novos pedidos aparecerao aqui quando estiverem prontos
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={[...activeDeliveries, ...completedDeliveries]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loadingMy} onRefresh={refetchMy} />}
          renderItem={renderMyDelivery}
          ListEmptyComponent={
            !loadingMy ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color={colors.grayLight} />
                <Text style={styles.emptyText}>Nenhuma entrega ainda</Text>
                <Text style={styles.emptySubtext}>
                  Aceite entregas na aba "Disponiveis"
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 56, backgroundColor: colors.white },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  tabBar: { flexDirection: 'row', gap: 8 },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
  },
  tabButtonActive: { backgroundColor: colors.primary },
  tabText: { fontSize: fonts.small, fontWeight: '600', color: colors.textLight },
  tabTextActive: { color: colors.white },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  cardActive: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storeName: { fontSize: fonts.large, fontWeight: '600', color: colors.text },
  orderNumber: { fontSize: fonts.small, color: colors.textLight, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: fonts.tiny, fontWeight: '600' },
  addressSection: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  addressLabel: { fontSize: fonts.tiny, color: colors.textLight, fontWeight: '600' },
  addressText: { fontSize: fonts.small, color: colors.text, marginTop: 2 },
  addressDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.gray,
    height: 12,
    marginLeft: 7,
  },
  itemsList: { marginBottom: 12, gap: 4 },
  itemText: { fontSize: fonts.small, color: colors.textLight },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
  },
  feeLabel: { fontSize: fonts.tiny, color: colors.textLight },
  feeValue: { fontSize: fonts.large, fontWeight: 'bold', color: colors.success },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  acceptButtonText: { color: colors.white, fontWeight: 'bold', fontSize: fonts.regular },
  totalText: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionButtonText: { color: colors.white, fontWeight: 'bold', fontSize: fonts.small },
  completedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedText: { fontSize: fonts.small, color: colors.textLight },
  completedDate: { fontSize: fonts.small, color: colors.gray },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyText: { fontSize: fonts.large, color: colors.textLight, fontWeight: '600' },
  emptySubtext: { fontSize: fonts.regular, color: colors.gray, textAlign: 'center' },
});
