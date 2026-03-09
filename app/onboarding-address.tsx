import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CREATE_ADDRESS } from '../src/lib/graphql/mutations';
import { useAlert } from '../src/contexts/AlertContext';
import { colors, fonts } from '../src/theme';

export default function OnboardingAddressScreen() {
  const [createAddress] = useMutation(CREATE_ADDRESS);
  const { alert } = useAlert();

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
        setForm((prev) => ({
          ...prev,
          street: r.street || prev.street,
          number: r.streetNumber || prev.number,
          neighborhood: r.district || r.subregion || prev.neighborhood,
          city: r.city || prev.city,
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="location" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Onde voce esta?</Text>
        <Text style={styles.subtitle}>
          Cadastre seu endereco principal para{'\n'}encontrar as melhores lojas perto de voce
        </Text>
      </View>

      <TouchableOpacity style={styles.gpsButton} onPress={handleGetLocation} disabled={locating}>
        {locating ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Ionicons name="navigate" size={20} color={colors.white} />
            <Text style={styles.gpsButtonText}>Usar minha localizacao atual</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou preencha manualmente</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.form}>
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
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Salvando...' : 'Salvar e continuar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Pular por enquanto</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: fonts.title,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
  },
  gpsButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fonts.regular,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.grayLight,
  },
  dividerText: {
    fontSize: fonts.small,
    color: colors.gray,
  },
  form: { gap: 12 },
  formRow: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: fonts.regular,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: fonts.large,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
  },
  skipText: {
    color: colors.textLight,
    fontSize: fonts.regular,
  },
});
