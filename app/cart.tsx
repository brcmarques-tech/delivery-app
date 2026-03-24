import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  Modal,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart, CartItem } from '../src/contexts/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { colors as staticColors, fonts } from '../src/theme';

function formatWeight(grams: number) {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1)}kg`;
  }
  return `${grams}g`;
}

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, updateQuantity, updateWeight, removeItem, clearCart } = useCart();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Adjustment modal state
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editValue, setEditValue] = useState(0);

  function openEditor(item: CartItem) {
    setEditingItem(item);
    setEditValue(item.isVariableWeight ? (item.weightGrams || 100) : item.quantity);
  }

  function confirmEdit() {
    if (!editingItem) return;
    if (editingItem.isVariableWeight) {
      if (editValue <= 0) removeItem(editingItem.id);
      else updateWeight(editingItem.id, editValue);
    } else {
      if (editValue <= 0) removeItem(editingItem.id);
      else updateQuantity(editingItem.id, editValue);
    }
    setEditingItem(null);
  }

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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleStore(storeId: string) {
    const storeItems = items.filter((i) => i.storeId === storeId);
    const allSelected = storeItems.every((i) => selectedIds.has(i.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of storeItems) {
        if (allSelected) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((i) => i.id)));
  }

  function handleCheckout() {
    if (selectedCount === 0) return;
    const storeIds = new Set(
      items.filter((i) => selectedIds.has(i.id)).map((i) => i.storeId),
    );
    if (storeIds.size > 1) return;

    const selected = items.filter((i) => selectedIds.has(i.id));
    const storeId = selected[0].storeId;
    const storeName = selected[0].storeName;

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

  // Editor modal step values
  const isWeight = editingItem?.isVariableWeight;
  const step = isWeight ? 50 : 1;
  const minValue = step;
  const displayValue = isWeight ? formatWeight(editValue) : `${editValue}`;

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

          const qtyLabel = item.isVariableWeight
            ? formatWeight(item.weightGrams || 0)
            : `${item.quantity}`;

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

              {/* Delete button */}
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.danger + '15' }]}
                onPress={() => removeItem(item.id)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>

              {/* Quantity/weight badge - tap to edit */}
              <TouchableOpacity
                style={[styles.qtyBadge, { backgroundColor: colors.primary + '15' }]}
                onPress={() => openEditor(item)}
              >
                <Text style={[styles.qtyBadgeText, { color: colors.primary }]}>{qtyLabel}</Text>
                <Ionicons name="pencil-outline" size={12} color={colors.primary} />
              </TouchableOpacity>
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

      {/* Quantity/Weight editor modal */}
      <Modal visible={!!editingItem} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setEditingItem(null)}>
          <Pressable style={[styles.editorCard, { backgroundColor: colors.card }]} onPress={() => {}}>
            <Text style={[styles.editorTitle, { color: colors.text }]}>
              {isWeight ? 'Ajustar peso' : 'Ajustar quantidade'}
            </Text>
            <Text style={[styles.editorItemName, { color: colors.textLight }]}>{editingItem?.name}</Text>

            <View style={styles.editorRow}>
              <TouchableOpacity
                style={[styles.editorBtn, { backgroundColor: colors.primary + '15' }]}
                onPress={() => setEditValue((v) => Math.max(minValue, v - step))}
              >
                <Ionicons name="remove" size={24} color={colors.primary} />
              </TouchableOpacity>

              <Text style={[styles.editorValue, { color: colors.text }]}>{displayValue}</Text>

              <TouchableOpacity
                style={[styles.editorBtn, { backgroundColor: colors.primary + '15' }]}
                onPress={() => setEditValue((v) => v + step)}
              >
                <Ionicons name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {isWeight && editingItem && (
              <Text style={[styles.editorSubtext, { color: colors.textLight }]}>
                R$ {((editingItem.price * editValue) / 1000).toFixed(2)}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.editorConfirm, { backgroundColor: colors.primary }]}
              onPress={confirmEdit}
            >
              <Text style={styles.editorConfirmText}>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    gap: 8,
  },
  checkboxArea: { padding: 4 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fonts.regular, fontWeight: '600', color: staticColors.text },
  itemPrice: { fontSize: fonts.small, color: staticColors.primary, fontWeight: '600', marginTop: 2 },
  itemNotes: { fontSize: fonts.tiny, color: staticColors.textLight, marginTop: 2, fontStyle: 'italic' },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  qtyBadgeText: { fontSize: fonts.small, fontWeight: 'bold' },
  // Footer
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
  // Editor modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  editorCard: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 12,
  },
  editorTitle: { fontSize: fonts.large, fontWeight: 'bold' },
  editorItemName: { fontSize: fonts.small },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginVertical: 8,
  },
  editorBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorValue: { fontSize: 28, fontWeight: 'bold', minWidth: 80, textAlign: 'center' },
  editorSubtext: { fontSize: fonts.small },
  editorConfirm: {
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 10,
    marginTop: 4,
  },
  editorConfirmText: { color: '#fff', fontSize: fonts.regular, fontWeight: 'bold' },
});
