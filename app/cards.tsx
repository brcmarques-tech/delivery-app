import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIST_MY_CARDS } from '../src/lib/graphql/queries';
import { SAVE_CARD, DELETE_CARD } from '../src/lib/graphql/mutations';
import { useAlert } from '../src/contexts/AlertContext';
import { colors, fonts } from '../src/theme';

const PAGARME_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAGARME_PUBLIC_KEY || '';

function formatCardNumber(text: string) {
  const digits = text.replace(/\D/g, '').substring(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(text: string) {
  const digits = text.replace(/\D/g, '').substring(0, 4);
  if (digits.length > 2) return digits.substring(0, 2) + '/' + digits.substring(2);
  return digits;
}

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const { alert } = useAlert();
  const { data, loading, refetch } = useQuery(LIST_MY_CARDS);
  const [saveCardMut, { loading: saving }] = useMutation(SAVE_CARD);
  const [deleteCardMut] = useMutation(DELETE_CARD);

  const [showForm, setShowForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const cards = data?.myCards || [];

  async function handleDeleteCard(cardId: string) {
    alert('Remover cartao', 'Tem certeza que deseja remover este cartao?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCardMut({ variables: { cardId } });
            refetch();
          } catch (err: any) {
            alert('Erro', err.message || 'Nao foi possivel remover o cartao');
          }
        },
      },
    ]);
  }

  async function handleSaveCard() {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13) {
      alert('Erro', 'Numero do cartao invalido');
      return;
    }
    if (!holderName.trim()) {
      alert('Erro', 'Informe o nome do titular');
      return;
    }
    const expiryParts = expiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      alert('Erro', 'Validade invalida (MM/AA)');
      return;
    }
    if (cvv.length < 3) {
      alert('Erro', 'CVV invalido');
      return;
    }

    if (!PAGARME_PUBLIC_KEY) {
      alert('Erro', 'Chave publica do Pagar.me nao configurada');
      return;
    }

    try {
      // Tokenize card via Pagar.me public API
      const tokenResponse = await fetch(
        `https://api.pagar.me/core/v5/tokens?appId=${PAGARME_PUBLIC_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'card',
            card: {
              number: digits,
              holder_name: holderName.trim(),
              exp_month: parseInt(expiryParts[0]),
              exp_year: parseInt('20' + expiryParts[1]),
              cvv,
            },
          }),
        },
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao tokenizar cartao');
      }

      const tokenData = await tokenResponse.json();

      // Save card via GraphQL
      await saveCardMut({ variables: { token: tokenData.id } });
      refetch();

      // Reset form
      setCardNumber('');
      setHolderName('');
      setExpiry('');
      setCvv('');
      setShowForm(false);

      alert('Sucesso', 'Cartao salvo com sucesso!');
    } catch (err: any) {
      alert('Erro', err.message || 'Nao foi possivel salvar o cartao');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Meus Cartoes</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Adicionar cartao</Text>
          <TextInput
            style={styles.input}
            placeholder="Numero do cartao"
            placeholderTextColor={colors.gray}
            keyboardType="numeric"
            value={cardNumber}
            onChangeText={(t) => setCardNumber(formatCardNumber(t))}
            maxLength={19}
          />
          <TextInput
            style={styles.input}
            placeholder="Nome do titular"
            placeholderTextColor={colors.gray}
            autoCapitalize="characters"
            value={holderName}
            onChangeText={setHolderName}
          />
          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="MM/AA"
              placeholderTextColor={colors.gray}
              keyboardType="numeric"
              value={expiry}
              onChangeText={(t) => setExpiry(formatExpiry(t))}
              maxLength={5}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="CVV"
              placeholderTextColor={colors.gray}
              keyboardType="numeric"
              secureTextEntry
              value={cvv}
              onChangeText={(t) => setCvv(t.replace(/\D/g, '').substring(0, 4))}
              maxLength={4}
            />
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSaveCard}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Salvar cartao</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.cardItem}>
              <Ionicons name="card" size={28} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardBrand}>
                  {item.brand} •••• {item.lastFourDigits}
                </Text>
                {item.holderName && (
                  <Text style={styles.cardHolder}>{item.holderName}</Text>
                )}
                {item.expMonth && item.expYear && (
                  <Text style={styles.cardExpiry}>
                    Validade: {String(item.expMonth).padStart(2, '0')}/{item.expYear}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDeleteCard(item.id)}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            !showForm ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="card-outline" size={64} color={colors.grayLight} />
                <Text style={styles.emptyText}>Nenhum cartao salvo</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowForm(true)}
                >
                  <Ionicons name="add" size={20} color={colors.white} />
                  <Text style={styles.addButtonText}>Adicionar cartao</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 56,
    backgroundColor: colors.white,
  },
  title: { fontSize: fonts.xlarge, fontWeight: 'bold', color: colors.text },
  formCard: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  formTitle: { fontSize: fonts.large, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: fonts.regular,
    color: colors.text,
  },
  formRow: { flexDirection: 'row', gap: 12 },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: { color: colors.white, fontSize: fonts.regular, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
  },
  cardBrand: { fontSize: fonts.regular, fontWeight: '600', color: colors.text },
  cardHolder: { fontSize: fonts.small, color: colors.textLight, marginTop: 2 },
  cardExpiry: { fontSize: fonts.small, color: colors.gray, marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyText: { fontSize: fonts.large, color: colors.textLight },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  addButtonText: { color: colors.white, fontWeight: 'bold', fontSize: fonts.regular },
});
