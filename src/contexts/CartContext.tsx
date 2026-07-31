import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_TO_CART, UPDATE_CART_ITEM, REMOVE_FROM_CART, CLEAR_CART } from '../lib/graphql/mutations';
import { GET_MY_CART } from '../lib/graphql/queries';
import { onProductUpdated } from '../lib/productEvents';
import { useAuth } from './AuthContext';

const CART_STORAGE_KEY = '@cart_items';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  notes?: string;
  isVariableWeight?: boolean;
  weightGrams?: number;
  storeId: string;
  storeName: string;
}

export interface AddItemInfo {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  isVariableWeight?: boolean;
  storeId: string;
  storeName: string;
}

interface CartContextData {
  items: CartItem[];
  addItem: (info: AddItemInfo, quantity: number, notes?: string, weightGrams?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateWeight: (cartItemId: string, weightGrams: number) => void;
  clearCart: () => void;
  itemCount: number;
  loading: boolean;
  refetch: () => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [localLoaded, setLocalLoaded] = useState(false);
  const syncedRef = useRef(false);

  // --- Persistence helpers ---
  const saveLocal = useCallback((newItems: CartItem[]) => {
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems)).catch(() => {});
  }, []);

  const updateItems = useCallback((updater: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      saveLocal(next);
      return next;
    });
  }, [saveLocal]);

  // --- Load from AsyncStorage on mount (instant) ---
  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setItems(JSON.parse(raw)); } catch {}
      }
      setLocalLoaded(true);
    });
  }, []);

  // --- Server sync: fetch once on login, replace local with server truth ---
  const { data: cartData, loading: queryLoading, refetch } = useQuery(GET_MY_CART, {
    skip: !user || !localLoaded,
    fetchPolicy: 'network-only',
    onError: () => {},
  });

  useEffect(() => {
    if (cartData?.myCart && !syncedRef.current) {
      syncedRef.current = true;
      const serverItems: CartItem[] = cartData.myCart.map((ci: any) => ({
        id: ci.id,
        productId: ci.product.id,
        name: ci.product.name,
        price: ci.product.promotionalPrice ?? ci.product.price,
        quantity: ci.quantity,
        imageUrl: ci.product.imageUrl,
        notes: ci.notes,
        isVariableWeight: ci.product.isVariableWeight,
        weightGrams: ci.weightGrams,
        storeId: ci.store.id,
        storeName: ci.store.name,
      }));
      setItems(serverItems);
      saveLocal(serverItems);
    }
  }, [cartData, saveLocal]);

  // --- Mutations (fire in background, no await) ---
  const [addToCartMutation] = useMutation(ADD_TO_CART);
  const [updateCartItemMutation] = useMutation(UPDATE_CART_ITEM);
  const [removeFromCartMutation] = useMutation(REMOVE_FROM_CART);
  const [clearCartMutation] = useMutation(CLEAR_CART);

  // Perf (F2): atualiza preco local via productEvents (re-emitido pelo unico
  // assinante WS, o useProductSync) em vez de manter uma 2a subscription
  // PRODUCT_UPDATED concorrente. O updater com functional setState dispensa
  // depender de `items` (sem re-registrar o listener a cada mudanca do carrinho).
  useEffect(() => {
    const unsubscribe = onProductUpdated((updated) => {
      if (!updated?.id || updated.price === undefined) return;
      updateItems((prev) => {
        if (!prev.some((i) => i.productId === updated.id)) return prev;
        return prev.map((i) =>
          i.productId === updated.id ? { ...i, price: updated.promotionalPrice ?? updated.price! } : i,
        );
      });
    });
    return unsubscribe;
  }, [updateItems]);

  // Clear on logout
  useEffect(() => {
    if (!user) {
      setItems([]);
      syncedRef.current = false;
      AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {});
    }
  }, [user]);

  const itemCount = items.length;

  // --- Actions: all update local state FIRST, then sync to server ---

  const addItem = useCallback((info: AddItemInfo, quantity: number, notes?: string, weightGrams?: number) => {
    if (!user) {
      Alert.alert('Erro', 'Faça login para adicionar itens ao carrinho.');
      return;
    }

    // KAN-241: id temporario precisa ser unico de verdade. Antes era
    // `local-${Date.now()}`, entao dois itens de peso variavel adicionados no
    // mesmo milissegundo recebiam o MESMO id e a reconciliacao trocava o item
    // errado (quantidade/peso incorretos ou item duplicado no carrinho).
    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Update local instantly
    updateItems((prev) => {
      const existing = prev.find((i) => i.productId === info.productId && !i.isVariableWeight);
      if (existing && !info.isVariableWeight) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, {
        id: tempId,
        productId: info.productId,
        name: info.name,
        price: info.price,
        quantity,
        imageUrl: info.imageUrl,
        notes,
        isVariableWeight: info.isVariableWeight,
        weightGrams,
        storeId: info.storeId,
        storeName: info.storeName,
      }];
    });

    // Sync to server in background
    addToCartMutation({
      variables: { input: { productId: info.productId, quantity, notes: notes || null, weightGrams: weightGrams || null } },
    }).then((res) => {
      const ci = res.data?.addToCart;
      if (!ci) return;
      // Replace local temp item with server item (real id)
      updateItems((prev) => {
        // KAN-241: casa pelo tempId exato capturado no closure. Antes buscava
        // por (startsWith('local-') && productId), que podia casar o item
        // temporario errado quando havia varios do mesmo produto.
        const localIdx = prev.findIndex((i) => i.id === tempId);
        const serverItem: CartItem = {
          id: ci.id,
          productId: ci.product.id,
          name: ci.product.name,
          price: ci.product.promotionalPrice ?? ci.product.price,
          quantity: ci.quantity,
          imageUrl: ci.product.imageUrl,
          notes: ci.notes,
          isVariableWeight: ci.product.isVariableWeight,
          weightGrams: ci.weightGrams,
          storeId: ci.store.id,
          storeName: ci.store.name,
        };
        // If we found the temp item, replace it
        if (localIdx >= 0) {
          const updated = [...prev];
          // Check if server item already exists (non-variable-weight merge)
          const existingServer = updated.findIndex((i, idx) => idx !== localIdx && i.id === ci.id);
          if (existingServer >= 0) {
            updated[existingServer] = serverItem;
            updated.splice(localIdx, 1);
          } else {
            updated[localIdx] = serverItem;
          }
          return updated;
        }
        // Fallback: just upsert by server id
        const existingIdx = prev.findIndex((i) => i.id === ci.id);
        if (existingIdx >= 0) {
          return prev.map((i) => i.id === ci.id ? serverItem : i);
        }
        return [...prev, serverItem];
      });
    }).catch(() => {
      // Revert: refetch server state
      refetch().then((res) => {
        if (res.data?.myCart) {
          const serverItems = res.data.myCart.map((ci: any) => ({
            id: ci.id, productId: ci.product.id, name: ci.product.name,
            price: ci.product.promotionalPrice ?? ci.product.price, quantity: ci.quantity,
            imageUrl: ci.product.imageUrl, notes: ci.notes, isVariableWeight: ci.product.isVariableWeight,
            weightGrams: ci.weightGrams, storeId: ci.store.id, storeName: ci.store.name,
          }));
          setItems(serverItems);
          saveLocal(serverItems);
        }
      });
      Alert.alert('Erro', 'Não foi possível adicionar ao carrinho.');
    });
  }, [user, updateItems, addToCartMutation, refetch, saveLocal]);

  const removeItem = useCallback((cartItemId: string) => {
    updateItems((prev) => prev.filter((i) => i.id !== cartItemId));
    if (user && !cartItemId.startsWith('local-')) {
      removeFromCartMutation({ variables: { cartItemId } }).catch(() => {});
    }
  }, [user, updateItems, removeFromCartMutation]);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(cartItemId); return; }
    updateItems((prev) => prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)));
    if (user && !cartItemId.startsWith('local-')) {
      updateCartItemMutation({ variables: { input: { cartItemId, quantity } } }).catch(() => {});
    }
  }, [user, updateItems, updateCartItemMutation, removeItem]);

  const updateWeight = useCallback((cartItemId: string, weightGrams: number) => {
    if (weightGrams <= 0) { removeItem(cartItemId); return; }
    updateItems((prev) => prev.map((i) => (i.id === cartItemId ? { ...i, weightGrams } : i)));
    if (user && !cartItemId.startsWith('local-')) {
      updateCartItemMutation({ variables: { input: { cartItemId, weightGrams } } }).catch(() => {});
    }
  }, [user, updateItems, updateCartItemMutation, removeItem]);

  const clearCart = useCallback(() => {
    updateItems(() => []);
    if (user) { clearCartMutation().catch(() => {}); }
  }, [user, updateItems, clearCartMutation]);

  // Perf: value memoizado + acoes estaveis. CartProvider e o provider mais interno
  // e envolve o app todo; antes, cada mutacao do carrinho re-renderizava todo
  // consumidor de useCart e as identidades novas das acoes quebravam qualquer memo.
  const value = useMemo<CartContextData>(() => ({
    items, addItem, removeItem, updateQuantity, updateWeight, clearCart,
    itemCount, loading: queryLoading && !localLoaded, refetch,
  }), [items, addItem, removeItem, updateQuantity, updateWeight, clearCart, itemCount, queryLoading, localLoaded, refetch]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
