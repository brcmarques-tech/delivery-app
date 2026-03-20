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
  AppState,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { GET_AVAILABLE_DELIVERIES, GET_MY_DELIVERIES, GET_ME } from '../../src/lib/graphql/queries';
import { ACCEPT_DELIVERY, CONFIRM_PICKUP, CONFIRM_DELIVERY } from '../../src/lib/graphql/mutations';
import { useDeliveryTracking } from '../../src/hooks/useDeliveryTracking';
import { useAlert } from '../../src/contexts/AlertContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { ORDER_UPDATED, DELIVERY_UPDATED } from '../../src/lib/graphql/subscriptions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../src/theme';

let MapView: any = View;
let Marker: any = View;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

type Tab = 'available' | 'my';

interface DeliveryOffer {
  orderId: string;
  orderNumber: string;
  storeAddress: string;
  storeLat?: number;
  storeLng?: number;
  deliveryAddress: string;
  deliveryFee: number;
  itemCount: number;
  timeoutSeconds: number;
}

interface AcceptedStore {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

export default function DeliveriesScreen() {
  const insets = useSafeAreaInsets();
  const { alert } = useAlert();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [tab, setTab] = useState<Tab>('available');
  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<DeliveryOffer | null>(null);
  const [acceptedStore, setAcceptedStore] = useState<AcceptedStore | null>(null);
  const [clientLocation, setClientLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [offerCountdown, setOfferCountdown] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const isOnlineRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const statusLabels: Record<string, { label: string; color: string }> = {
    READY: { label: 'Aguardando coleta', color: colors.warning },
    VENDOR_CONFIRMED_PICKUP: { label: 'Aguardando coleta', color: colors.warning },
    PICKED_UP: { label: 'Coletado', color: colors.warning },
    DELIVERING: { label: 'A caminho', color: colors.primary },
    DELIVERER_CONFIRMED_DELIVERY: { label: 'Aguardando cliente', color: colors.warning },
    COMPLETED: { label: 'Concluido', color: colors.success },
    DISPUTED: { label: 'Disputado', color: colors.danger },
    CANCELLED: { label: 'Cancelado', color: colors.danger },
  };

  const CONFIRMATION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

  function getReceiptStatus(order: any): { label: string; color: string; icon: string; detail?: string } {
    if (order.disputedAt) {
      return {
        label: 'Cliente negou',
        color: colors.danger,
        icon: 'close-circle',
        detail: order.disputeReason || undefined,
      };
    }
    if (order.customerConfirmedAt || order.status === 'COMPLETED') {
      return { label: 'Cliente confirmou', color: colors.success, icon: 'checkmark-circle' };
    }
    if (order.delivererConfirmedDeliveryAt) {
      const elapsed = Date.now() - new Date(order.delivererConfirmedDeliveryAt).getTime();
      const remaining = Math.max(0, CONFIRMATION_TIMEOUT_MS - elapsed);
      if (remaining <= 0) {
        return { label: 'Auto-confirmado', color: colors.success, icon: 'timer' };
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      return {
        label: `Aguardando (${mins}:${secs.toString().padStart(2, '0')})`,
        color: colors.warning,
        icon: 'time',
      };
    }
    return { label: 'Entregue', color: colors.success, icon: 'checkmark' };
  }

  // Check payment connection status
  const { data: meData } = useQuery(GET_ME, { fetchPolicy: 'cache-and-network' });
  const paymentConnected = meData?.meApp?.paymentConnected ?? user?.paymentConnected ?? false;

  // Connect socket and location tracking
  const connectSocket = useCallback(async () => {
    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = current.coords;

    const socket = io(WS_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[APP-SOCKET] Connected, socketId=${socket.id}, emitting delivererOnline userId=${user?.id}`);
      socket.emit('delivererOnline', { userId: user?.id, latitude, longitude });
      // Refresh data on reconnect
      refetchAvailable();
      refetchMy();
    });

    socket.on('disconnect', (reason) => {
      console.log(`[APP-SOCKET] Disconnected, reason=${reason}`);
    });

    // Listen for delivery offers
    socket.on('deliveryOffer', (offer: DeliveryOffer) => {
      console.log(`[APP-SOCKET] deliveryOffer received: orderId=${offer.orderId}, orderNumber=${offer.orderNumber}, fee=${offer.deliveryFee}, timeout=${offer.timeoutSeconds}s`);
      setCurrentOffer(offer);
      setOfferCountdown(offer.timeoutSeconds);
      refetchAvailable();
      try { Vibration.vibrate([0, 500, 200, 500]); } catch {}
    });

    // Listen for broadcast available deliveries
    socket.on('newAvailableDelivery', (data: any) => {
      console.log(`[APP-SOCKET] newAvailableDelivery:`, JSON.stringify(data));
      refetchAvailable();
      refetchMy();
    });

    // Start watching location (low power — just for "nearest deliverer" ranking)
    // High accuracy tracking is handled by useDeliveryTracking when a delivery is active
    locationSubRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 100, timeInterval: 60000 },
      (loc) => {
        console.log(`[APP-GPS] Location update: lat=${loc.coords.latitude.toFixed(5)}, lng=${loc.coords.longitude.toFixed(5)}`);
        setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        socket.emit('delivererLocationUpdate', {
          userId: user?.id,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      },
    );

    return true;
  }, [user]);

  // Go online/offline (only via button)
  const toggleOnline = useCallback(async () => {
    if (togglingOnline) return;
    if (!paymentConnected) {
      alert('Conta nao conectada', 'Conecte sua conta de pagamento para comecar a fazer entregas.');
      return;
    }

    setTogglingOnline(true);
    try {
      if (isOnline) {
        console.log(`[APP-ONLINE] Going OFFLINE, userId=${user?.id}`);
        // Go offline - only here we send delivererOffline
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
        isOnlineRef.current = false;
        AsyncStorage.setItem('deliverer_online', 'false');
        setCurrentOffer(null);
        return;
      }

      // Go online
      console.log(`[APP-ONLINE] Going ONLINE, userId=${user?.id}`);
      const connected = await connectSocket();
      if (!connected) {
        alert('Erro', 'Permissao de localizacao necessaria para receber entregas');
        return;
      }

      setIsOnline(true);
      isOnlineRef.current = true;
      AsyncStorage.setItem('deliverer_online', 'true');
    } finally {
      setTogglingOnline(false);
    }
  }, [isOnline, user, connectSocket, togglingOnline]);

  // Clear online status on logout
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
      setIsOnline(false);
      isOnlineRef.current = false;
      AsyncStorage.setItem('deliverer_online', 'false');
    }
  }, [user]);

  // Auto-reconnect: restore online status on mount
  useEffect(() => {
    if (!user || !paymentConnected) return;
    AsyncStorage.getItem('deliverer_online').then((val) => {
      if (val === 'true') {
        connectSocket().then((connected) => {
          if (connected) {
            setIsOnline(true);
            isOnlineRef.current = true;
          }
        });
      }
    });
  }, [user, paymentConnected]);

  // Auto-reconnect: when app comes back from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isOnlineRef.current
      ) {
        // App came back to foreground and deliverer was online - reconnect
        connectSocket().then((connected) => {
          if (connected) {
            setIsOnline(true);
          }
        });
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, [connectSocket]);

  // Offer countdown timer
  useEffect(() => {
    if (!currentOffer) return;
    const timer = setInterval(() => {
      setOfferCountdown((prev) => {
        if (prev <= 1) {
          setCurrentOffer(null);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentOffer]);

  async function handleAcceptOffer() {
    if (!currentOffer) return;
    console.log(`[APP-ACCEPT-OFFER] orderId=${currentOffer.orderId}, orderNumber=${currentOffer.orderNumber}`);
    if (!paymentConnected) {
      console.log(`[APP-ACCEPT-OFFER] BLOCKED: payment not connected`);
      alert('Conta nao conectada', 'Conecte sua conta de pagamento para aceitar entregas.');
      setCurrentOffer(null);
      return;
    }
    const offer = currentOffer;
    const { orderId } = offer;
    setActionLoading(orderId);
    try {
      // Accept via socket - the backend handles creating the delivery
      if (socketRef.current?.connected) {
        console.log(`[APP-ACCEPT-OFFER] Emitting acceptOffer via socket`);
        socketRef.current.emit('acceptOffer', { orderId, delivererId: user?.id });
      } else {
        // Fallback: if socket is not connected, use GraphQL mutation
        console.log(`[APP-ACCEPT-OFFER] Socket not connected, using mutation fallback`);
        await acceptDelivery({ variables: { orderId } });
      }
      console.log(`[APP-ACCEPT-OFFER] SUCCESS`);
      setCurrentOffer(null);
      await refetchMy();
      refetchAvailable();
      setTab('my');

      // Show store map modal from offer data
      if (offer.storeLat && offer.storeLng) {
        setAcceptedStore({
          name: offer.storeName || 'Loja',
          latitude: offer.storeLat,
          longitude: offer.storeLng,
          address: offer.storeAddress,
        });
      } else {
        alert('Sucesso', 'Entrega aceita! Va ate a loja para coletar.');
      }
    } catch (e: any) {
      console.error(`[APP-ACCEPT-OFFER] FAILED:`, e?.message);
      setCurrentOffer(null);
      const msg = e?.message || '';
      if (msg.includes('already') || msg.includes('assigned')) {
        alert('Oferta expirada', 'Essa entrega ja foi aceita por outro entregador.');
      } else {
        alert('Erro', 'Nao foi possivel aceitar a entrega.');
      }
    } finally {
      setActionLoading(null);
    }
  }

  function handleDeclineOffer() {
    if (!currentOffer || !socketRef.current) return;
    console.log(`[APP-DECLINE] orderId=${currentOffer.orderId}, orderNumber=${currentOffer.orderNumber}`);
    socketRef.current.emit('declineOffer', { orderId: currentOffer.orderId, delivererId: user?.id });
    setCurrentOffer(null);
  }

  // Cleanup on unmount - disconnect socket but do NOT send delivererOffline
  // (deliverer stays "online" until they explicitly press the button)
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, []);

  const {
    data: availableData,
    loading: loadingAvailable,
    refetch: refetchAvailable,
  } = useQuery(GET_AVAILABLE_DELIVERIES);

  const {
    data: myData,
    loading: loadingMy,
    refetch: refetchMy,
  } = useQuery(GET_MY_DELIVERIES);

  // Real-time updates
  useSubscription(ORDER_UPDATED, {
    onData: ({ data: subData }) => {
      const o = subData?.data?.orderUpdated;
      console.log(`[APP-SUB] orderUpdated: #${o?.orderNumber || '?'}, status=${o?.status || '?'}`);
      refetchAvailable();
    },
  });
  useSubscription(DELIVERY_UPDATED, {
    onData: ({ data: subData }) => {
      const d = subData?.data?.deliveryUpdated;
      console.log(`[APP-SUB] deliveryUpdated: deliveryId=${d?.id || '?'}`);
      refetchMy(); refetchAvailable();
    },
  });

  const [acceptDelivery] = useMutation(ACCEPT_DELIVERY);
  const [confirmPickup] = useMutation(CONFIRM_PICKUP);
  const [confirmDeliveryMut] = useMutation(CONFIRM_DELIVERY);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const availableOrders = availableData?.availableDeliveries || [];
  const myDeliveries = myData?.myDeliveries || [];
  const activeDeliveries = myDeliveries.filter((d: any) => !d.deliveredAt);
  const completedDeliveries = myDeliveries.filter((d: any) => d.deliveredAt);

  // Timer tick para atualizar countdown de confirmação do cliente
  const [, setTick] = useState(0);
  const hasWaitingConfirmation = completedDeliveries.some(
    (d: any) => d.order.delivererConfirmedDeliveryAt && !d.order.customerConfirmedAt && !d.order.disputedAt && d.order.status !== 'COMPLETED',
  );
  useEffect(() => {
    if (!hasWaitingConfirmation || tab !== 'my') return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [hasWaitingConfirmation, tab]);

  // Background location tracking for active delivery
  const activeDeliveryForTracking = useMemo(() => {
    const active = activeDeliveries[0];
    if (!active) return null;
    return { deliveryId: active.id, orderId: active.order.id };
  }, [activeDeliveries]);

  useDeliveryTracking(activeDeliveryForTracking);

  async function handleAccept(orderId: string, orderNumber: string) {
    if (actionLoading) return;
    console.log(`[APP-ACCEPT] orderId=${orderId}, orderNumber=${orderNumber}`);
    if (!paymentConnected) {
      console.log(`[APP-ACCEPT] BLOCKED: payment not connected`);
      alert('Conta nao conectada', 'Conecte sua conta de pagamento para aceitar entregas.');
      return;
    }
    alert('Aceitar entrega', `Aceitar pedido #${orderNumber}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aceitar',
        onPress: async () => {
          if (actionLoading) return;
          console.log(`[APP-ACCEPT] User confirmed, calling mutation`);
          setActionLoading(orderId);
          try {
            const { data: acceptData } = await acceptDelivery({ variables: { orderId } });
            console.log(`[APP-ACCEPT] Mutation SUCCESS: deliveryId=${acceptData?.acceptDelivery?.id}`);
            refetchAvailable();
            await refetchMy();
            setTab('my');
            // Show store map modal
            const store = acceptData?.acceptDelivery?.order?.store;
            if (store?.latitude && store?.longitude) {
              const addr = [store.street, store.number, store.neighborhood, store.city].filter(Boolean).join(', ');
              setAcceptedStore({
                name: store.name,
                latitude: Number(store.latitude),
                longitude: Number(store.longitude),
                address: addr,
              });
            } else {
              alert('Sucesso', 'Entrega aceita! Va ate a loja para coletar.');
            }
          } catch (e: any) {
            console.error(`[APP-ACCEPT] FAILED:`, e?.message);
            alert('Erro', 'Nao foi possivel aceitar a entrega.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  }

  async function handleConfirmPickup(deliveryId: string, order?: any) {
    if (actionLoading) return;
    console.log(`[APP-PICKUP] deliveryId=${deliveryId}, orderNumber=${order?.orderNumber || '?'}`);
    alert('Confirmar coleta', 'Voce ja retirou o pedido na loja?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, coletei',
        onPress: async () => {
          if (actionLoading) return;
          console.log(`[APP-PICKUP] User confirmed, calling mutation`);
          setActionLoading(deliveryId);
          try {
            await confirmPickup({ variables: { deliveryId } });
            console.log(`[APP-PICKUP] SUCCESS: deliveryId=${deliveryId}, status -> DELIVERING`);
            await refetchMy();
            // Show client map modal
            const lat = Number(order?.deliveryLatitude);
            const lng = Number(order?.deliveryLongitude);
            console.log(`[APP-PICKUP] Client location: lat=${lat}, lng=${lng}, addr=${order?.deliveryAddress}`);
            if (lat && lng) {
              setClientLocation({
                latitude: lat,
                longitude: lng,
                address: order?.deliveryAddress || 'Cliente',
              });
            }
          } catch (e: any) {
            console.error(`[APP-PICKUP] FAILED:`, e?.message);
            alert('Erro', 'Nao foi possivel confirmar a coleta.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  }

  async function handleConfirmDelivery(deliveryId: string) {
    if (actionLoading) return;
    console.log(`[APP-DELIVERY] deliveryId=${deliveryId}`);
    alert('Confirmar entrega', 'O pedido foi entregue ao cliente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, entreguei',
        onPress: async () => {
          if (actionLoading) return;
          console.log(`[APP-DELIVERY] User confirmed, calling mutation`);
          setActionLoading(deliveryId);
          try {
            await confirmDeliveryMut({ variables: { deliveryId } });
            console.log(`[APP-DELIVERY] SUCCESS: deliveryId=${deliveryId}, status -> DELIVERER_CONFIRMED_DELIVERY`);
            refetchMy();
            refetchAvailable();
          } catch (e: any) {
            console.error(`[APP-DELIVERY] FAILED:`, e?.message);
            alert('Erro', 'Nao foi possivel confirmar a entrega.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  }

  function renderAvailableOrder({ item }: { item: any }) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.storeInfo}>
            <Ionicons name="storefront" size={18} color={colors.primary} />
            <Text style={[styles.storeName, { color: colors.text }]}>{item.store.name}</Text>
          </View>
          <Text style={[styles.orderNumber, { color: colors.textLight }]}>#{item.orderNumber}</Text>
        </View>

        <View style={[styles.addressSection, { backgroundColor: colors.grayLight }]}>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.addressLabel, { color: colors.textLight }]}>Retirar em</Text>
              <Text style={[styles.addressText, { color: colors.text }]}>
                {item.store.street}, {item.store.number} - {item.store.neighborhood}
              </Text>
            </View>
          </View>
          <View style={[styles.addressDivider, { borderLeftColor: colors.gray }]} />
          <View style={styles.addressRow}>
            <Ionicons name="flag" size={16} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.addressLabel, { color: colors.textLight }]}>Entregar em</Text>
              <Text style={[styles.addressText, { color: colors.text }]}>{item.deliveryAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.itemsList}>
          {item.items.map((oi: any) => (
            <Text key={oi.id} style={[styles.itemText, { color: colors.textLight }]}>
              {oi.quantity}x {oi.product.name}
            </Text>
          ))}
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.grayLight }]}>
          <View>
            <Text style={[styles.feeLabel, { color: colors.textLight }]}>Taxa de entrega</Text>
            <Text style={[styles.feeValue, { color: colors.success }]}>R$ {Number(item.deliveryFee).toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: actionLoading ? colors.gray : colors.success }]}
            onPress={() => handleAccept(item.id, item.orderNumber)}
            disabled={!!actionLoading}
          >
            <Ionicons name={actionLoading === item.id ? 'hourglass' : 'checkmark-circle'} size={18} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>{actionLoading === item.id ? 'Aceitando...' : 'Aceitar'}</Text>
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
      <View style={[styles.card, { backgroundColor: colors.card }, isActive && [styles.cardActive, { borderLeftColor: colors.primary }]]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.storeName, { color: colors.text }]}>{order.store.name}</Text>
            <Text style={[styles.orderNumber, { color: colors.textLight }]}>#{order.orderNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {isActive && (
          <>
            <View style={[styles.addressSection, { backgroundColor: colors.grayLight }]}>
              <View style={styles.addressRow}>
                <Ionicons name="storefront" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressLabel, { color: colors.textLight }]}>Loja</Text>
                  <Text style={[styles.addressText, { color: colors.text }]}>
                    {order.store.street}, {order.store.number} - {order.store.neighborhood}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.store.phone}`)}>
                  <Ionicons name="call" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={[styles.addressDivider, { borderLeftColor: colors.gray }]} />
              <View style={styles.addressRow}>
                <Ionicons name="flag" size={16} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressLabel, { color: colors.textLight }]}>Cliente: {order.customer.name}</Text>
                  <Text style={[styles.addressText, { color: colors.text }]}>{order.deliveryAddress}</Text>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.customer.phone}`)}>
                  <Ionicons name="call" size={18} color={colors.success} />
                </TouchableOpacity>
              </View>
            </View>


            <View style={styles.itemsList}>
              {order.items.map((oi: any) => (
                <Text key={oi.id} style={[styles.itemText, { color: colors.textLight }]}>
                  {oi.quantity}x {oi.product.name}
                </Text>
              ))}
            </View>

            <View style={[styles.cardFooter, { borderTopColor: colors.grayLight }]}>
              <Text style={[styles.totalText, { color: colors.text }]}>R$ {Number(order.total).toFixed(2)}</Text>
              {(order.status === 'READY' || order.status === 'VENDOR_CONFIRMED_PICKUP') && (() => {
                const storeLat = Number(order.store.latitude);
                const storeLng = Number(order.store.longitude);
                const nearStore = currentLocation
                  ? haversineDistance(currentLocation.latitude, currentLocation.longitude, storeLat, storeLng) <= 200
                  : false;
                return nearStore ? (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: actionLoading ? colors.gray : colors.primary }]}
                    onPress={() => handleConfirmPickup(item.id, order)}
                    disabled={!!actionLoading}
                  >
                    <Ionicons name={actionLoading === item.id ? 'hourglass' : 'bag-check'} size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>{actionLoading === item.id ? 'Confirmando...' : 'Coletei'}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.actionButton, { backgroundColor: colors.gray }]}>
                    <Ionicons name="location" size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Aproxime-se da loja</Text>
                  </View>
                );
              })()}
              {(order.status === 'PICKED_UP' || order.status === 'DELIVERING') && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: actionLoading ? colors.gray : colors.success }]}
                  onPress={() => handleConfirmDelivery(item.id)}
                  disabled={!!actionLoading}
                >
                  <Ionicons name={actionLoading === item.id ? 'hourglass' : 'checkmark-done'} size={18} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>{actionLoading === item.id ? 'Confirmando...' : 'Confirmar entrega'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {!isActive && (() => {
          const receipt = getReceiptStatus(order);
          return (
            <View style={styles.completedSection}>
              <View style={styles.completedInfo}>
                <Text style={[styles.completedText, { color: colors.textLight }]}>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} - R$ {Number(order.total).toFixed(2)}
                </Text>
                <Text style={[styles.completedDate, { color: colors.gray }]}>
                  {new Date(item.deliveredAt).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <View style={[styles.receiptBadge, { backgroundColor: receipt.color + '15' }]}>
                <Ionicons name={receipt.icon as any} size={16} color={receipt.color} />
                <Text style={[styles.receiptText, { color: receipt.color }]}>{receipt.label}</Text>
              </View>
              {receipt.detail && (
                <Text style={[styles.receiptDetail, { color: colors.textLight }]}>
                  Motivo: {receipt.detail}
                </Text>
              )}
            </View>
          );
        })()}
      </View>
    );
  }

  const isAvailableTab = tab === 'available';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Delivery offer popup */}
      <Modal visible={!!currentOffer} transparent animationType="fade" statusBarTranslucent>
        <View style={[styles.offerOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.offerCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.offerTitle, { color: colors.text }]}>Nova entrega!</Text>
            <Text style={[styles.offerTimer, { color: colors.danger }]}>{offerCountdown}s</Text>
            <View style={[styles.offerInfo, { backgroundColor: colors.grayLight }]}>
              <View style={styles.offerRow}>
                <Ionicons name="storefront" size={16} color={colors.success} />
                <Text style={[styles.offerText, { color: colors.text }]}>{currentOffer?.storeAddress}</Text>
              </View>
              <View style={styles.offerRow}>
                <Ionicons name="flag" size={16} color={colors.danger} />
                <Text style={[styles.offerText, { color: colors.text }]}>{currentOffer?.deliveryAddress}</Text>
              </View>
              <View style={styles.offerRow}>
                <Ionicons name="cash" size={16} color={colors.primary} />
                <Text style={[styles.offerFee, { color: colors.success }]}>R$ {Number(currentOffer?.deliveryFee || 0).toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.offerButtons}>
              <TouchableOpacity style={[styles.offerDecline, { backgroundColor: colors.grayLight }]} onPress={handleDeclineOffer}>
                <Text style={[styles.offerDeclineText, { color: colors.textLight }]}>Recusar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.offerAccept, { backgroundColor: actionLoading ? colors.gray : colors.success }]} onPress={handleAcceptOffer} disabled={!!actionLoading}>
                <Ionicons name={actionLoading ? 'hourglass' : 'checkmark-circle'} size={18} color="#FFFFFF" />
                <Text style={styles.offerAcceptText}>{actionLoading ? 'Aceitando...' : 'Aceitar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Store map after accepting delivery */}
      <Modal visible={!!acceptedStore} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', maxHeight: '80%' }}>
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text }}>Va ate a loja!</Text>
              <Text style={{ fontSize: fonts.regular, color: colors.textLight, marginTop: 4 }}>{acceptedStore?.name}</Text>
              <Text style={{ fontSize: fonts.small, color: colors.textLight, marginTop: 2, textAlign: 'center' }}>{acceptedStore?.address}</Text>
            </View>
            {acceptedStore && Platform.OS !== 'web' && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  if (acceptedStore) openNavigation(acceptedStore.latitude, acceptedStore.longitude, acceptedStore.name);
                }}
              >
                <MapView
                  style={{ width: '100%', height: 250 }}
                  initialRegion={{
                    latitude: acceptedStore.latitude,
                    longitude: acceptedStore.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{ latitude: acceptedStore.latitude, longitude: acceptedStore.longitude }}
                    title={acceptedStore.name}
                  />
                </MapView>
              </TouchableOpacity>
            )}
            <View style={{ padding: 16, gap: 10 }}>
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => {
                  if (acceptedStore) openNavigation(acceptedStore.latitude, acceptedStore.longitude, acceptedStore.name);
                }}
              >
                <Ionicons name="navigate" size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: fonts.regular }}>Abrir no Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.grayLight }}
                onPress={() => setAcceptedStore(null)}
              >
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: fonts.regular }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Client map after confirming pickup */}
      <Modal visible={!!clientLocation} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', maxHeight: '80%' }}>
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text }}>Entregar ao cliente</Text>
              <Text style={{ fontSize: fonts.small, color: colors.textLight, marginTop: 2, textAlign: 'center' }}>{clientLocation?.address}</Text>
            </View>
            {clientLocation && Platform.OS !== 'web' && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  if (clientLocation) openNavigation(clientLocation.latitude, clientLocation.longitude, 'Cliente');
                }}
              >
                <MapView
                  style={{ width: '100%', height: 250 }}
                  initialRegion={{
                    latitude: clientLocation.latitude,
                    longitude: clientLocation.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{ latitude: clientLocation.latitude, longitude: clientLocation.longitude }}
                    title="Cliente"
                  />
                </MapView>
              </TouchableOpacity>
            )}
            <View style={{ padding: 16, gap: 10 }}>
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, padding: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => {
                  if (clientLocation) openNavigation(clientLocation.latitude, clientLocation.longitude, 'Cliente');
                }}
              >
                <Ionicons name="navigate" size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: fonts.regular }}>Abrir no Maps</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.grayLight }}
                onPress={() => setClientLocation(null)}
              >
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: fonts.regular }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Entregas</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {activeDeliveryForTracking && (
              <View style={[styles.trackingBadge, { backgroundColor: colors.success + '15' }]}>
                <View style={[styles.trackingDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.trackingText, { color: colors.success }]}>Rastreando</Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.onlineToggle,
                { backgroundColor: colors.grayLight },
                isOnline && { backgroundColor: colors.success + '20' },
                (!paymentConnected || togglingOnline) && { opacity: 0.5 },
              ]}
              onPress={toggleOnline}
              disabled={!paymentConnected || togglingOnline}
            >
              {togglingOnline ? (
                <ActivityIndicator size="small" color={isOnline ? colors.success : colors.gray} />
              ) : (
                <View style={[styles.onlineDot, { backgroundColor: colors.gray }, isOnline && { backgroundColor: colors.success }]} />
              )}
              <Text style={[styles.onlineText, { color: colors.gray }, isOnline && { color: colors.success }]}>
                {togglingOnline ? (isOnline ? 'Desconectando...' : 'Conectando...') : (isOnline ? 'Online' : 'Offline')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!paymentConnected && (
          <TouchableOpacity
            style={[styles.mpBanner, { backgroundColor: colors.warning + '12', borderColor: colors.warning + '40' }]}
            onPress={() => router.push('/earnings' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.mpBannerContent}>
              <View style={[styles.mpBannerIcon, { backgroundColor: colors.warning + '20' }]}>
                <Ionicons name="wallet-outline" size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mpBannerTitle, { color: colors.text }]}>Conecte sua conta para comecar</Text>
                <Text style={[styles.mpBannerSubtitle, { color: colors.textLight }]}>
                  Cadastre sua conta bancária para receber pagamentos das entregas
                </Text>
              </View>
            </View>
            <View style={styles.mpBannerButton}>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              <Text style={styles.mpBannerButtonText}>Cadastrar Conta</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: colors.grayLight }, isAvailableTab && { backgroundColor: colors.primary }]}
            onPress={() => setTab('available')}
          >
            <Text style={[styles.tabText, { color: colors.textLight }, isAvailableTab && { color: '#FFFFFF' }]}>
              Disponiveis ({availableOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: colors.grayLight }, !isAvailableTab && { backgroundColor: colors.primary }]}
            onPress={() => setTab('my')}
          >
            <Text style={[styles.tabText, { color: colors.textLight }, !isAvailableTab && { color: '#FFFFFF' }]}>
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
                {!isOnline ? (
                  <>
                    <View style={[styles.onlineGuideIcon, { backgroundColor: colors.primary + '15' }]}>
                      <Ionicons name="radio-outline" size={36} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyText, { color: colors.text }]}>Fique online para receber entregas</Text>
                    <Text style={[styles.emptySubtext, { color: colors.gray }]}>
                      Toque no botao "Offline" no canto superior direito para ficar online e comecar a receber ofertas de entrega.
                    </Text>
                    <View style={[styles.onlineGuideSteps, { backgroundColor: colors.card }]}>
                      <View style={styles.onlineGuideStep}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                          <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.textLight }]}>
                          {!paymentConnected ? 'Cadastre sua conta bancaria em "Cadastrar Conta"' : 'Toque em "Offline" para ficar online'}
                        </Text>
                      </View>
                      <View style={styles.onlineGuideStep}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                          <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.textLight }]}>
                          {!paymentConnected ? 'Fique online tocando em "Offline"' : 'Aguarde ofertas de entrega chegarem'}
                        </Text>
                      </View>
                      <View style={styles.onlineGuideStep}>
                        <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                          <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={[styles.stepText, { color: colors.textLight }]}>Aceite entregas e comece a ganhar!</Text>
                      </View>
                    </View>
                    {paymentConnected && (
                      <TouchableOpacity
                        style={[styles.goOnlineButton, { backgroundColor: colors.success }, togglingOnline && { opacity: 0.5 }]}
                        onPress={toggleOnline}
                        disabled={togglingOnline}
                      >
                        {togglingOnline ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Ionicons name="power" size={18} color="#FFFFFF" />
                        )}
                        <Text style={styles.goOnlineButtonText}>{togglingOnline ? 'Conectando...' : 'Ficar Online'}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    <Ionicons name="bicycle-outline" size={64} color={colors.grayLight} />
                    <Text style={[styles.emptyText, { color: colors.textLight }]}>Nenhuma entrega disponivel</Text>
                    <Text style={[styles.emptySubtext, { color: colors.gray }]}>
                      Voce esta online! Novos pedidos aparecerao aqui quando estiverem prontos.
                    </Text>
                  </>
                )}
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
                <Text style={[styles.emptyText, { color: colors.textLight }]}>Nenhuma entrega ainda</Text>
                <Text style={[styles.emptySubtext, { color: colors.gray }]}>
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
  container: { flex: 1 },
  header: { padding: 12, paddingTop: 56 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold' },
  trackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trackingText: {
    fontSize: fonts.tiny,
    fontWeight: '600',
  },
  mpBanner: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  mpBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  mpBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mpBannerTitle: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
  },
  mpBannerSubtitle: {
    fontSize: fonts.small,
    marginTop: 4,
    lineHeight: 18,
  },
  mpBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#65A300',
    borderRadius: 10,
    paddingVertical: 12,
  },
  mpBannerButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: fonts.regular,
  },
  tabBar: { flexDirection: 'row', gap: 6 },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: { fontSize: fonts.small, fontWeight: '600' },
  list: { padding: 12, gap: 6 },
  card: { borderRadius: 10, padding: 12 },
  cardActive: { borderLeftWidth: 4 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storeName: { fontSize: fonts.large, fontWeight: '600' },
  orderNumber: { fontSize: fonts.small, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: fonts.tiny, fontWeight: '600' },
  addressSection: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  addressLabel: { fontSize: fonts.tiny, fontWeight: '600' },
  addressText: { fontSize: fonts.small, marginTop: 2 },
  addressDivider: {
    borderLeftWidth: 1,
    height: 12,
    marginLeft: 7,
  },
  itemsList: { marginBottom: 12, gap: 4 },
  itemText: { fontSize: fonts.small },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  feeLabel: { fontSize: fonts.tiny },
  feeValue: { fontSize: fonts.large, fontWeight: 'bold' },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  acceptButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: fonts.regular },
  totalText: { fontSize: fonts.large, fontWeight: 'bold' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: fonts.small },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4285F4',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 12,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: fonts.regular,
  },
  completedSection: {
    gap: 6,
  },
  completedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedText: { fontSize: fonts.small },
  completedDate: { fontSize: fonts.small },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  receiptText: {
    fontSize: fonts.tiny,
    fontWeight: '600',
  },
  receiptDetail: {
    fontSize: fonts.tiny,
    fontStyle: 'italic',
  },
  emptyContainer: { alignItems: 'center', marginTop: 48, gap: 6, paddingHorizontal: 32 },
  emptyText: { fontSize: fonts.large, fontWeight: '600' },
  emptySubtext: { fontSize: fonts.regular, textAlign: 'center', lineHeight: 22 },
  onlineGuideIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  onlineGuideSteps: {
    borderRadius: 10,
    padding: 12,
    gap: 6,
    width: '100%',
    marginTop: 8,
  },
  onlineGuideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: fonts.small,
    lineHeight: 20,
  },
  goOnlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 8,
    width: '100%',
  },
  goOnlineButtonText: {
    color: '#FFFFFF',
    fontSize: fonts.regular,
    fontWeight: 'bold',
  },
  // Online toggle
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineText: {
    fontSize: fonts.small,
    fontWeight: '600',
  },
  // Offer popup
  offerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 12,
  },
  offerCard: {
    borderRadius: 20,
    padding: 12,
    width: '100%',
    maxWidth: 400,
  },
  offerTitle: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  offerTimer: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  offerInfo: {
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginVertical: 12,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offerText: {
    fontSize: fonts.small,
    flex: 1,
  },
  offerFee: {
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  offerButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  offerDecline: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  offerDeclineText: {
    fontSize: fonts.regular,
    fontWeight: '600',
  },
  offerAccept: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  offerAcceptText: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
