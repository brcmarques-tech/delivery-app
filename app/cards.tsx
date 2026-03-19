import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { LIST_MY_CARDS } from '../src/lib/graphql/queries';
import { SAVE_CARD, DELETE_CARD } from '../src/lib/graphql/mutations';
import { useAlert } from '../src/contexts/AlertContext';

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

function getBrandIcon(brand: string): string {
  const b = (brand || '').toLowerCase();
  if (b.includes('visa')) return 'card';
  if (b.includes('master')) return 'card';
  if (b.includes('elo')) return 'card';
  return 'card-outline';
}

function getBrandColor(brand: string): string {
  const b = (brand || '').toLowerCase();
  if (b.includes('visa')) return '#1a1f71';
  if (b.includes('master')) return '#eb001b';
  if (b.includes('elo')) return '#00a4e0';
  return '#6b7280';
}

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const { alert } = useAlert();
  const { data, loading, refetch, error: fetchError } = useQuery(LIST_MY_CARDS);
  const [saveCardMut, { loading: saving }] = useMutation(SAVE_CARD);
  const [deleteCardMut] = useMutation(DELETE_CARD);

  const [showForm, setShowForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cards = data?.myCards || [];

  function clearErrors(field: string) {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleDeleteCard(cardId: string) {
    alert('Remover Cartao', 'Tem certeza que deseja remover este cartao?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCardMut({ variables: { cardId } });
            refetch();
          } catch (err: any) {
            const msg = err.message?.includes('network') ? 'Sem conexao com a internet.' : err.message || 'Nao foi possivel remover o cartao.';
            alert('Erro', msg);
          }
        },
      },
    ]);
  }

  async function handleSaveCard() {
    const e: Record<string, string> = {};
    const digits = cardNumber.replace(/\D/g, '');

    if (digits.length < 13) e.cardNumber = 'Numero do cartao invalido';
    if (!holderName.trim()) e.holderName = 'Informe o nome do titular';
    const expiryParts = expiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      e.expiry = 'Validade invalida';
    } else {
      const month = parseInt(expiryParts[0]);
      if (month < 1 || month > 12) e.expiry = 'Mes invalido';
    }
    if (cvv.length < 3) e.cvv = 'CVV invalido';

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (!PAGARME_PUBLIC_KEY) {
      alert('Erro de Configuracao', 'Sistema de pagamento nao configurado. Entre em contato com o suporte.');
      return;
    }

    try {
      const tokenResponse = await fetch(
        `https://api.pagar.me/core/v5/tokens?appId=${PAGARME_PUBLIC_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'card',
            card: {
              number: digits,
              holder_name: holderName.trim().toUpperCase(),
              exp_month: parseInt(expiryParts[0]),
              exp_year: parseInt('20' + expiryParts[1]),
              cvv,
            },
          }),
        },
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        if (tokenResponse.status === 400) {
          throw new Error('Dados do cartao invalidos. Verifique o numero, validade e CVV.');
        }
        throw new Error(errorData.message || 'Erro ao processar cartao. Tente novamente.');
      }

      const tokenData = await tokenResponse.json();
      await saveCardMut({ variables: { token: tokenData.id } });
      refetch();

      setCardNumber('');
      setHolderName('');
      setExpiry('');
      setCvv('');
      setErrors({});
      setShowForm(false);

      alert('Cartao Salvo', 'Seu cartao foi adicionado com sucesso!');
    } catch (err: any) {
      let msg = 'Nao foi possivel salvar o cartao. Tente novamente.';
      if (err.message?.includes('network') || err.message?.includes('Network')) msg = 'Sem conexao com a internet. Verifique e tente novamente.';
      else if (err.message) msg = err.message;
      alert('Erro', msg);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: themeColors.card, borderBottomColor: themeColors.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Meus Cartoes</Text>
        <TouchableOpacity onPress={() => { setShowForm(!showForm); setErrors({}); }}>
          <Ionicons name={showForm ? 'close' : 'add-circle-outline'} size={24} color="#f97316" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Ionicons name="card" size={20} color="#f97316" />
            <Text style={[styles.formTitle, { color: themeColors.text }]}>Novo Cartao</Text>
          </View>

          <View>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: errors.cardNumber ? '#ef4444' : themeColors.border }]}
              placeholder="Numero do cartao"
              placeholderTextColor={themeColors.textSecondary}
              keyboardType="numeric"
              value={cardNumber}
              onChangeText={(t) => { setCardNumber(formatCardNumber(t)); clearErrors('cardNumber'); }}
              maxLength={19}
            />
            {errors.cardNumber && <Text style={styles.fieldError}>{errors.cardNumber}</Text>}
          </View>

          <View>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: errors.holderName ? '#ef4444' : themeColors.border }]}
              placeholder="Nome do titular (como no cartao)"
              placeholderTextColor={themeColors.textSecondary}
              autoCapitalize="characters"
              value={holderName}
              onChangeText={(t) => { setHolderName(t); clearErrors('holderName'); }}
            />
            {errors.holderName && <Text style={styles.fieldError}>{errors.holderName}</Text>}
          </View>

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: errors.expiry ? '#ef4444' : themeColors.border }]}
                placeholder="MM/AA"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="numeric"
                value={expiry}
                onChangeText={(t) => { setExpiry(formatExpiry(t)); clearErrors('expiry'); }}
                maxLength={5}
              />
              {errors.expiry && <Text style={styles.fieldError}>{errors.expiry}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: errors.cvv ? '#ef4444' : themeColors.border }]}
                placeholder="CVV"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="numeric"
                secureTextEntry
                value={cvv}
                onChangeText={(t) => { setCvv(t.replace(/\D/g, '').substring(0, 4)); clearErrors('cvv'); }}
                maxLength={4}
              />
              {errors.cvv && <Text style={styles.fieldError}>{errors.cvv}</Text>}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.5 }]}
            onPress={handleSaveCard}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={16} color="#fff" />
                <Text style={styles.saveButtonText}>Salvar cartao</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Ionicons name="shield-checkmark" size={12} color={themeColors.textSecondary} />
            <Text style={{ fontSize: 11, color: themeColors.textSecondary }}>Seus dados sao criptografados e protegidos</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={{ color: themeColors.textSecondary, marginTop: 12, fontSize: 14 }}>Carregando cartoes...</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={themeColors.textSecondary} />
          <Text style={{ color: themeColors.textSecondary, marginTop: 12, fontSize: 14, textAlign: 'center' }}>
            Nao foi possivel carregar seus cartoes.{'\n'}Verifique sua conexao.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: themeColors.border }]}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={16} color="#f97316" />
            <Text style={{ color: '#f97316', fontWeight: '600', fontSize: 14 }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          renderItem={({ item }: { item: any }) => (
            <View style={[styles.cardItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={[styles.cardIconBg, { backgroundColor: getBrandColor(item.brand) + '15' }]}>
                <Ionicons name={getBrandIcon(item.brand) as any} size={22} color={getBrandColor(item.brand)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardBrand, { color: themeColors.text }]}>
                  {(item.brand || 'Cartao').charAt(0).toUpperCase() + (item.brand || 'cartao').slice(1)} **** {item.lastFourDigits}
                </Text>
                {item.holderName && (
                  <Text style={[styles.cardHolder, { color: themeColors.textSecondary }]}>{item.holderName}</Text>
                )}
                {item.expMonth && item.expYear && (
                  <Text style={[styles.cardExpiry, { color: themeColors.textSecondary }]}>
                    Validade: {String(item.expMonth).padStart(2, '0')}/{item.expYear}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteCard(item.id)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            !showForm ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#431407' : '#fff7ed' }]}>
                  <Ionicons name="card-outline" size={40} color="#f97316" />
                </View>
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>Nenhum cartao salvo</Text>
                <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
                  Adicione um cartao para facilitar seus pagamentos
                </Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
                  <Ionicons name="add" size={20} color="#fff" />
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  formCard: {
    margin: 16, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1,
  },
  formTitle: { fontSize: 16, fontWeight: '600' },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14,
  },
  formRow: { flexDirection: 'row', gap: 12 },
  saveButton: {
    backgroundColor: '#f97316', borderRadius: 12, padding: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  fieldError: { fontSize: 11, color: '#ef4444', marginTop: 3 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  retryBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 16,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  list: { padding: 16, gap: 12 },
  cardItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 16, borderWidth: 1,
  },
  cardIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardBrand: { fontSize: 14, fontWeight: '600' },
  cardHolder: { fontSize: 12, marginTop: 2 },
  cardExpiry: { fontSize: 11, marginTop: 2 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f97316', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 4,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
