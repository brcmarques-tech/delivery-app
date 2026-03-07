import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useQuery } from '@apollo/client';
import { GET_MY_ORDERS, GET_ME } from '../lib/graphql/queries';
import { useAuth } from '../contexts/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  READY: 'Pronto para entrega',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

async function requestPermissions() {
  if (Platform.OS === 'web') return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
}

export function useOrderNotifications() {
  const { user, updateUser } = useAuth();
  const prevStatusesRef = useRef<Record<string, string>>({});
  const prevPendingRef = useRef<string | null | undefined>(undefined);

  const { data: ordersData } = useQuery(GET_MY_ORDERS, {
    pollInterval: 30000,
    skip: !user,
  });

  const { data: meData } = useQuery(GET_ME, {
    pollInterval: 30000,
    skip: !user || !user.pendingRole,
  });

  useEffect(() => {
    requestPermissions();
  }, []);

  // Monitor order status changes
  useEffect(() => {
    if (!ordersData?.myOrders) return;

    const orders: Order[] = ordersData.myOrders;
    const prevStatuses = prevStatusesRef.current;
    const isFirstLoad = Object.keys(prevStatuses).length === 0;

    orders.forEach((order) => {
      if (!isFirstLoad && prevStatuses[order.id] && prevStatuses[order.id] !== order.status) {
        const statusLabel = statusLabels[order.status] || order.status;
        sendLocalNotification(
          `Pedido #${order.orderNumber}`,
          `Status atualizado: ${statusLabel}`,
        );
      }
      prevStatuses[order.id] = order.status;
    });

    prevStatusesRef.current = prevStatuses;
  }, [ordersData]);

  // Monitor deliverer approval status
  useEffect(() => {
    if (!meData?.me) return;

    const me = meData.me;
    const prevPending = prevPendingRef.current;

    if (prevPending === undefined) {
      prevPendingRef.current = me.pendingRole;
      return;
    }

    // Was pending, now approved (pendingRole cleared, isDeliverer true)
    if (prevPending === 'DELIVERER' && !me.pendingRole && me.isDeliverer) {
      sendLocalNotification(
        'Cadastro aprovado!',
        'Seu cadastro como entregador foi aprovado! A aba "Entregas" ja esta disponivel.',
      );
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

    // Was pending, now rejected
    if (prevPending === 'DELIVERER' && !me.pendingRole && me.rejectedAt) {
      sendLocalNotification(
        'Cadastro rejeitado',
        me.rejectionReason
          ? `Seu cadastro como entregador foi rejeitado. Motivo: ${me.rejectionReason}`
          : 'Seu cadastro como entregador foi rejeitado.',
      );
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

    prevPendingRef.current = me.pendingRole;
  }, [meData]);
}
