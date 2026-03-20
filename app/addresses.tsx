import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

let MapView: any = View;
let Marker: any = View;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}
import { GET_MY_ADDRESSES } from '../src/lib/graphql/queries';
import { CREATE_ADDRESS, UPDATE_ADDRESS, SET_DEFAULT_ADDRESS, DELETE_ADDRESS } from '../src/lib/graphql/mutations';
import { useAlert } from '../src/contexts/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../src/theme';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const { data, loading, refetch } = useQuery(GET_MY_ADDRESSES);
  const [createAddress] = useMutation(CREATE_ADDRESS);
  const [updateAddress] = useMutation(UPDATE_ADDRESS);
  const [setDefault] = useMutation(SET_DEFAULT_ADDRESS);
  const [deleteAddress] = useMutation(DELETE_ADDRESS);
  const { alert } = useAlert();

  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [geocodingMap, setGeocodingMap] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);
  const emptyForm = {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: 0,
    longitude: 0,
  };
  const [form, setForm] = useState(emptyForm);

  const addresses = data?.myAddresses || [];

  async function handleCepChange(cep: string) {
    const cleaned = cep.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, zipCode: cleaned }));
    if (cleaned.length === 8) {
      setFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setForm((prev) => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
            complement: data.complemento || prev.complement,
          }));
        }
      } catch {
        // silently fail - user can fill manually
      } finally {
        setFetchingCep(false);
      }
    }
  }

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

  async function handleShowMap() {
    if (!form.street || !form.number || !form.neighborhood || !form.city || !form.state) {
      alert('Erro', 'Preencha os campos obrigatórios');
      return;
    }
    setGeocodingMap(true);
    try {
      if (!form.latitude || !form.longitude) {
        const query = `${form.street}, ${form.number}, ${form.neighborhood}, ${form.city}, ${form.state}`;
        const results = await Location.geocodeAsync(query);
        if (results.length > 0) {
          setForm((prev) => ({ ...prev, latitude: results[0].latitude, longitude: results[0].longitude }));
        }
      }
      setShowMap(true);
    } catch {
      alert('Erro', 'Não foi possível localizar o endereço');
    } finally {
      setGeocodingMap(false);
    }
  }

  function handleEdit(addr: any) {
    setForm({
      street: addr.street || '',
      number: addr.number || '',
      complement: addr.complement || '',
      neighborhood: addr.neighborhood || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      latitude: addr.latitude || 0,
      longitude: addr.longitude || 0,
    });
    setEditingId(addr.id);
    setShowForm(true);
    setShowMap(false);
  }

  function handleCloseForm() {
    setShowForm(false);
    setShowMap(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.street || !form.number || !form.neighborhood || !form.city || !form.state) {
      alert('Erro', 'Preencha os campos obrigatorios');
      return;
    }

    setSaving(true);
    try {
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

      if (editingId) {
        await updateAddress({
          variables: {
            input: {
              id: editingId,
              street: form.street,
              number: form.number,
              complement: form.complement || undefined,
              neighborhood: form.neighborhood,
              city: form.city,
              state: form.state,
              zipCode: form.zipCode || '',
              latitude: lat,
              longitude: lng,
            },
          },
        });
      } else {
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
      }

      handleCloseForm();
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Meus enderecos</Text>
        <TouchableOpacity onPress={() => showForm ? handleCloseForm() : setShowForm(true)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showForm && (
        <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingId ? 'Editar endereco' : 'Novo endereco'}</Text>
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

          {/* CEP primeiro para auto-preencher */}
          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="CEP"
              placeholderTextColor={colors.gray}
              value={form.zipCode}
              onChangeText={handleCepChange}
              keyboardType="numeric"
              maxLength={8}
            />
            {fetchingCep && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: -36 }} />
            )}
          </View>
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
            <TouchableOpacity
              style={[styles.input, styles.stateSelector, { flex: 1 }]}
              onPress={() => setShowStatePicker(true)}
            >
              <Text style={form.state ? styles.stateText : styles.statePlaceholder}>
                {form.state || 'UF *'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.gray} />
            </TouchableOpacity>
          </View>

          {!showMap ? (
            <TouchableOpacity
              style={[styles.saveButton, geocodingMap && { opacity: 0.6 }]}
              onPress={handleShowMap}
              disabled={geocodingMap}
            >
              <Text style={styles.saveButtonText}>
                {geocodingMap ? 'Localizando...' : 'Confirmar no mapa'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.mapSection}>
              <Text style={styles.mapHint}>Arraste o pin para ajustar a posição exata</Text>
              {form.latitude && form.longitude ? (
                <View style={styles.mapContainer}>
                  <MapView
                    ref={mapRef}
                    style={styles.map}
                    mapType="hybrid"
                    initialRegion={{
                      latitude: form.latitude,
                      longitude: form.longitude,
                      latitudeDelta: 0.002,
                      longitudeDelta: 0.002,
                    }}
                  >
                    <Marker
                      coordinate={{ latitude: form.latitude, longitude: form.longitude }}
                      draggable
                      onDragEnd={(e) => {
                        const { latitude, longitude } = e.nativeEvent.coordinate;
                        setForm((prev) => ({ ...prev, latitude, longitude }));
                      }}
                    />
                  </MapView>
                </View>
              ) : null}
              <View style={styles.mapButtons}>
                <TouchableOpacity style={styles.mapBackButton} onPress={() => setShowMap(false)}>
                  <Text style={styles.mapBackText}>Corrigir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { flex: 1 }, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        </ScrollView>
      )}

      <Modal visible={showStatePicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o estado</Text>
            <FlatList
              data={ESTADOS_BR}
              keyExtractor={(item) => item}
              numColumns={4}
              contentContainerStyle={{ gap: 6 }}
              columnWrapperStyle={{ gap: 6 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.stateChip,
                    form.state === item && styles.stateChipActive,
                  ]}
                  onPress={() => {
                    setForm((prev) => ({ ...prev, state: item }));
                    setShowStatePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.stateChipText,
                      form.state === item && styles.stateChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

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
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(item)}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
              {!item.isDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(item.id)}
                >
                  <Ionicons name="star-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={36} color={colors.grayLight} />
            <Text style={styles.emptyText}>Nenhum endereco salvo</Text>
            <Text style={styles.emptySubtext}>
              Adicione um endereco ou faca um pedido{'\n'}e ele sera salvo automaticamente
            </Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 56,
    backgroundColor: colors.white,
  },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text },
  form: {
    backgroundColor: colors.white,
    margin: 12,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  formScroll: { maxHeight: '70%' },
  formTitle: { fontSize: fonts.medium, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  formRow: { flexDirection: 'row', gap: 6 },
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
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 12,
  },
  gpsButtonText: { color: colors.white, fontWeight: '600', fontSize: fonts.small },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: { color: colors.white, fontWeight: 'bold', fontSize: fonts.regular },
  list: { padding: 12, paddingBottom: 100 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
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
  cardActions: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateText: {
    fontSize: fonts.small,
    color: colors.text,
  },
  statePlaceholder: {
    fontSize: fonts.small,
    color: colors.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 12,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  stateChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  stateChipActive: {
    backgroundColor: colors.primary,
  },
  stateChipText: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: colors.text,
  },
  stateChipTextActive: {
    color: colors.white,
  },
  mapSection: {
    gap: 6,
  },
  mapHint: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.grayLight,
  },
  map: {
    flex: 1,
  },
  mapButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  mapBackButton: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grayLight,
  },
  mapBackText: {
    fontWeight: '600',
    fontSize: fonts.small,
    color: colors.textLight,
  },
  empty: { alignItems: 'center', marginTop: 60, gap: 6 },
  emptyText: { fontSize: fonts.regular, color: colors.textLight, fontWeight: '600' },
  emptySubtext: { fontSize: fonts.small, color: colors.gray, textAlign: 'center' },
});
