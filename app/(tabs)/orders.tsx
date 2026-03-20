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
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as staticColors, fonts } from '../../src/theme';

export default function OrdersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useQuery(GET_MY_ORDERS, { pollInterval: 15000 });
  const orders = data?.myOrders || [];

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
    // H4: Missing statuses added
    COMPLETED: { label: 'Entregue', color: colors.success },
    REJECTED: { label: 'Rejeitado', color: colors.danger },
    DISPUTED: { label: 'Em disputa', color: colors.warning },
    VENDOR_CONFIRMED_PICKUP: { label: 'Retirado', color: colors.primary },
    DELIVERER_CONFIRMED_DELIVERY: { label: 'Entrega confirmada', color: colors.success },
    EXPIRED: { label: 'Expirado', color: colors.gray },
  };

  // Real-time order updates
  useSubscription(ORDER_UPDATED, {
    onData: () => { refetch(); },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.white, paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Meus pedidos</Text>
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
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={colors.grayLight} />
              <Text style={[styles.emptyText, { color: colors.textLight }]}>Nenhum pedido ainda</Text>
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
  container: { flex: 1, backgroundColor: staticColors.background },
  header: { padding: 12, paddingTop: 56, backgroundColor: staticColors.white },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: staticColors.text },
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
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 6 },
  emptyText: { fontSize: fonts.regular, color: staticColors.textLight },
  emptyButton: { backgroundColor: staticColors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  emptyButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: fonts.regular },
});
