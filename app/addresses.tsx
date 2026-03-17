import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GET_MY_ADDRESSES } from '../src/lib/graphql/queries';
import { CREATE_ADDRESS, SET_DEFAULT_ADDRESS, DELETE_ADDRESS } from '../src/lib/graphql/mutations';
import { useAlert } from '../src/contexts/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../src/theme';

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useQuery(GET_MY_ADDRESSES);
  const [createAddress] = useMutation(CREATE_ADDRESS);
  const [setDefault] = useMutation(SET_DEFAULT_ADDRESS);
  const [deleteAddress] = useMutation(DELETE_ADDRESS);
  const { alert } = useAlert();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: 0,
    longitude: 0,
  });

  const addresses = data?.myAddresses || [];

  async function handleGetLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Erro', 'Permissao de localizacao negada');
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const { latitude, longitude } = current.coords;
      setForm((prev) => ({ ...prev, latitude, longitude }));

      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        const r = results[0];
        const city = r.city || r.subregion || '';
        const neighborhood = r.district && r.district !== city ? r.district : '';
        setForm((prev) => ({
          ...prev,
          street: r.street || prev.street,
          number: r.streetNumber || prev.number,
          neighborhood: neighborhood || prev.neighborhood,
          city: city || prev.city,
          state: r.region || prev.state,
          zipCode: r.postalCode || prev.zipCode,
        }));
      }
    } catch (err: any) {
      alert('Erro', err.message || 'Nao foi possivel obter a localizacao');
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    if (!form.street || !form.number || !form.neighborhood || !form.city || !form.state) {
      alert('Erro', 'Preencha os campos obrigatorios');
      return;
    }

    setSaving(true);
    try {
      // If no coords, geocode from address
      let lat = form.latitude;
      let lng = form.longitude;
      if (!lat || !lng) {
        const query = `${form.street}, ${form.number}, ${form.neighborhood}, ${form.city}, ${form.state}`;
        const results = await Location.geocodeAsync(query);
        if (results.length > 0) {
          lat = results[0].latitude;
          lng = results[0].longitude;
        }
      }

      await createAddress({
        variables: {
          input: {
            street: form.street,
            number: form.number,
            complement: form.complement || undefined,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
            zipCode: form.zipCode || '',
            latitude: lat,
            longitude: lng,
            isDefault: addresses.length === 0,
          },
        },
      });

      setForm({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '', latitude: 0, longitude: 0 });
      setShowForm(false);
      refetch();
    } catch (err: any) {
      alert('Erro', err.message || 'Nao foi possivel salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(id: string) {
    await setDefault({ variables: { id } });
    refetch();
  }

  function handleDelete(id: string) {
    alert('Remover endereco', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await deleteAddress({ variables: { id } });
          refetch();
        },
      },
    ]);
  }

  function formatAddress(addr: any) {
    const parts = [addr.street, addr.number];
    if (addr.complement) parts.push(addr.complement);
    parts.push(addr.neighborhood);
    parts.push(`${addr.city}/${addr.state}`);
    return parts.join(', ');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Meus enderecos</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TouchableOpacity style={styles.gpsButton} onPress={handleGetLocation} disabled={locating}>
            {locating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="navigate" size={18} color={colors.white} />
                <Text style={styles.gpsButtonText}>Usar minha localizacao</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Rua *"
              placeholderTextColor={colors.gray}
              value={form.street}
              onChangeText={(v) => setForm({ ...form, street: v })}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Numero *"
              placeholderTextColor={colors.gray}
              value={form.number}
              onChangeText={(v) => setForm({ ...form, number: v })}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Complemento"
            placeholderTextColor={colors.gray}
            value={form.complement}
            onChangeText={(v) => setForm({ ...form, complement: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Bairro *"
            placeholderTextColor={colors.gray}
            value={form.neighborhood}
            onChangeText={(v) => setForm({ ...form, neighborhood: v })}
          />
          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Cidade *"
              placeholderTextColor={colors.gray}
              value={form.city}
              onChangeText={(v) => setForm({ ...form, city: v })}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Estado *"
              placeholderTextColor={colors.gray}
              value={form.state}
              onChangeText={(v) => setForm({ ...form, state: v })}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="CEP"
            placeholderTextColor={colors.gray}
            value={form.zipCode}
            onChangeText={(v) => setForm({ ...form, zipCode: v })}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar endereco'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, item.isDefault && styles.cardDefault]}>
            <View style={styles.cardContent}>
              {item.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Principal</Text>
                </View>
              )}
              <Text style={styles.addressText}>{formatAddress(item)}</Text>
              {item.zipCode ? (
                <Text style={styles.zipText}>CEP: {item.zipCode}</Text>
              ) : null}
            </View>
            <View style={styles.cardActions}>
              {!item.isDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(item.id)}
                >
                  <Ionicons name="star-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color={colors.grayLight} />
            <Text style={styles.emptyText}>Nenhum endereco salvo</Text>
            <Text style={styles.emptySubtext}>
              Adicione um endereco ou faca um pedido{'\n'}e ele sera salvo automaticamente
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 56,
    backgroundColor: colors.white,
  },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text },
  form: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  formRow: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.small,
    color: colors.text,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 12,
  },
  gpsButtonText: { color: colors.white, fontWeight: '600', fontSize: fonts.small },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: { color: colors.white, fontWeight: 'bold', fontSize: fonts.regular },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardDefault: {
    borderColor: colors.primary + '40',
  },
  cardContent: { flex: 1 },
  defaultBadge: {
    backgroundColor: colors.primary + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  defaultBadgeText: { color: colors.primary, fontSize: fonts.tiny, fontWeight: '600' },
  addressText: { fontSize: fonts.small, color: colors.text, lineHeight: 20 },
  zipText: { fontSize: fonts.tiny, color: colors.textLight, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: fonts.regular, color: colors.textLight, fontWeight: '600' },
  emptySubtext: { fontSize: fonts.small, color: colors.gray, textAlign: 'center' },
});
