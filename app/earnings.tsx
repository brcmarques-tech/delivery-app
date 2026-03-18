import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { useTheme } from '../src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MY_BALANCE, SIMULATE_ANTICIPATION } from '../src/lib/graphql/queries';
import { GET_ME } from '../src/lib/graphql/queries';
import { REGISTER_RECIPIENT, REQUEST_ANTICIPATION, DISCONNECT_PAYMENT } from '../src/lib/graphql/mutations';

const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Econômica' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú' },
  { code: '260', name: 'Nubank' },
  { code: '077', name: 'Inter' },
  { code: '336', name: 'C6 Bank' },
  { code: '290', name: 'PagBank' },
  { code: '380', name: 'PicPay' },
  { code: '212', name: 'Banco Original' },
  { code: '756', name: 'Sicoob' },
  { code: '748', name: 'Sicredi' },
  { code: '422', name: 'Safra' },
  { code: '070', name: 'BRB' },
  { code: '655', name: 'Neon' },
];

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function EarningsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: meData, loading: loadingMe, refetch: refetchMe } = useQuery(GET_ME, { fetchPolicy: 'network-only' });
  const paymentConnected = meData?.meApp?.paymentConnected ?? false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Recebimentos</Text>
        <View style={{ width: 24 }} />
      </View>

      {loadingMe ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : paymentConnected ? (
        <EarningsDashboard colors={colors} refetchMe={refetchMe} />
      ) : (
        <RecipientForm colors={colors} onSuccess={refetchMe} />
      )}
    </View>
  );
}

// ===== EARNINGS DASHBOARD =====
function EarningsDashboard({ colors, refetchMe }: { colors: any; refetchMe: () => void }) {
  const { data: balanceData, loading } = useQuery(MY_BALANCE, { fetchPolicy: 'network-only' });
  const { data: simData } = useQuery(SIMULATE_ANTICIPATION, { fetchPolicy: 'network-only' });
  const [requestAnticipation, { loading: requesting }] = useMutation(REQUEST_ANTICIPATION);
  const [disconnectPayment] = useMutation(DISCONNECT_PAYMENT);

  const balance = balanceData?.myBalance;
  const sim = simData?.simulateAnticipation;

  async function handleAnticipate() {
    Alert.alert(
      'Confirmar Antecipacao',
      `Voce perdera R$ ${sim?.fee?.toFixed(2) || '0.00'} em taxas. Deseja continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const { data } = await requestAnticipation();
              const r = data.requestAnticipation;
              Alert.alert('Sucesso', `Antecipacao solicitada! Valor: R$ ${r.approvedAmount?.toFixed(2)}. Taxa: R$ ${r.fee?.toFixed(2)}.`);
            } catch (err: any) {
              Alert.alert('Erro', err.message);
            }
          },
        },
      ],
    );
  }

  async function handleDisconnect() {
    Alert.alert('Desconectar', 'Tem certeza que deseja remover seus dados bancarios?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desconectar',
        style: 'destructive',
        onPress: async () => {
          try {
            await disconnectPayment();
            refetchMe();
          } catch (err: any) {
            Alert.alert('Erro', err.message);
          }
        },
      },
    ]);
  }

  if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Balance Cards */}
      <View style={{ gap: 12, marginBottom: 24 }}>
        <View style={[styles.balanceCard, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}>
          <Text style={{ fontSize: 13, color: '#166534' }}>Disponivel para saque</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#166534' }}>R$ {(balance?.availableAmount || 0).toFixed(2)}</Text>
        </View>
        <View style={[styles.balanceCard, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
          <Text style={{ fontSize: 13, color: '#9a3412' }}>A receber</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#9a3412' }}>R$ {(balance?.waitingFundsAmount || 0).toFixed(2)}</Text>
        </View>
        <View style={[styles.balanceCard, { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' }]}>
          <Text style={{ fontSize: 13, color: '#1e40af' }}>Ja transferido</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1e40af' }}>R$ {(balance?.transferredAmount || 0).toFixed(2)}</Text>
        </View>
      </View>

      {/* Anticipation */}
      {(balance?.waitingFundsAmount || 0) > 0 && sim && sim.originalAmount > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Antecipar Recebiveis</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
            Receba seus valores pendentes agora, com uma taxa de juros.
          </Text>

          <View style={{ gap: 6, marginBottom: 16 }}>
            <View style={styles.simRow}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Valor pendente:</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>R$ {sim.originalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.simRow}>
              <Text style={{ fontSize: 13, color: '#dc2626' }}>Taxa (~{sim.feePercentage}%):</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#dc2626' }}>- R$ {sim.fee.toFixed(2)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.simRow}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#16a34a' }}>Voce receberia:</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#16a34a' }}>R$ {sim.anticipatedAmount.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { opacity: requesting ? 0.5 : 1 }]}
            onPress={handleAnticipate}
            disabled={requesting}
          >
            <Text style={styles.primaryBtnText}>{requesting ? 'Processando...' : 'Quero Antecipar'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* How it works */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Como funciona?</Text>
        <View style={{ gap: 12 }}>
          <View style={styles.infoRow}>
            <Text style={{ fontSize: 20 }}>💳</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>Cartao de credito</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Disponivel em 30 dias. Com antecipacao, ~2 dias (com taxa).</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={{ fontSize: 20 }}>📱</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>PIX</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Disponivel em 2 dias uteis (D+2).</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={{ fontSize: 20 }}>🏦</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>Transferencia automatica</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Quando disponivel, transfere automaticamente todo dia.</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Disconnect */}
      <TouchableOpacity style={{ alignSelf: 'center', marginTop: 16 }} onPress={handleDisconnect}>
        <Text style={{ fontSize: 13, color: '#dc2626' }}>Desconectar dados bancarios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ===== RECIPIENT FORM =====
function RecipientForm({ colors, onSuccess }: { colors: any; onSuccess: () => void }) {
  const [registerRecipient, { loading }] = useMutation(REGISTER_RECIPIENT);
  const [step, setStep] = useState(0); // 0=personal, 1=address, 2=bank
  const [form, setForm] = useState({
    name: '', email: '', document: '', birthdate: '',
    monthlyIncome: '', professionalOccupation: '', motherName: '',
    phoneDdd: '', phoneNumber: '',
    street: '', streetNumber: '', neighborhood: '', city: '', state: '', zipCode: '', complementary: '',
    bank: '', branchNumber: '', branchCheckDigit: '', accountNumber: '', accountCheckDigit: '',
    accountType: 'checking', holderName: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    const recipientData = {
      name: form.name, email: form.email,
      document: form.document.replace(/\D/g, ''),
      type: 'individual' as const,
      birthdate: form.birthdate,
      monthlyIncome: parseInt(form.monthlyIncome) || 1000,
      professionalOccupation: form.professionalOccupation || 'Entregador',
      motherName: form.motherName,
      phone: { ddd: form.phoneDdd, number: form.phoneNumber },
      address: {
        street: form.street, streetNumber: form.streetNumber,
        neighborhood: form.neighborhood, city: form.city,
        state: form.state, zipCode: form.zipCode.replace(/\D/g, ''),
        complementary: form.complementary,
      },
      bankAccount: {
        holderName: form.holderName || form.name,
        bank: form.bank, branchNumber: form.branchNumber,
        branchCheckDigit: form.branchCheckDigit || undefined,
        accountNumber: form.accountNumber,
        accountCheckDigit: form.accountCheckDigit,
        type: form.accountType,
      },
    };

    try {
      await registerRecipient({ variables: { recipientData: JSON.stringify(recipientData) } });
      Alert.alert('Sucesso', 'Dados bancarios cadastrados com sucesso!');
      onSuccess();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao cadastrar dados bancarios');
    }
  }

  const inputStyle = [styles.input, { backgroundColor: colors.inputBg || colors.card, borderColor: colors.border, color: colors.text }];
  const labelStyle = [styles.label, { color: colors.textSecondary }];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
          Para receber pagamentos das suas entregas, cadastre seus dados abaixo.
        </Text>

        {/* Step indicator */}
        <View style={styles.steps}>
          {['Dados Pessoais', 'Endereco', 'Conta Bancaria'].map((label, i) => (
            <TouchableOpacity key={i} onPress={() => setStep(i)} style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: step === i ? '#f97316' : colors.border }]}>
                <Text style={{ fontSize: 12, color: step === i ? '#fff' : colors.textSecondary, fontWeight: 'bold' }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 10, color: step === i ? '#f97316' : colors.textSecondary, fontWeight: step === i ? '600' : 'normal' }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 0: Personal */}
        {step === 0 && (
          <View style={{ gap: 12 }}>
            <View>
              <Text style={labelStyle}>Nome Completo *</Text>
              <TextInput style={inputStyle} value={form.name} onChangeText={(v) => set('name', v)} placeholderTextColor={colors.textSecondary} />
            </View>
            <View>
              <Text style={labelStyle}>Email *</Text>
              <TextInput style={inputStyle} value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textSecondary} />
            </View>
            <View>
              <Text style={labelStyle}>CPF *</Text>
              <TextInput style={inputStyle} value={form.document} onChangeText={(v) => set('document', v)} placeholder="000.000.000-00" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
            </View>
            <View>
              <Text style={labelStyle}>Data de Nascimento * (AAAA-MM-DD)</Text>
              <TextInput style={inputStyle} value={form.birthdate} onChangeText={(v) => set('birthdate', v)} placeholder="1990-01-01" placeholderTextColor={colors.textSecondary} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ width: 80 }}>
                <Text style={labelStyle}>DDD *</Text>
                <TextInput style={inputStyle} value={form.phoneDdd} onChangeText={(v) => set('phoneDdd', v)} placeholder="53" keyboardType="numeric" maxLength={2} placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Telefone *</Text>
                <TextInput style={inputStyle} value={form.phoneNumber} onChangeText={(v) => set('phoneNumber', v)} placeholder="999999999" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>
            <View>
              <Text style={labelStyle}>Renda Mensal (R$)</Text>
              <TextInput style={inputStyle} value={form.monthlyIncome} onChangeText={(v) => set('monthlyIncome', v)} keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
            </View>
            <View>
              <Text style={labelStyle}>Profissao</Text>
              <TextInput style={inputStyle} value={form.professionalOccupation} onChangeText={(v) => set('professionalOccupation', v)} placeholderTextColor={colors.textSecondary} />
            </View>
            <View>
              <Text style={labelStyle}>Nome da Mae</Text>
              <TextInput style={inputStyle} value={form.motherName} onChangeText={(v) => set('motherName', v)} placeholderTextColor={colors.textSecondary} />
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.primaryBtnText}>Proximo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Address */}
        {step === 1 && (
          <View style={{ gap: 12 }}>
            <View>
              <Text style={labelStyle}>CEP *</Text>
              <TextInput style={inputStyle} value={form.zipCode} onChangeText={(v) => set('zipCode', v)} placeholder="00000-000" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
            </View>
            <View>
              <Text style={labelStyle}>Rua *</Text>
              <TextInput style={inputStyle} value={form.street} onChangeText={(v) => set('street', v)} placeholderTextColor={colors.textSecondary} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ width: 100 }}>
                <Text style={labelStyle}>Numero *</Text>
                <TextInput style={inputStyle} value={form.streetNumber} onChangeText={(v) => set('streetNumber', v)} keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Complemento</Text>
                <TextInput style={inputStyle} value={form.complementary} onChangeText={(v) => set('complementary', v)} placeholderTextColor={colors.textSecondary} />
              </View>
            </View>
            <View>
              <Text style={labelStyle}>Bairro *</Text>
              <TextInput style={inputStyle} value={form.neighborhood} onChangeText={(v) => set('neighborhood', v)} placeholderTextColor={colors.textSecondary} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Cidade *</Text>
                <TextInput style={inputStyle} value={form.city} onChangeText={(v) => set('city', v)} placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={{ width: 80 }}>
                <Text style={labelStyle}>Estado *</Text>
                <TextInput style={inputStyle} value={form.state} onChangeText={(v) => set('state', v.toUpperCase())} placeholder="RS" maxLength={2} placeholderTextColor={colors.textSecondary} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => setStep(0)}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={() => setStep(2)}>
                <Text style={styles.primaryBtnText}>Proximo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Bank Account */}
        {step === 2 && (
          <View style={{ gap: 12 }}>
            <View>
              <Text style={labelStyle}>Banco *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {BANKS.map((b) => (
                    <TouchableOpacity
                      key={b.code}
                      onPress={() => set('bank', b.code)}
                      style={[styles.bankChip, { backgroundColor: form.bank === b.code ? '#f97316' : colors.card, borderColor: form.bank === b.code ? '#f97316' : colors.border }]}
                    >
                      <Text style={{ fontSize: 11, color: form.bank === b.code ? '#fff' : colors.text, fontWeight: form.bank === b.code ? '600' : 'normal' }}>
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View>
              <Text style={labelStyle}>Titular da Conta *</Text>
              <TextInput style={inputStyle} value={form.holderName} onChangeText={(v) => set('holderName', v)} placeholder="Nome completo" placeholderTextColor={colors.textSecondary} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => set('accountType', 'checking')}
                style={[styles.typeBtn, { backgroundColor: form.accountType === 'checking' ? '#f97316' : colors.card, borderColor: form.accountType === 'checking' ? '#f97316' : colors.border }]}
              >
                <Text style={{ fontSize: 13, color: form.accountType === 'checking' ? '#fff' : colors.text, fontWeight: '600' }}>Corrente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => set('accountType', 'savings')}
                style={[styles.typeBtn, { backgroundColor: form.accountType === 'savings' ? '#f97316' : colors.card, borderColor: form.accountType === 'savings' ? '#f97316' : colors.border }]}
              >
                <Text style={{ fontSize: 13, color: form.accountType === 'savings' ? '#fff' : colors.text, fontWeight: '600' }}>Poupanca</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Agencia *</Text>
                <TextInput style={inputStyle} value={form.branchNumber} onChangeText={(v) => set('branchNumber', v)} placeholder="0001" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={{ width: 60 }}>
                <Text style={labelStyle}>Digito</Text>
                <TextInput style={inputStyle} value={form.branchCheckDigit} onChangeText={(v) => set('branchCheckDigit', v)} placeholder="0" maxLength={1} keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Conta *</Text>
                <TextInput style={inputStyle} value={form.accountNumber} onChangeText={(v) => set('accountNumber', v)} placeholder="00000" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={{ width: 60 }}>
                <Text style={labelStyle}>Digito *</Text>
                <TextInput style={inputStyle} value={form.accountCheckDigit} onChangeText={(v) => set('accountCheckDigit', v)} placeholder="0" maxLength={1} keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => setStep(1)}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1, opacity: loading ? 0.5 : 1 }]} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.primaryBtnText}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Text>
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  balanceCard: {
    borderRadius: 16, padding: 16, borderWidth: 1,
  },
  section: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  simRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, marginVertical: 4 },
  primaryBtn: {
    backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  secondaryBtn: {
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  steps: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
  },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  bankChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  typeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center',
  },
});
