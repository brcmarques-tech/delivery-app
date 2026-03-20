import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart, CartItem } from '../src/contexts/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { colors as staticColors, fonts } from '../src/theme';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, updateQuantity, updateWeight, removeItem, clearCart } = useCart();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Group items by store
  const sections = useMemo(() => {
    const grouped: Record<string, { storeName: string; storeId: string; items: CartItem[] }> = {};
    for (const item of items) {
      if (!grouped[item.storeId]) {
        grouped[item.storeId] = { storeName: item.storeName, storeId: item.storeId, items: [] };
      }
      grouped[item.storeId].items.push(item);
    }
    return Object.values(grouped).map((g) => ({
      title: g.storeName,
      storeId: g.storeId,
      data: g.items,
    }));
  }, [items]);

  // Calculate total of selected items
  const selectedTotal = useMemo(() => {
    return items
      .filter((i) => selectedIds.has(i.id))
      .reduce((sum, item) => {
        if (item.isVariableWeight) {
          return sum + (item.price * (item.weightGrams || 0)) / 1000;
        }
        return sum + item.price * item.quantity;
      }, 0);
  }, [items, selectedIds]);

  const selectedCount = selectedIds.size;

  // Check if all selected items are from the same store
  const selectedStoreId = useMemo(() => {
    const storeIds = new Set(
      items.filter((i) => selectedIds.has(i.id)).map((i) => i.storeId),
    );
    if (storeIds.size === 1) return [...storeIds][0];
    return null;
  }, [items, selectedIds]);

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleStore(storeId: string) {
    const storeItems = items.filter((i) => i.storeId === storeId);
    const allSelected = storeItems.every((i) => selectedIds.has(i.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of storeItems) {
        if (allSelected) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
      }
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  function handleCheckout() {
    if (selectedCount === 0) return;

    // Check all selected are from same store
    const storeIds = new Set(
      items.filter((i) => selectedIds.has(i.id)).map((i) => i.storeId),
    );
    if (storeIds.size > 1) {
      return; // Button should be disabled, but safeguard
    }

    const selected = items.filter((i) => selectedIds.has(i.id));
    const storeId = selected[0].storeId;
    const storeName = selected[0].storeName;

    // Pass selected items via query params (encoded)
    router.push({
      pathname: '/checkout',
      params: {
        storeId,
        storeName,
        selectedItems: JSON.stringify(
          selected.map((i) => ({
            id: i.id,
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            notes: i.notes,
            isVariableWeight: i.isVariableWeight,
            weightGrams: i.weightGrams,
          })),
        ),
      },
    });
  }

  const multipleStoresSelected = useMemo(() => {
    const storeIds = new Set(
      items.filter((i) => selectedIds.has(i.id)).map((i) => i.storeId),
    );
    return storeIds.size > 1;
  }, [items, selectedIds]);

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Ionicons name="cart-outline" size={64} color={colors.grayLight} />
        <Text style={[styles.emptyText, { color: colors.textLight }]}>Seu carrinho esta vazio</Text>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/home')}
        >
          <Text style={styles.emptyButtonText}>Ver lojas</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.white }]}>
        <View style={{ width: 24 }} />
        <Text style={[styles.title, { color: colors.text }]}>Carrinho</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={[styles.clearText, { color: colors.danger }]}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {/* Select all / deselect all */}
      <TouchableOpacity
        style={[styles.selectAllRow, { backgroundColor: colors.white, borderBottomColor: colors.grayLight }]}
        onPress={selectAll}
      >
        <Ionicons
          name={selectedIds.size === items.length ? 'checkbox' : 'square-outline'}
          size={18}
          color={selectedIds.size === items.length ? colors.primary : colors.gray}
        />
        <Text style={[styles.selectAllText, { color: colors.text }]}>
          {selectedIds.size === items.length ? 'Desmarcar todos' : 'Selecionar todos'}
        </Text>
      </TouchableOpacity>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
        renderSectionHeader={({ section }) => {
          const storeItems = section.data;
          const allSelected = storeItems.every((i: CartItem) => selectedIds.has(i.id));
          const someSelected = storeItems.some((i: CartItem) => selectedIds.has(i.id));
          return (
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleStore(section.storeId)}
            >
              <Ionicons
                name={allSelected ? 'checkbox' : someSelected ? 'remove-circle-outline' : 'square-outline'}
                size={18}
                color={allSelected ? colors.primary : colors.gray}
              />
              <Ionicons name="storefront-outline" size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            </TouchableOpacity>
          );
        }}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id);
          const itemTotal = item.isVariableWeight
            ? (item.price * (item.weightGrams || 0)) / 1000
            : item.price * item.quantity;

          return (
            <View style={[
              styles.itemCard,
              { backgroundColor: colors.white },
              isSelected && {
                borderWidth: 1.5,
                borderColor: colors.primary + '40',
                backgroundColor: colors.primary + '05',
              },
            ]}>
              <TouchableOpacity
                style={styles.checkboxArea}
                onPress={() => toggleItem(item.id)}
              >
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={isSelected ? colors.primary : colors.gray}
                />
              </TouchableOpacity>

              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>R$ {itemTotal.toFixed(2)}</Text>
                {item.notes ? (
                  <Text style={[styles.itemNotes, { color: colors.textLight }]} numberOfLines={1}>{item.notes}</Text>
                ) : null}
              </View>

              {item.isVariableWeight ? (
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={[styles.qtyButton, { backgroundColor: colors.primary + '15' }]}
                    onPress={() => updateWeight(item.id, (item.weightGrams || 0) - 100)}
                  >
                    <Ionicons
                      name={(item.weightGrams || 0) <= 100 ? 'trash-outline' : 'remove'}
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: colors.text }]}>
                    {(item.weightGrams || 0) >= 1000
                      ? `${((item.weightGrams || 0) / 1000).toFixed((item.weightGrams || 0) % 1000 === 0 ? 0 : 1)}kg`
                      : `${item.weightGrams || 0}g`}
                  </Text>
                  <TouchableOpacity
                    style={[styles.qtyButton, { backgroundColor: colors.primary + '15' }]}
                    onPress={() => updateWeight(item.id, (item.weightGrams || 0) + 100)}
                  >
                    <Ionicons name="add" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={[styles.qtyButton, { backgroundColor: colors.primary + '15' }]}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Ionicons
                      name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyButton, { backgroundColor: colors.primary + '15' }]}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Footer: checkout button */}
      <View style={[styles.footerBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.white, borderTopColor: colors.grayLight }]}>
        {multipleStoresSelected && (
          <Text style={[styles.warningText, { color: colors.warning }]}>
            Selecione itens de apenas uma loja por vez
          </Text>
        )}
        <View style={styles.footerRow}>
          <View>
            <Text style={[styles.footerLabel, { color: colors.textLight }]}>
              {selectedCount} {selectedCount === 1 ? 'item' : 'itens'}
            </Text>
            <Text style={[styles.footerTotal, { color: colors.text }]}>R$ {selectedTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              { backgroundColor: colors.primary },
              (selectedCount === 0 || multipleStoresSelected) && styles.checkoutDisabled,
            ]}
            onPress={handleCheckout}
            disabled={selectedCount === 0 || multipleStoresSelected}
          >
            <Text style={styles.checkoutText}>Comprar</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: staticColors.background },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: staticColors.background },
  emptyText: { fontSize: fonts.regular, color: staticColors.textLight },
  emptyButton: { backgroundColor: staticColors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  emptyButtonText: { color: '#fff', fontWeight: 'bold' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 56,
    backgroundColor: staticColors.white,
  },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: staticColors.text },
  clearText: { color: staticColors.danger, fontSize: fonts.regular },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: staticColors.white,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.grayLight,
  },
  selectAllText: { fontSize: fonts.small, color: staticColors.text, fontWeight: '600' },
  list: { padding: 12, paddingBottom: 140 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: fonts.regular,
    fontWeight: 'bold',
    color: staticColors.text,
  },
  itemCard: {
    backgroundColor: staticColors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCardSelected: {
    borderWidth: 1.5,
    borderColor: staticColors.primary + '40',
    backgroundColor: staticColors.primary + '05',
  },
  checkboxArea: {
    padding: 4,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fonts.regular, fontWeight: '600', color: staticColors.text },
  itemPrice: { fontSize: fonts.small, color: staticColors.primary, fontWeight: '600', marginTop: 2 },
  itemNotes: { fontSize: fonts.tiny, color: staticColors.textLight, marginTop: 2, fontStyle: 'italic' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: staticColors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { fontSize: fonts.small, fontWeight: 'bold', color: staticColors.text, minWidth: 24, textAlign: 'center' },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: staticColors.white,
    borderTopWidth: 1,
    borderTopColor: staticColors.grayLight,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: { fontSize: fonts.small, color: staticColors.textLight },
  footerTotal: { fontSize: fonts.large, fontWeight: 'bold', color: staticColors.text },
  warningText: {
    fontSize: fonts.small,
    color: staticColors.warning,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  checkoutButton: {
    backgroundColor: staticColors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkoutDisabled: { opacity: 0.4 },
  checkoutText: { color: '#fff', fontSize: fonts.regular, fontWeight: 'bold' },
});
