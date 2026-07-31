import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

let MapView: any = View;
let Marker: any = View;
let PROVIDER_GOOGLE: any = undefined;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CREATE_ADDRESS } from '../src/lib/graphql/mutations';
import { devLog } from '../src/lib/devLog';
import { useAlert } from '../src/contexts/AlertContext';
import { fonts } from '../src/theme';
import { useTheme } from '../src/contexts/ThemeContext';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export default function OnboardingAddressScreen() {
  const { colors } = useTheme();
  const [createAddress] = useMutation(CREATE_ADDRESS);
  const { alert } = useAlert();

  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [geocodingMap, setGeocodingMap] = useState(false);
  // KAN-255: MapView aqui e um VALOR (`let MapView: any = View`), nao um tipo.
  const mapRef = useRef<any>(null);
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
        // Perf/PII (F7): era console.log cru — rodava em producao serializando o
        // endereco completo do usuario. devLog e no-op fora de dev (KAN-223).
        devLog('Reverse geocode result:', JSON.stringify(r, null, 2));

        // Android/iOS retornam campos diferentes:
        // city pode vir em r.city, r.subregion ou r.region
        // bairro pode vir em r.district, r.subregion ou r.name
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
            isDefault: true,
          },
        },
      });

      await AsyncStorage.setItem('onboardingDone', 'true');
      router.replace('/(tabs)/home');
    } catch (err: any) {
      alert('Erro', err.message || 'Nao foi possivel salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    await AsyncStorage.setItem('onboardingDone', 'true');
    router.replace('/(tabs)/home');
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.white }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="location" size={26} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Onde voce esta?</Text>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>
          Cadastre seu endereco principal para{'\n'}encontrar as melhores lojas perto de voce
        </Text>
      </View>

      <TouchableOpacity style={[styles.gpsButton, { backgroundColor: '#FF6B00' }]} onPress={handleGetLocation} disabled={locating}>
        {locating ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.gpsButtonText}>Usar minha localizacao atual</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.grayLight }]} />
        <Text style={[styles.dividerText, { color: colors.gray }]}>ou preencha manualmente</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.grayLight }]} />
      </View>

      <View style={styles.form}>
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.background, color: colors.text }]}
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
            style={[styles.input, { flex: 2, backgroundColor: colors.background, color: colors.text }]}
            placeholder="Rua *"
            placeholderTextColor={colors.gray}
            value={form.street}
            onChangeText={(v) => setForm({ ...form, street: v })}
          />
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: colors.background, color: colors.text }]}
            placeholder="Numero *"
            placeholderTextColor={colors.gray}
            value={form.number}
            onChangeText={(v) => setForm({ ...form, number: v })}
          />
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          placeholder="Complemento"
          placeholderTextColor={colors.gray}
          value={form.complement}
          onChangeText={(v) => setForm({ ...form, complement: v })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          placeholder="Bairro *"
          placeholderTextColor={colors.gray}
          value={form.neighborhood}
          onChangeText={(v) => setForm({ ...form, neighborhood: v })}
        />
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, { flex: 2, backgroundColor: colors.background, color: colors.text }]}
            placeholder="Cidade *"
            placeholderTextColor={colors.gray}
            value={form.city}
            onChangeText={(v) => setForm({ ...form, city: v })}
          />
          <TouchableOpacity
            style={[styles.input, styles.stateSelector, { flex: 1, backgroundColor: colors.background }]}
            onPress={() => setShowStatePicker(true)}
          >
            <Text style={form.state ? [styles.stateText, { color: colors.text }] : [styles.statePlaceholder, { color: colors.gray }]}>
              {form.state || 'UF *'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.gray} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showStatePicker} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatePicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Selecione o estado</Text>
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
                    { backgroundColor: colors.background },
                    form.state === item && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    setForm((prev) => ({ ...prev, state: item }));
                    setShowStatePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.stateChipText,
                      { color: colors.text },
                      form.state === item && { color: '#fff' },
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

      {!showMap ? (
        <>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: '#FF6B00' }, geocodingMap && { opacity: 0.6 }]}
            onPress={handleShowMap}
            disabled={geocodingMap}
          >
            <Text style={styles.saveButtonText}>
              {geocodingMap ? 'Localizando...' : 'Confirmar no mapa'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textLight }]}>Pular por enquanto</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.mapSection}>
          <Text style={[styles.mapTitle, { color: colors.text }]}>Confirme a localização</Text>
          <Text style={[styles.mapAddress, { color: colors.textLight }]}>
            {form.street}, {form.number} — {form.neighborhood}, {form.city}/{form.state}
          </Text>
          <Text style={[styles.mapHint, { color: colors.primary }]}>Arraste o pin para ajustar a posição exata</Text>

          {form.latitude && form.longitude ? (
            <View style={[styles.mapContainer, { backgroundColor: colors.grayLight }]}>
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
                  onDragEnd={(e: any) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    setForm((prev) => ({ ...prev, latitude, longitude }));
                  }}
                />
              </MapView>
            </View>
          ) : (
            <View style={[styles.mapContainer, { backgroundColor: colors.grayLight, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: colors.textLight }}>Não foi possível localizar o endereço</Text>
            </View>
          )}

          <View style={styles.mapButtons}>
            <TouchableOpacity
              style={[styles.mapBackButton, { borderColor: colors.grayLight }]}
              onPress={() => setShowMap(false)}
            >
              <Text style={[styles.mapBackButtonText, { color: colors.textLight }]}>Corrigir endereço</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { flex: 1, backgroundColor: '#FF6B00' }, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Salvando...' : 'Confirmar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: fonts.title,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.regular,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    padding: 12,
  },
  gpsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fonts.regular,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: fonts.small,
  },
  form: { gap: 6 },
  formRow: { flexDirection: 'row', gap: 6 },
  input: {
    borderRadius: 10,
    padding: 10,
    fontSize: fonts.regular,
  },
  saveButton: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fonts.large,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
  },
  skipText: {
    fontSize: fonts.regular,
  },
  stateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateText: {
    fontSize: fonts.regular,
  },
  statePlaceholder: {
    fontSize: fonts.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 12,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  stateChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  stateChipText: {
    fontSize: fonts.regular,
    fontWeight: '600',
  },
  mapSection: {
    marginTop: 12,
    gap: 6,
  },
  mapTitle: {
    fontSize: fonts.large,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mapAddress: {
    fontSize: fonts.small,
    textAlign: 'center',
  },
  mapHint: {
    fontSize: fonts.regular,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  mapContainer: {
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  mapBackButton: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  mapBackButtonText: {
    fontWeight: 'bold',
    fontSize: fonts.regular,
  },
});
