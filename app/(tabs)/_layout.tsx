import { useEffect } from 'react';
import { Tabs, usePathname, router } from 'expo-router';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useSubscription } from '@apollo/client';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useCart } from '../../src/contexts/CartContext';
import { GET_MY_ORDERS, GET_AVAILABLE_DELIVERIES } from '../../src/lib/graphql/queries';
import { ORDER_UPDATED, DELIVERY_UPDATED } from '../../src/lib/graphql/subscriptions';

const ACTIVE_ORDER_STATUSES = ['AWAITING_PAYMENT', 'PAYMENT_REVIEW', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERING', 'VENDOR_CONFIRMED_PICKUP', 'DELIVERER_CONFIRMED_DELIVERY'];

export default function TabsLayout() {
  const pathname = usePathname();

  // Back button: if on home tab, do nothing (don't exit/logout). Otherwise, go to home.
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pathname === '/' || pathname === '/home' || pathname === '/(tabs)/home') {
        return true; // block — already on home
      }
      router.replace('/(tabs)/home');
      return true; // handled
    });
    return () => handler.remove();
  }, [pathname]);
  const { user } = useAuth();
  const { colors } = useTheme();
  const { itemCount } = useCart();
  const isDeliverer = user?.isDeliverer === true || user?.role === 'DELIVERER';
  const insets = useSafeAreaInsets();

  // Active orders count for badge (auto-updates via subscription)
  const { data: ordersData, refetch: refetchOrders } = useQuery(GET_MY_ORDERS, { skip: !user, fetchPolicy: 'cache-and-network' });
  const activeOrderCount = (ordersData?.myOrders || []).filter((o: any) => ACTIVE_ORDER_STATUSES.includes(o.status)).length;
  useSubscription(ORDER_UPDATED, {
    skip: !user,
    onData: () => { refetchOrders(); },
  });

  // Available deliveries count for badge (auto-updates via subscription)
  const { data: deliveriesData, refetch: refetchDeliveries } = useQuery(GET_AVAILABLE_DELIVERIES, { skip: !isDeliverer, fetchPolicy: 'cache-and-network' });
  const availableDeliveryCount = (deliveriesData?.availableDeliveries || []).length;
  useSubscription(DELIVERY_UPDATED, {
    skip: !isDeliverer,
    onData: () => { refetchDeliveries(); },
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.grayLight,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="receipt-outline" size={size} color={color} />
              {activeOrderCount > 0 && (
                <View style={[tabStyles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={tabStyles.badgeText}>{activeOrderCount > 99 ? '99+' : activeOrderCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* Tab de entregas - so aparece para entregadores */}
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'Entregas',
          href: isDeliverer ? '/(tabs)/deliveries' : null,
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="bicycle-outline" size={size} color={color} />
              {availableDeliveryCount > 0 && (
                <View style={[tabStyles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={tabStyles.badgeText}>{availableDeliveryCount > 99 ? '99+' : availableDeliveryCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* Tab escondida - usada internamente pelo deliveries */}
      <Tabs.Screen
        name="my-deliveries"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrinho',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="cart-outline" size={size} color={color} />
              {itemCount > 0 && (
                <View style={[tabStyles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={tabStyles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* Profile escondida da tab bar - acesso via header */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
