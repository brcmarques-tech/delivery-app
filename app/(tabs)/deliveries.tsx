import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Linking,
  Platform,
  Vibration,
} from 'react-native';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { GET_AVAILABLE_DELIVERIES, GET_MY_DELIVERIES, GET_ME } from '../../src/lib/graphql/queries';
import { ACCEPT_DELIVERY, CONFIRM_PICKUP, CONFIRM_DELIVERY } from '../../src/lib/graphql/mutations';
import { useDeliveryTracking } from '../../src/hooks/useDeliveryTracking';
import { useAlert } from '../../src/contexts/AlertContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { ORDER_UPDATED, DELIVERY_UPDATED } from '../../src/lib/graphql/subscriptions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../src/theme';

async function openNavigation(lat: number, lng: number, label: string) {
  const googleMapsUrl = Platform.select({
    ios: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
    default: `google.navigation:q=${lat},${lng}`,
  });
  const wazeUrl = `waze://?ll=${lat},${lng}&navigate=yes`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  const canOpenWaze = await Linking.canOpenURL(wazeUrl).catch(() => false);
  const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl).catch(() => false);

  if (canOpenGoogle && canOpenWaze) {
    // Ambos disponíveis — abre Google Maps por padrão (mais comum)
    // O usuário pode trocar no próprio celular
    Linking.openURL(googleMapsUrl);
  } else if (canOpenGoogle) {
    Linking.openURL(googleMapsUrl);
  } else if (canOpenWaze) {
    Linking.openURL(wazeUrl);
  } else {
    Linking.openURL(webUrl);
  }
}

const DEV_HOST = Platform.OS === 'web' ? 'localhost' : '192.168.0.143';
const WS_URL = __DEV__ ? `http://${DEV_HOST}:3000` : 'https://delivery-api-fdc4.onrender.com';

const statusLabels: Record<string, { label: string; color: string }> = {
  PICKED_UP: { label: 'Coletado', color: colors.warning },
  DELIVERING: { label: 'A caminho', color: colors.primary },
  DELIVERED: { label: 'Entregue', color: colors.success },
};

type Tab = 'available' | 'my';

interface DeliveryOffer {
  orderId: string;
  orderNumber: string;
  storeAddress: string;
  deliveryAddress: string;
  deliveryFee: number;
  itemCount: number;
  timeoutSeconds: number;
}

export default function DeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const { alert } = useAlert();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('available');
  const [isOnline, setIsOnline] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<DeliveryOffer | null>(null);
  const [offerCountdown, setOfferCountdown] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // Check payment connection status
  const { data: meData } = useQuery(GET_ME, { fetchPolicy: 'cache-and-network' });
  const paymentConnected = meData?.meApp?.paymentConnected ?? user?.paymentConnected ?? false;

  // Go online/offline
  const toggleOnline = useCallback(async () => {
    if (!paymentConnected) {
      alert('Conta nao conectada', 'Conecte sua conta de pagamento para comecar a fazer entregas.');
      return;
    }

    if (isOnline) {
      // Go offline
      if (socketRef.current) {
        socketRef.current.emit('delivererOffline', { userId: user?.id });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
      setIsOnline(false);
      setCurrentOffer(null);
      return;
    }

    // Go online
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Erro', 'Permissao de localizacao necessaria para receber entregas');
      return;
    }

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const { latitude, longitude } = current.coords;

    const socket = io(WS_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('delivererOnline', { userId: user?.id, latitude, longitude });
    });

    // Listen for delivery offers
    socket.on('deliveryOffer', (offer: DeliveryOffer) => {
      setCurrentOffer(offer);
      setOfferCountdown(offer.timeoutSeconds);
      try { Vibration.vibrate([0, 500, 200, 500]); } catch {}
    });

    // Listen for broadcast available deliveries
    socket.on('newAvailableDelivery', () => {
      refetchAvailable();
    });

    // Start watching location
    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 50, timeInterval: 15000 },
      (loc) => {
        socket.emit('delivererLocationUpdate', {
          userId: user?.id,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      },
    );

    setIsOnline(true);
  }, [isOnline, user]);

  // Offer countdown timer
  useEffect(() => {
    if (!currentOffer || offerCountdown <= 0) return;
    const timer = setInterval(() => {
      setOfferCountdown((prev) => {
        if (prev <= 1) {
          setCurrentOffer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentOffer, offerCountdown]);

  function handleAcceptOffer() {
    if (!currentOffer || !socketRef.current) return;
    if (!paymentConnected) {
      alert('Conta nao conectada', 'Conecte sua conta de pagamento para aceitar entregas.');
      setCurrentOffer(null);
      return;
    }
    socketRef.current.emit('acceptOffer', { orderId: currentOffer.orderId, delivererId: user?.id });
    // Now accept via GraphQL too
    handleAccept(currentOffer.orderId, currentOffer.orderNumber);
    setCurrentOffer(null);
  }

  function handleDeclineOffer() {
    if (!currentOffer || !socketRef.current) return;
    socketRef.current.emit('declineOffer', { orderId: currentOffer.orderId, delivererId: user?.id });
    setCurrentOffer(null);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('delivererOffline', { userId: user?.id });
        socketRef.current.disconnect();
      }
      if (locationSubRef.current) locationSubRef.current.remove();
    };
  }, []);

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

  // Real-time updates
  useSubscription(ORDER_UPDATED, {
    onData: () => { refetchAvailable(); },
  });
  useSubscription(DELIVERY_UPDATED, {
    onData: () => { refetchMy(); refetchAvailable(); },
  });

  const [acceptDelivery] = useMutation(ACCEPT_DELIVERY);
  const [confirmPickup] = useMutation(CONFIRM_PICKUP);
  const [confirmDeliveryMut] = useMutation(CONFIRM_DELIVERY);

  const availableOrders = availableData?.availableDeliveries || [];
  const myDeliveries = myData?.myDeliveries || [];
  const activeDeliveries = myDeliveries.filter((d: any) => !d.deliveredAt);
  const completedDeliveries = myDeliveries.filter((d: any) => d.deliveredAt);

  // Background location tracking for active delivery
  const activeDeliveryForTracking = useMemo(() => {
    const active = activeDeliveries[0];
    if (!active) return null;
    return { deliveryId: active.id, orderId: active.order.id };
  }, [activeDeliveries]);

  useDeliveryTracking(activeDeliveryForTracking);

  async function handleAccept(orderId: string, orderNumber: string) {
    if (!paymentConnected) {
      alert('Conta nao conectada', 'Conecte sua conta de pagamento para aceitar entregas.');
      return;
    }
    alert('Aceitar entrega', `Aceitar pedido #${orderNumber}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aceitar',
        onPress: async () => {
          try {
            await acceptDelivery({ variables: { orderId } });
            refetchAvailable();
            refetchMy();
            setTab('my');
            alert('Sucesso', 'Entrega aceita! Va ate a loja para coletar.');
          } catch {
            alert('Erro', 'Nao foi possivel aceitar a entrega.');
          }
        },
      },
    ]);
  }

  async function handleConfirmPickup(deliveryId: string) {
    alert('Confirmar coleta', 'Voce ja retirou o pedido na loja?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, coletei',
        onPress: async () => {
          try {
            await confirmPickup({ variables: { deliveryId } });
            refetchMy();
          } catch {
            alert('Erro', 'Nao foi possivel confirmar a coleta.');
          }
        },
      },
    ]);
  }

  async function handleConfirmDelivery(deliveryId: string) {
    alert('Confirmar entrega', 'O pedido foi entregue ao cliente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, entreguei',
        onPress: async () => {
          try {
            await confirmDeliveryMut({ variables: { deliveryId } });
            refetchMy();
            refetchAvailable();
          } catch {
            alert('Erro', 'Nao foi possivel confirmar a entrega.');
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

            {(order.status === 'PICKED_UP' || order.status === 'DELIVERING') && (
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => {
                  if (order.status === 'PICKED_UP') {
                    openNavigation(
                      Number(order.store.latitude),
                      Number(order.store.longitude),
                      order.store.name,
                    );
                  } else {
                    openNavigation(
                      Number(order.deliveryLatitude),
                      Number(order.deliveryLongitude),
                      'Cliente',
                    );
                  }
                }}
              >
                <Ionicons name="navigate" size={18} color={colors.white} />
                <Text style={styles.navigateButtonText}>
                  {order.status === 'PICKED_UP' ? 'Navegar ate a loja' : 'Navegar ate o cliente'}
                </Text>
              </TouchableOpacity>
            )}

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
      {/* Delivery offer popup */}
      {currentOffer && (
        <View style={styles.offerOverlay}>
          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>Nova entrega!</Text>
            <Text style={styles.offerTimer}>{offerCountdown}s</Text>
            <View style={styles.offerInfo}>
              <View style={styles.offerRow}>
                <Ionicons name="storefront" size={16} color={colors.success} />
                <Text style={styles.offerText}>{currentOffer.storeAddress}</Text>
              </View>
              <View style={styles.offerRow}>
                <Ionicons name="flag" size={16} color={colors.danger} />
                <Text style={styles.offerText}>{currentOffer.deliveryAddress}</Text>
              </View>
              <View style={styles.offerRow}>
                <Ionicons name="cash" size={16} color={colors.primary} />
                <Text style={styles.offerFee}>R$ {Number(currentOffer.deliveryFee).toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.offerButtons}>
              <TouchableOpacity style={styles.offerDecline} onPress={handleDeclineOffer}>
                <Text style={styles.offerDeclineText}>Recusar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.offerAccept} onPress={handleAcceptOffer}>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.offerAcceptText}>Aceitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Entregas</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {activeDeliveryForTracking && (
              <View style={styles.trackingBadge}>
                <View style={styles.trackingDot} />
                <Text style={styles.trackingText}>Rastreando</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.onlineToggle, isOnline && styles.onlineToggleActive, !paymentConnected && { opacity: 0.5 }]}
              onPress={toggleOnline}
              disabled={!paymentConnected}
            >
              <View style={[styles.onlineDot, isOnline && styles.onlineDotActive]} />
              <Text style={[styles.onlineText, isOnline && styles.onlineTextActive]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!paymentConnected && (
          <View style={styles.mpBanner}>
            <View style={styles.mpBannerContent}>
              <View style={styles.mpBannerIcon}>
                <Ionicons name="wallet-outline" size={28} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mpBannerTitle}>Conecte sua conta para comecar</Text>
                <Text style={styles.mpBannerSubtitle}>
                  Para receber entregas e pagamentos, cadastre-se como recebedor ou entre em contato com o suporte
                </Text>
              </View>
            </View>
            <View style={styles.mpBannerButton}>
              <Ionicons name="information-circle" size={18} color={colors.white} />
              <Text style={styles.mpBannerButtonText}>Conectar Pagamento</Text>
            </View>
          </View>
        )}

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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  trackingText: {
    fontSize: fonts.tiny,
    color: colors.success,
    fontWeight: '600',
  },
  mpBanner: {
    backgroundColor: colors.warning + '12',
    borderWidth: 1.5,
    borderColor: colors.warning + '40',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  mpBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mpBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mpBannerTitle: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: colors.text,
  },
  mpBannerSubtitle: {
    fontSize: fonts.small,
    color: colors.textLight,
    marginTop: 4,
    lineHeight: 18,
  },
  mpBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#65A300',
    borderRadius: 12,
    paddingVertical: 12,
  },
  mpBannerButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fonts.regular,
  },
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
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  navigateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fonts.regular,
  },
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
  // Online toggle
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.grayLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  onlineToggleActive: {
    backgroundColor: colors.success + '20',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gray,
  },
  onlineDotActive: {
    backgroundColor: colors.success,
  },
  onlineText: {
    fontSize: fonts.small,
    fontWeight: '600',
    color: colors.gray,
  },
  onlineTextActive: {
    color: colors.success,
  },
  // Offer popup
  offerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 24,
  },
  offerCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  offerTitle: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  offerTimer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.danger,
    textAlign: 'center',
    marginVertical: 8,
  },
  offerInfo: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginVertical: 16,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerText: {
    fontSize: fonts.small,
    color: colors.text,
    flex: 1,
  },
  offerFee: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: colors.success,
  },
  offerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  offerDecline: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
  },
  offerDeclineText: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: colors.textLight,
  },
  offerAccept: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  offerAcceptText: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: colors.white,
  },
});
