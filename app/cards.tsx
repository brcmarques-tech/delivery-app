import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { LIST_MY_CARDS } from '../src/lib/graphql/queries';
import { SAVE_CARD, DELETE_CARD } from '../src/lib/graphql/mutations';
import { useAlert } from '../src/contexts/AlertContext';

const PAGARME_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAGARME_PUBLIC_KEY || '';

// H3: Warn in dev if public key is not configured
if (__DEV__ && !PAGARME_PUBLIC_KEY) console.warn('[PAYMENT] EXPO_PUBLIC_PAGARME_PUBLIC_KEY nao configurada');

function luhnCheck(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function isExpired(month: number, year: number): boolean {
  const now = new Date();
  const expDate = new Date(year, month, 0); // last day of exp month
  return expDate < now;
}

function detectBrand(number: string): string {
  const d = number.replace(/\D/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'Mastercard';
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(d)) return 'Elo';
  return '';
}

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

  // H2: Double-tap prevention ref for save card
  const submittingRef = useRef(false);

  const [showForm, setShowForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  // L2: CVV held in component state is standard practice for card forms;
  // it's never persisted and cleared on navigation (see L3 below).
  const [cvv, setCvv] = useState('');

  // L3/L9: Clear sensitive card form fields when navigating away
  useFocusEffect(
    useCallback(() => {
      return () => {
        setCvv('');
        setCardNumber('');
        setHolderName('');
        setExpiry('');
      };
    }, [])
  );
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cards = data?.myCards || [];

  function clearErrors(field: string) {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
      }
    } catch { /* ignore */ }
    setLoadingCep(false);
  }

  function formatCep(text: string) {
    const digits = text.replace(/\D/g, '').substring(0, 8);
    if (digits.length > 5) return digits.substring(0, 5) + '-' + digits.substring(5);
    return digits;
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
    // H2: Double-tap prevention
    if (submittingRef.current) return;
    submittingRef.current = true;

    const e: Record<string, string> = {};
    const digits = cardNumber.replace(/\D/g, '');

    if (digits.length < 13) {
      e.cardNumber = 'Numero do cartao invalido';
    } else if (!luhnCheck(digits)) {
      e.cardNumber = 'Numero do cartao invalido. Verifique os digitos.';
    }
    if (!holderName.trim()) e.holderName = 'Informe o nome do titular';
    const expiryParts = expiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      e.expiry = 'Validade invalida';
    } else {
      const month = parseInt(expiryParts[0]);
      const year = parseInt('20' + expiryParts[1]);
      if (month < 1 || month > 12) e.expiry = 'Mes invalido';
      else if (isExpired(month, year)) e.expiry = 'Cartao vencido';
    }
    if (cvv.length < 3) e.cvv = 'CVV invalido';
    if (zipCode.replace(/\D/g, '').length !== 8) e.zipCode = 'CEP invalido';
    if (!street.trim()) e.street = 'Informe a rua';
    if (!streetNumber.trim()) e.streetNumber = 'Informe o numero';
    if (!neighborhood.trim()) e.neighborhood = 'Informe o bairro';
    if (!city.trim()) e.city = 'Informe a cidade';
    if (!state.trim() || state.trim().length !== 2) e.state = 'UF invalido';

    setErrors(e);
    if (Object.keys(e).length > 0) { submittingRef.current = false; return; }

    if (!PAGARME_PUBLIC_KEY) {
      alert('Erro de Configuracao', 'Sistema de pagamento nao configurado. Entre em contato com o suporte.');
      submittingRef.current = false;
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
              billing_address: {
                line_1: `${streetNumber.trim()}, ${street.trim()}, ${neighborhood.trim()}`,
                zip_code: zipCode.replace(/\D/g, ''),
                city: city.trim(),
                state: state.trim().toUpperCase(),
                country: 'BR',
              },
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
      setZipCode('');
      setStreet('');
      setStreetNumber('');
      setNeighborhood('');
      setCity('');
      setState('');
      setErrors({});
      setShowForm(false);

      alert('Cartao Salvo', 'Seu cartao foi adicionado com sucesso!');
    } catch (err: any) {
      let msg = 'Nao foi possivel salvar o cartao. Tente novamente.';
      if (err.message?.includes('network') || err.message?.includes('Network')) msg = 'Sem conexao com a internet. Verifique e tente novamente.';
      else if (err.message) msg = err.message;
      alert('Erro', msg);
    } finally {
      submittingRef.current = false;
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
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
              {!errors.cardNumber && detectBrand(cardNumber) ? (
                <Text style={{ fontSize: 11, color: getBrandColor(detectBrand(cardNumber)), marginTop: 3, fontWeight: '600' }}>
                  {detectBrand(cardNumber)}
                </Text>
              ) : null}
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

            <View style={{ marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="home" size={18} color="#f97316" />
                <Text style={[styles.formTitle, { color: themeColors.text }]}>Endereco de cobranca</Text>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: errors.zipCode ? '#ef4444' : themeColors.border }]}
                    placeholder="CEP"
                    placeholderTextColor={themeColors.textSecondary}
                    keyboardType="numeric"
                    value={zipCode}
                    onChangeText={(t) => {
                      const formatted = formatCep(t);
                      setZipCode(formatted);
                      clearErrors('zipCode');
                      if (formatted.replace(/\D/g, '').length === 8) lookupCep(formatted);
                    }}
                    maxLength={9}
                  />
                  {errors.zipCode && <Text style={styles.fieldError}>{errors.zipCode}</Text>}
                  {loadingCep && <ActivityIndicator size="small" color="#f97316" style={{ position: 'absolute', right: 12, top: 12 }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: errors.state ? '#ef4444' : themeColors.border }]}
                    placeholder="UF"
                    placeholderTextColor={themeColors.textSecondary}
                    autoCapitalize="characters"
                    value={state}
                    onChangeText={(t) => { setState(t.substring(0, 2)); clearErrors('state'); }}
                    maxLength={2}
                  />
                  {errors.state && <Text style={styles.fieldError}>{errors.state}</Text>}
                </View>
              </View>

              <View>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: errors.street ? '#ef4444' : themeColors.border, marginTop: 12 }]}
                  placeholder="Rua"
                  placeholderTextColor={themeColors.textSecondary}
                  value={street}
                  onChangeText={(t) => { setStreet(t); clearErrors('street'); }}
                />
                {errors.street && <Text style={styles.fieldError}>{errors.street}</Text>}
              </View>

              <View style={[styles.formRow, { marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: errors.streetNumber ? '#ef4444' : themeColors.border }]}
                    placeholder="Numero"
                    placeholderTextColor={themeColors.textSecondary}
                    value={streetNumber}
                    onChangeText={(t) => { setStreetNumber(t); clearErrors('streetNumber'); }}
                  />
                  {errors.streetNumber && <Text style={styles.fieldError}>{errors.streetNumber}</Text>}
                </View>
                <View style={{ flex: 2 }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: errors.neighborhood ? '#ef4444' : themeColors.border }]}
                    placeholder="Bairro"
                    placeholderTextColor={themeColors.textSecondary}
                    value={neighborhood}
                    onChangeText={(t) => { setNeighborhood(t); clearErrors('neighborhood'); }}
                  />
                  {errors.neighborhood && <Text style={styles.fieldError}>{errors.neighborhood}</Text>}
                </View>
              </View>

              <View>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.inputBg, color: themeColors.text, borderColor: errors.city ? '#ef4444' : themeColors.border, marginTop: 12 }]}
                  placeholder="Cidade"
                  placeholderTextColor={themeColors.textSecondary}
                  value={city}
                  onChangeText={(t) => { setCity(t); clearErrors('city'); }}
                />
                {errors.city && <Text style={styles.fieldError}>{errors.city}</Text>}
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
        </ScrollView>
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
