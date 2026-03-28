import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { fonts } from '../../src/theme';
import { REQUEST_QUOTE } from '../../src/lib/graphql/mutations';

export default function RequestQuoteScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { alert } = useAlert();
  const { storeId, serviceId, serviceName } = useLocalSearchParams<{
    storeId: string;
    serviceId: string;
    serviceName: string;
  }>();

  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  const [requestQuote, { loading }] = useMutation(REQUEST_QUOTE);

  async function handleSubmit() {
    if (!description.trim()) {
      alert('Atenção', 'Descreva o que você precisa.');
      return;
    }
    try {
      await requestQuote({
        variables: {
          input: {
            storeId,
            serviceId,
            description: description.trim(),
            address: address.trim() || undefined,
          },
        },
      });
      alert('Orcamento solicitado!', 'Voce sera notificado quando o prestador responder.');
      router.back();
    } catch (err: any) {
      alert('Erro', err?.message || 'Nao foi possivel solicitar. Tente novamente.');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Solicitar orcamento</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.serviceCard, { backgroundColor: colors.card }]}>
          <Ionicons name="construct-outline" size={20} color={colors.primary} />
          <Text style={[styles.serviceName, { color: colors.text }]}>{serviceName}</Text>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Descreva o que voce precisa</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.grayLight }]}
          placeholder="Ex: Preciso cortar o cabelo e fazer a barba..."
          placeholderTextColor={colors.gray}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
        />

        <Text style={[styles.label, { color: colors.text }]}>Endereco (opcional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.grayLight }]}
          placeholder="Se o prestador precisa ir ate voce"
          placeholderTextColor={colors.gray}
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }, !description.trim() && { opacity: 0.4 }]}
          onPress={handleSubmit}
          disabled={loading || !description.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={styles.submitText}>Enviar solicitacao</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: fonts.xlarge, fontWeight: 'bold' },
  content: { padding: 12, flex: 1 },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  serviceName: { fontSize: fonts.regular, fontWeight: '600' },
  label: { fontSize: fonts.regular, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.regular,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.regular,
  },
  footer: { padding: 12 },
  submitBtn: {
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: { color: '#fff', fontSize: fonts.large, fontWeight: 'bold' },
});
