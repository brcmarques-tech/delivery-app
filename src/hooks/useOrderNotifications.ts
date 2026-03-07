import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_MY_ORDERS, GET_ME } from '../lib/graphql/queries';
import { useAuth } from '../contexts/AuthContext';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  READY: 'Pronto para entrega',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

function notify(title: string, body: string) {
  if (Platform.OS === 'web') return;
  Alert.alert(title, body);
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
}

export function useOrderNotifications() {
  const { user, updateUser } = useAuth();
  const prevStatusesRef = useRef<Record<string, string>>({});
  const initializedRef = useRef(false);

  const { data: ordersData } = useQuery(GET_MY_ORDERS, {
    pollInterval: 30000,
    skip: !user,
  });

  const { data: meData } = useQuery(GET_ME, {
    pollInterval: 30000,
    skip: !user,
  });

  // Monitor order status changes
  useEffect(() => {
    if (!ordersData?.myOrders) return;

    const orders: Order[] = ordersData.myOrders;
    const prevStatuses = prevStatusesRef.current;
    const isFirstLoad = Object.keys(prevStatuses).length === 0;

    orders.forEach((order) => {
      if (!isFirstLoad && prevStatuses[order.id] && prevStatuses[order.id] !== order.status) {
        const statusLabel = statusLabels[order.status] || order.status;
        notify(`Pedido #${order.orderNumber}`, `Status atualizado: ${statusLabel}`);
      }
      prevStatuses[order.id] = order.status;
    });

    prevStatusesRef.current = prevStatuses;
  }, [ordersData]);

  // Sync user data from server (role changes, approval, rejection, etc)
  useEffect(() => {
    if (!meData?.me || !user) return;

    const me = meData.me;

    // Skip first load to avoid false notifications
    if (!initializedRef.current) {
      initializedRef.current = true;
      // Still sync data silently on first load
      if (
        me.role !== user.role ||
        me.isDeliverer !== user.isDeliverer ||
        me.pendingRole !== user.pendingRole
      ) {
        updateUser({
          id: me.id,
          name: me.name,
          email: me.email,
          role: me.role,
          isDeliverer: me.isDeliverer,
          pendingRole: me.pendingRole,
          rejectedAt: me.rejectedAt,
          rejectionReason: me.rejectionReason,
        });
      }
      return;
    }

    // Detect role change
    const roleChanged = me.role !== user.role;
    const delivererChanged = me.isDeliverer !== user.isDeliverer;
    const pendingChanged = me.pendingRole !== user.pendingRole;
    const rejectionChanged = me.rejectedAt !== user.rejectedAt;

    if (!roleChanged && !delivererChanged && !pendingChanged && !rejectionChanged) return;

    // Approved as deliverer
    if (user.pendingRole === 'DELIVERER' && !me.pendingRole && me.isDeliverer) {
      notify(
        'Cadastro aprovado!',
        'Seu cadastro como entregador foi aprovado! A aba "Entregas" já está disponível.',
      );
    }
    // Rejected
    else if (user.pendingRole === 'DELIVERER' && !me.pendingRole && me.rejectedAt) {
      notify(
        'Cadastro rejeitado',
        me.rejectionReason
          ? `Seu cadastro como entregador foi rejeitado. Motivo: ${me.rejectionReason}`
          : 'Seu cadastro como entregador foi rejeitado.',
      );
    }
    // Role changed by admin (e.g. deliverer -> customer)
    else if (roleChanged) {
      const roleLabels: Record<string, string> = {
        CUSTOMER: 'Cliente',
        DELIVERER: 'Entregador',
        VENDOR: 'Vendedor',
      };
      notify(
        'Cargo atualizado',
        `Seu cargo foi alterado para: ${roleLabels[me.role] || me.role}`,
      );
    }

    updateUser({
      id: me.id,
      name: me.name,
      email: me.email,
      role: me.role,
      isDeliverer: me.isDeliverer,
      pendingRole: me.pendingRole,
      rejectedAt: me.rejectedAt,
      rejectionReason: me.rejectionReason,
    });
  }, [meData]);
}
