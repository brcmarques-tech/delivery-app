import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@apollo/client';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GET_STORES } from '../../src/lib/graphql/queries';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as staticColors, fonts } from '../../src/theme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { data } = useQuery(GET_STORES);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const stores = (data?.stores || []).filter((s: any) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.white, paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Buscar</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.grayLight }]}>
          <Ionicons name="search" size={20} color={colors.gray} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar lojas, produtos..."
            placeholderTextColor={colors.gray}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/store/${item.id}`)}
          >
            <Ionicons name="storefront-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.itemDesc, { color: colors.textLight }]}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length > 0 ? (
            <Text style={[styles.empty, { color: colors.textLight }]}>Nenhum resultado para "{query}"</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: staticColors.background },
  header: { padding: 24, paddingTop: 56, backgroundColor: staticColors.white },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: staticColors.text, marginBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticColors.grayLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInput: { flex: 1, padding: 14, fontSize: fonts.regular, color: staticColors.text },
  list: { padding: 16, gap: 8 },
  item: {
    backgroundColor: staticColors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemName: { fontSize: fonts.regular, fontWeight: '600', color: staticColors.text },
  itemDesc: { fontSize: fonts.small, color: staticColors.textLight },
  empty: { textAlign: 'center', color: staticColors.textLight, marginTop: 48, fontSize: fonts.regular },
});
