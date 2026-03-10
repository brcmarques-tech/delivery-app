import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useQuery, useSubscription } from '@apollo/client';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GET_MY_ORDERS } from '../../src/lib/graphql/queries';
import { ORDER_UPDATED } from '../../src/lib/graphql/subscriptions';
import { colors, fonts } from '../../src/theme';

const statusLabels: Record<string, { label: string; color: string }> = {
  AWAITING_PAYMENT: { label: 'Aguardando pagamento', color: colors.warning },
  PENDING: { label: 'Pendente', color: colors.warning },
  ACCEPTED: { label: 'Aceito', color: colors.primary },
  PREPARING: { label: 'Preparando', color: colors.primary },
  READY: { label: 'Pronto', color: colors.success },
  PICKED_UP: { label: 'Coletado', color: colors.success },
  DELIVERING: { label: 'A caminho', color: colors.success },
  DELIVERED: { label: 'Entregue', color: colors.grayDark },
  CANCELLED: { label: 'Cancelado', color: colors.danger },
};

export default function OrdersScreen() {
  const { data, loading, refetch } = useQuery(GET_MY_ORDERS, { pollInterval: 15000 });
  const orders = data?.myOrders || [];

  // Real-time order updates
  useSubscription(ORDER_UPDATED, {
    onData: () => { refetch(); },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus pedidos</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        renderItem={({ item }) => {
          const status = statusLabels[item.status] || { label: item.status, color: colors.gray };
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/order/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.storeName}>{item.store.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              <View style={styles.itemsList}>
                {item.items.slice(0, 3).map((oi: any) => (
                  <Text key={oi.id} style={styles.itemText}>
                    {oi.quantity}x {oi.product.name}
                  </Text>
                ))}
                {item.items.length > 3 && (
                  <Text style={styles.moreItems}>+{item.items.length - 3} itens</Text>
                )}
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.total}>R$ {Number(item.total).toFixed(2)}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={colors.grayLight} />
              <Text style={styles.emptyText}>Nenhum pedido ainda</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/home')}
              >
                <Text style={styles.emptyButtonText}>Fazer primeiro pedido</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 56, backgroundColor: colors.white },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontSize: fonts.large, fontWeight: '600', color: colors.text },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: fonts.tiny, fontWeight: '600' },
  orderNumber: { fontSize: fonts.small, color: colors.textLight, marginTop: 4 },
  itemsList: { marginTop: 12, gap: 4 },
  itemText: { fontSize: fonts.small, color: colors.text },
  moreItems: { fontSize: fonts.small, color: colors.textLight },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.grayLight },
  total: { fontSize: fonts.large, fontWeight: 'bold', color: colors.text },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyText: { fontSize: fonts.regular, color: colors.textLight },
  emptyButton: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyButtonText: { color: colors.white, fontWeight: 'bold', fontSize: fonts.regular },
});
