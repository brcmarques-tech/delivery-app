import { useEffect, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const LOCATION_TASK_NAME = 'DELIVERY_BACKGROUND_LOCATION';
const DEV_HOST = Platform.OS === 'web' ? 'localhost' : '192.168.0.143';
const PROD_WS = 'https://api.bcmtech.com.br';
const WS_URL = __DEV__ ? `http://${DEV_HOST}:3000` : PROD_WS;

let socketInstance: Socket | null = null;
let activeDeliveryId: string | null = null;
let activeOrderId: string | null = null;

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
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socketInstance;
}

function sendLocation(latitude: number, longitude: number) {
  if (!activeDeliveryId || !activeOrderId) return;

  const socket = getSocket();
  socket.emit('updateLocation', {
    deliveryId: activeDeliveryId,
    latitude,
    longitude,
  });
}

// Background task handler - runs even when app is minimized
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }: any) => {
  if (error) return;
  if (data) {
    const { locations } = data;
    const location = locations?.[0];
    if (location) {
      sendLocation(location.coords.latitude, location.coords.longitude);
    }
  }
});

interface ActiveDelivery {
  deliveryId: string;
  orderId: string;
}

export function useDeliveryTracking(activeDelivery: ActiveDelivery | null) {
  const { user } = useAuth();
  const trackingRef = useRef(false);
  const foregroundSubRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    if (trackingRef.current || !activeDelivery) return;

    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') return;

    activeDeliveryId = activeDelivery.deliveryId;
    activeOrderId = activeDelivery.orderId;

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
        sendLocation(location.coords.latitude, location.coords.longitude);
      },
    );

    // Try background location (only works on native, not Expo Go)
    if (Platform.OS !== 'web') {
      try {
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus === 'granted') {
          const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
          if (!isTaskRegistered) {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.High,
              distanceInterval: 50,
              timeInterval: 30000,
              showsBackgroundLocationIndicator: true,
              foregroundService: {
                notificationTitle: 'bcmTech Delivery',
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
  }, [activeDelivery]);

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
