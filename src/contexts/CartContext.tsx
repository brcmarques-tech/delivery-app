import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_TO_CART, UPDATE_CART_ITEM, REMOVE_FROM_CART, CLEAR_CART } from '../lib/graphql/mutations';
import { GET_MY_CART } from '../lib/graphql/queries';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string; // server cart item id
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

interface CartContextData {
  items: CartItem[];
  addItem: (productId: string, quantity: number, notes?: string, weightGrams?: number) => Promise<void>;
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

  const { data: cartData, loading: queryLoading, refetch } = useQuery(GET_MY_CART, {
    skip: !user,
    fetchPolicy: 'network-only',
    onError: () => {},
  });

  const [addToCartMutation] = useMutation(ADD_TO_CART, { onError: () => {} });
  const [updateCartItemMutation] = useMutation(UPDATE_CART_ITEM, { onError: () => {} });
  const [removeFromCartMutation] = useMutation(REMOVE_FROM_CART, { onError: () => {} });
  const [clearCartMutation] = useMutation(CLEAR_CART, { onError: () => {} });

  // Sync server cart to local state
  useEffect(() => {
    if (cartData?.myCart) {
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
    }
  }, [cartData]);

  // Clear on logout
  useEffect(() => {
    if (!user) {
      setItems([]);
    }
  }, [user]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  async function addItem(productId: string, quantity: number, notes?: string, weightGrams?: number) {
    if (!user) return;
    await addToCartMutation({
      variables: {
        input: {
          productId,
          quantity,
          notes: notes || null,
          weightGrams: weightGrams || null,
        },
      },
    });
    refetch();
  }

  function removeItem(cartItemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
    if (user) {
      removeFromCartMutation({ variables: { cartItemId } }).then(() => refetch());
    }
  }

  function updateQuantity(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)),
    );
    if (user) {
      updateCartItemMutation({
        variables: { input: { cartItemId, quantity } },
      }).then(() => refetch());
    }
  }

  function updateWeight(cartItemId: string, weightGrams: number) {
    if (weightGrams <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === cartItemId ? { ...i, weightGrams } : i)),
    );
    if (user) {
      updateCartItemMutation({
        variables: { input: { cartItemId, weightGrams } },
      }).then(() => refetch());
    }
  }

  function clearCart() {
    setItems([]);
    if (user) {
      clearCartMutation().then(() => refetch());
    }
  }

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, updateWeight, clearCart, itemCount, loading: queryLoading, refetch }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
