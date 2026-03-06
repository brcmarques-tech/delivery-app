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
import { colors, fonts } from '../../src/theme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { data } = useQuery(GET_STORES);

  const stores = (data?.stores || []).filter((s: any) =>
    s.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
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
            style={styles.item}
            onPress={() => router.push(`/store/${item.id}`)}
          >
            <Ionicons name="storefront-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length > 0 ? (
            <Text style={styles.empty}>Nenhum resultado para "{query}"</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 56, backgroundColor: colors.white },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInput: { flex: 1, padding: 14, fontSize: fonts.regular, color: colors.text },
  list: { padding: 16, gap: 8 },
  item: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemName: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  itemDesc: { fontSize: fonts.small, color: colors.textLight },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: 48, fontSize: fonts.regular },
});
