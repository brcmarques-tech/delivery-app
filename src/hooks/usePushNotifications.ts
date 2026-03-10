import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
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
} catch {
  // expo-notifications not available (Expo Go)
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
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
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
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

  useEffect(() => {
    if (!user || !token || registeredRef.current || !Notifications) return;

    registerForPushNotifications().then((pushToken) => {
      if (pushToken) {
        registerToken({ variables: { token: pushToken } })
          .then(() => {
            registeredRef.current = true;
          })
          .catch((err: any) => console.log('Failed to register push token:', err));
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data;

      if (data?.type === 'ORDER_STATUS' || data?.type === 'NEW_ORDER') {
        router.push('/(tabs)/orders');
      } else if (data?.type === 'DELIVERY_OFFER') {
        router.push('/(tabs)/deliveries');
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user, token]);
}
