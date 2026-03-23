import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useMutation } from '@apollo/client';
import { useAuth } from '../contexts/AuthContext';
import { REGISTER_PUSH_TOKEN } from '../lib/graphql/mutations';
import { router } from 'expo-router';

let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  console.log('[PUSH] expo-notifications loaded OK');
} catch (e) {
  console.log('[PUSH] expo-notifications NOT available:', e);
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async (notification: any) => {
      const data = notification?.request?.content?.data;
      const title = notification?.request?.content?.title;
      const body = notification?.request?.content?.body;
      console.log('[PUSH] handleNotification called:', data?.type, title);

      // Show in-app alert for ANY foreground notification (test)
      setTimeout(() => {
        Alert.alert(
          title || 'Notificação',
          body || 'Você recebeu uma notificação.',
          [{ text: 'OK' }],
        );
      }, 300);

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
}

async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications || !Device) {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Entregas e Pedidos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (err) {
    console.log('Push notification registration failed:', err);
    return null;
  }
}

export function usePushNotifications() {
  const { user, token } = useAuth();
  const [registerToken] = useMutation(REGISTER_PUSH_TOKEN);
  const registeredRef = useRef(false);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  // Register push token (once)
  useEffect(() => {
    if (!user || !token || registeredRef.current || !Notifications) return;

    registerForPushNotifications().then((pushToken) => {
      console.log('[PUSH] Got push token:', pushToken ? pushToken.substring(0, 30) + '...' : 'null');
      if (pushToken) {
        registerToken({ variables: { token: pushToken } })
          .then(() => { registeredRef.current = true; console.log('[PUSH] Token registered with API'); })
          .catch((err: any) => console.log('[PUSH] Failed to register push token:', err));
      }
    });
  }, [user, token]);

  // Notification listeners (always active when logged in)
  useEffect(() => {
    if (!user || !Notifications) return;

    console.log('[PUSH] Setting up notification listeners for user:', user?.id);
    notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('[PUSH] === NOTIFICATION RECEIVED IN FOREGROUND ===');
      console.log('[PUSH] Full notification:', JSON.stringify(notification?.request?.content, null, 2));
      const data = notification.request.content.data;
      const title = notification.request.content.title;
      const body = notification.request.content.body;
      console.log('[PUSH] Foreground notification:', data?.type, data?.orderId);

      if (data?.type === 'REQUEST_CANCEL_DISPUTE' && data?.orderId) {
        Alert.alert(
          title || 'Solicitação da loja',
          body || 'A loja pediu para você cancelar a reclamação.',
          [
            { text: 'Ignorar', style: 'cancel' },
            { text: 'Ver pedido', onPress: () => router.push(`/order/${data.orderId}`) },
          ],
        );
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data;

      if (data?.type === 'REQUEST_CANCEL_DISPUTE' && data?.orderId) {
        router.push(`/order/${data.orderId}`);
      } else if (data?.type === 'PAYMENT_CONFIRMED' && data?.orderId) {
        router.push(`/order/${data.orderId}`);
      } else if (data?.type === 'ORDER_STATUS' || data?.type === 'NEW_ORDER') {
        router.push('/(tabs)/orders');
      } else if (data?.type === 'DELIVERY_OFFER') {
        router.push('/(tabs)/deliveries');
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);
}
