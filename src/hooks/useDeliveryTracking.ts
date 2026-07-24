import { useEffect, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { getSecureItem } from '../lib/secureStorage';
import { socketBaseUrl } from '../lib/apiHost';

const LOCATION_TASK_NAME = 'DELIVERY_BACKGROUND_LOCATION';

// KAN-224: a entrega ativa e persistida no storage para sobreviver ao relaunch
// do app pelo SO. Quando o sistema mata o app e reabre APENAS a task de
// background, o modulo JS recarrega zerado — sem persistir, activeDeliveryId
// ficava null e NENHUMA localizacao era enviada durante a entrega.
const ACTIVE_DELIVERY_KEY = 'activeDeliveryTracking';

// KAN-255: URL vem do util compartilhado (src/lib/apiHost.ts), que le
// EXPO_PUBLIC_API_HOST. Antes era um IP fixo (192.168.0.143) que ja nem existia
// nesta rede, entao o socket de rastreamento em dev nunca conectava.
const WS_URL = socketBaseUrl();

let socketInstance: Socket | null = null;
let activeDeliveryId: string | null = null;
let activeOrderId: string | null = null;
let authToken: string | null = null;

// Reidrata o estado a partir do storage quando o modulo foi reiniciado pelo SO
// (relaunch em background) — nesses casos as vars de modulo comecam nulas.
async function ensureHydrated(): Promise<void> {
  if (!activeDeliveryId || !activeOrderId) {
    try {
      const raw = await AsyncStorage.getItem(ACTIVE_DELIVERY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        activeDeliveryId = parsed?.deliveryId ?? null;
        activeOrderId = parsed?.orderId ?? null;
      }
    } catch {}
  }
  if (!authToken) {
    try {
      authToken = await getSecureItem('token');
    } catch {}
  }
}

function getSocket(): Socket {
  if (!socketInstance || !socketInstance.connected) {
    if (socketInstance) {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    }
    socketInstance = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      // KAN-224: autentica o socket de rastreamento. Sem token no handshake,
      // qualquer cliente podia emitir updateLocation para qualquer deliveryId.
      auth: { token: authToken },
    });
    socketInstance.on('connect', () => {
      // Re-entra na sala do pedido em toda (re)conexao — inclusive no relaunch
      // em background, onde startTracking nao chega a rodar.
      if (activeOrderId) {
        socketInstance?.emit('joinOrder', { orderId: activeOrderId });
      }
    });
    socketInstance.on('connect_error', () => {
      // Silently handle connection errors to prevent crash
    });
  }
  return socketInstance;
}

async function sendLocation(latitude: number, longitude: number): Promise<void> {
  await ensureHydrated();
  if (!activeDeliveryId || !activeOrderId) return;

  try {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('updateLocation', {
        deliveryId: activeDeliveryId,
        latitude,
        longitude,
      });
    }
  } catch {
    // Socket not available — skip this update silently
  }
}

// Background task handler - roda mesmo com o app minimizado OU relanched pelo SO
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) return;
  const location = data?.locations?.[0];
  if (location) {
    await sendLocation(location.coords.latitude, location.coords.longitude);
  }
});

interface ActiveDelivery {
  deliveryId: string;
  orderId: string;
}

export function useDeliveryTracking(activeDelivery: ActiveDelivery | null) {
  const { user, token } = useAuth();
  const trackingRef = useRef(false);
  const foregroundSubRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    if (trackingRef.current || !activeDelivery) return;

    // Check existing permission first (no dialog) to avoid permission-dialog loop
    let { status: fgStatus } = await Location.getForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      const req = await Location.requestForegroundPermissionsAsync();
      fgStatus = req.status;
    }
    if (fgStatus !== 'granted') return;

    activeDeliveryId = activeDelivery.deliveryId;
    activeOrderId = activeDelivery.orderId;
    authToken = token;
    // KAN-224: persiste para o relaunch em background conseguir reidratar.
    try {
      await AsyncStorage.setItem(
        ACTIVE_DELIVERY_KEY,
        JSON.stringify({ deliveryId: activeDelivery.deliveryId, orderId: activeDelivery.orderId }),
      );
    } catch {}

    // Join the order room via WebSocket
    const socket = getSocket();
    socket.emit('joinOrder', { orderId: activeDelivery.orderId });

    // Start foreground location updates
    foregroundSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 50, // atualiza a cada 50 metros
        timeInterval: 30000, // ou a cada 30 segundos
      },
      (location) => {
        try {
          sendLocation(location.coords.latitude, location.coords.longitude);
        } catch {
          // Prevent crash from unhandled error in location callback
        }
      },
    );

    // Try background location (only works on native, not Expo Go)
    if (Platform.OS !== 'web') {
      try {
        let { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
        if (bgStatus !== 'granted') {
          const bgReq = await Location.requestBackgroundPermissionsAsync();
          bgStatus = bgReq.status;
        }
        if (bgStatus === 'granted') {
          const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
          if (!isTaskRegistered) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.High,
              distanceInterval: 50,
              timeInterval: 30000,
              showsBackgroundLocationIndicator: true,
              foregroundService: {
                notificationTitle: 'bcmTech Shopping',
                notificationBody: 'Rastreando sua localização para a entrega',
                notificationColor: '#FF6B00',
              },
            });
          }
        }
      } catch {
        // Background location not available (e.g., Expo Go)
        // Foreground tracking still works
      }
    }

    trackingRef.current = true;
  }, [activeDelivery, token]);

  const stopTracking = useCallback(async () => {
    if (!trackingRef.current) return;

    // Stop foreground
    if (foregroundSubRef.current) {
      foregroundSubRef.current.remove();
      foregroundSubRef.current = null;
    }

    // Stop background
    if (Platform.OS !== 'web') {
      try {
        const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (isTaskRegistered) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
      } catch {}
    }

    // Disconnect socket
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }

    activeDeliveryId = null;
    activeOrderId = null;
    authToken = null;
    try {
      await AsyncStorage.removeItem(ACTIVE_DELIVERY_KEY);
    } catch {}
    trackingRef.current = false;
  }, []);

  useEffect(() => {
    if (activeDelivery && user?.isDeliverer) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [activeDelivery, user?.isDeliverer]);

  return { isTracking: trackingRef.current };
}
