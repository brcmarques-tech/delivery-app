import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAlert } from '../src/contexts/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MY_BALANCE, SIMULATE_ANTICIPATION, GET_ME } from '../src/lib/graphql/queries';
import { REGISTER_RECIPIENT, REQUEST_ANTICIPATION, DISCONNECT_PAYMENT, TOGGLE_AUTO_ANTICIPATION } from '../src/lib/graphql/mutations';

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

// ===== MASKS =====
function maskCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
  if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
  return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
}

function maskCEP(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return d.slice(0, 5) + '-' + d.slice(5);
}

function maskDate(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return d.slice(0, 2) + '/' + d.slice(2);
  return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
}

function isValidCPF(cpf: string) {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(d[10]);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EarningsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: meData, loading: loadingMe, refetch: refetchMe } = useQuery(GET_ME, { fetchPolicy: 'network-only' });
  const paymentConnected = meData?.meApp?.paymentConnected ?? false;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Recebimentos</Text>
        <View style={{ width: 24 }} />
      </View>

      {loadingMe ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>Carregando...</Text>
        </View>
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
  const { isDark } = useTheme();
  // L4: Use useAlert instead of Alert.alert where available
  const { alert: showAlert } = useAlert();
  const { data: balanceData, loading, error: balanceError, refetch: refetchBalance } = useQuery(MY_BALANCE, { fetchPolicy: 'network-only' });
  const { data: simData, loading: loadingSim } = useQuery(SIMULATE_ANTICIPATION, { fetchPolicy: 'network-only' });
  const [requestAnticipation, { loading: requesting }] = useMutation(REQUEST_ANTICIPATION);
  const [disconnectPayment] = useMutation(DISCONNECT_PAYMENT);
  // M4: Auto-anticipation toggle
  const [toggleAutoAnticipation] = useMutation(TOGGLE_AUTO_ANTICIPATION);
  const [autoAnticipationEnabled, setAutoAnticipationEnabled] = useState(false);

  const balance = balanceData?.myBalance;
  const sim = simData?.simulateAnticipation;

  async function handleAnticipate() {
    if (!sim) return;
    Alert.alert(
      'Confirmar Antecipacao',
      `Sera cobrada uma taxa de R$ ${sim.fee?.toFixed(2) || '0.00'} (~${sim.feePercentage || 0}%).\n\nVoce recebera R$ ${sim.anticipatedAmount?.toFixed(2) || '0.00'}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              const { data } = await requestAnticipation();
              const r = data.requestAnticipation;
              Alert.alert('Antecipacao Solicitada!', `Valor aprovado: R$ ${r.approvedAmount?.toFixed(2)}\nTaxa cobrada: R$ ${r.fee?.toFixed(2)}\nStatus: ${r.status}`);
              refetchBalance();
            } catch (err: any) {
              const msg = err.message?.includes('network') ? 'Sem conexao com a internet. Tente novamente.' : err.message || 'Erro ao solicitar antecipacao.';
              Alert.alert('Erro', msg);
            }
          },
        },
      ],
    );
  }

  async function handleDisconnect() {
    Alert.alert('Desconectar Conta', 'Ao desconectar, voce deixara de receber pagamentos automaticamente.\n\nTem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desconectar',
        style: 'destructive',
        onPress: async () => {
          try {
            await disconnectPayment();
            refetchMe();
          } catch (err: any) {
            const msg = err.message?.includes('network') ? 'Sem conexao com a internet.' : err.message || 'Erro ao desconectar.';
            Alert.alert('Erro', msg);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>Carregando saldo...</Text>
      </View>
    );
  }

  if (balanceError) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14, textAlign: 'center' }}>
          Nao foi possivel carregar seu saldo.{'\n'}Verifique sua conexao.
        </Text>
        <TouchableOpacity style={[styles.retryBtn, { borderColor: colors.border }]} onPress={() => refetchBalance()}>
          <Ionicons name="refresh" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Balance Cards */}
      <View style={{ gap: 12, marginBottom: 24 }}>
        <View style={[styles.balanceCard, { backgroundColor: isDark ? '#14532d' : '#dcfce7', borderColor: isDark ? '#166534' : '#bbf7d0' }]}>
          <View style={styles.balanceRow}>
            <View style={[styles.balanceIcon, { backgroundColor: isDark ? '#166534' : '#bbf7d0' }]}>
              <Ionicons name="wallet-outline" size={20} color={isDark ? '#86efac' : '#22c55e'} />
            </View>
            <Text style={{ fontSize: 13, color: isDark ? '#bbf7d0' : '#166534' }}>Disponivel para saque</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: isDark ? '#86efac' : '#166534', marginTop: 4 }}>
            R$ {(balance?.availableAmount || 0).toFixed(2)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.balanceCard, { flex: 1, backgroundColor: isDark ? '#431407' : '#fff7ed', borderColor: isDark ? '#9a3412' : '#fed7aa' }]}>
            <View style={[styles.balanceIconSmall, { backgroundColor: isDark ? '#9a3412' : '#fed7aa' }]}>
              <Ionicons name="time-outline" size={16} color={isDark ? '#fdba74' : '#f97316'} />
            </View>
            <Text style={{ fontSize: 11, color: isDark ? '#fed7aa' : '#9a3412', marginTop: 6 }}>A receber</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#fdba74' : '#9a3412' }}>
              R$ {(balance?.waitingFundsAmount || 0).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.balanceCard, { flex: 1, backgroundColor: isDark ? '#1e3a5f' : '#dbeafe', borderColor: isDark ? '#1e40af' : '#bfdbfe' }]}>
            <View style={[styles.balanceIconSmall, { backgroundColor: isDark ? '#1e40af' : '#bfdbfe' }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color={isDark ? '#93c5fd' : '#3b82f6'} />
            </View>
            <Text style={{ fontSize: 11, color: isDark ? '#bfdbfe' : '#1e40af', marginTop: 6 }}>Ja transferido</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#93c5fd' : '#1e40af' }}>
              R$ {(balance?.transferredAmount || 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Anticipation */}
      {(balance?.waitingFundsAmount || 0) > 0 && sim && sim.originalAmount > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="flash-outline" size={18} color="#f97316" />
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Antecipar Recebiveis</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
            Receba seus valores pendentes agora, com uma pequena taxa.
          </Text>

          <View style={[styles.simBox, { backgroundColor: colors.background }]}>
            <View style={styles.simRow}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Valor pendente</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>R$ {sim.originalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.simRow}>
              <Text style={{ fontSize: 13, color: '#dc2626' }}>Taxa (~{sim.feePercentage}%)</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#dc2626' }}>- R$ {sim.fee.toFixed(2)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.simRow}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#16a34a' }}>Voce recebe</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#16a34a' }}>R$ {sim.anticipatedAmount.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { opacity: requesting ? 0.5 : 1 }]}
            onPress={handleAnticipate}
            disabled={requesting}
          >
            {requesting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="flash" size={16} color="#fff" />
                {/* M5: Make text clear that it anticipates all available balance */}
                <Text style={styles.primaryBtnText}>Antecipar todo o saldo disponivel</Text>
              </>
            )}
          </TouchableOpacity>
          {/* M5: Note about partial anticipation */}
          {/* TODO: Add partial anticipation amount when API supports amount parameter in RequestAnticipation mutation */}
        </View>
      )}

      {/* M4: Auto-anticipation toggle */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 2 }]}>Antecipacao automatica</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              Antecipa recebiveis automaticamente quando disponiveis
            </Text>
          </View>
          <Switch
            value={autoAnticipationEnabled}
            onValueChange={async (value) => {
              try {
                await toggleAutoAnticipation({ variables: { enabled: value } });
                setAutoAnticipationEnabled(value);
              } catch (err: any) {
                showAlert('Erro', err.message || 'Erro ao alterar configuracao');
              }
            }}
            trackColor={{ false: colors.border, true: '#f9731680' }}
            thumbColor={autoAnticipationEnabled ? '#f97316' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* M6: Transaction history placeholder */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Ionicons name="list-outline" size={18} color="#f97316" />
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Historico de transacoes</Text>
        </View>
        {/* TODO: Integrate myPayments query when available in the API */}
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Ionicons name="time-outline" size={32} color={colors.textSecondary} />
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            Historico de transacoes em breve
          </Text>
        </View>
      </View>

      {/* How it works */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Como funciona?</Text>
        <View style={{ gap: 16 }}>
          {[
            { icon: 'card-outline' as const, title: 'Cartao de credito', desc: 'Disponivel em 30 dias. Com antecipacao, ~2 dias (com taxa).', color: '#8b5cf6' },
            { icon: 'phone-portrait-outline' as const, title: 'PIX', desc: 'Disponivel em 2 dias uteis (D+2).', color: '#06b6d4' },
            { icon: 'business-outline' as const, title: 'Transferencia automatica', desc: 'Quando disponivel, transfere para sua conta todo dia.', color: '#f97316' },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: isDark ? item.color + '30' : item.color + '18' }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Disconnect */}
      <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
        <Ionicons name="log-out-outline" size={16} color="#dc2626" />
        <Text style={{ fontSize: 13, color: '#dc2626' }}>Desconectar dados bancarios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ===== RECIPIENT FORM (2 steps: Personal + Bank) =====
function RecipientForm({ colors, onSuccess }: { colors: any; onSuccess: () => void }) {
  const { isDark } = useTheme();
  const [registerRecipient, { loading }] = useMutation(REGISTER_RECIPIENT);
  const [step, setStep] = useState(0); // 0=personal+address, 1=bank
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fetchingCep, setFetchingCep] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', document: '', birthdate: '', phone: '',
    street: '', streetNumber: '', neighborhood: '', city: '', state: '', zipCode: '',
    bank: '', branchNumber: '', branchCheckDigit: '', accountNumber: '', accountCheckDigit: '',
    accountType: 'checking',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  const fetchCep = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch { /* ignore */ }
    setFetchingCep(false);
  }, []);

  function validateStep0(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Informe seu nome';
    if (!form.email.trim()) e.email = 'Informe seu email';
    else if (!isValidEmail(form.email)) e.email = 'Email invalido';
    const cpfDigits = form.document.replace(/\D/g, '');
    if (!cpfDigits) e.document = 'Informe seu CPF';
    else if (!isValidCPF(cpfDigits)) e.document = 'CPF invalido';
    const dateDigits = form.birthdate.replace(/\D/g, '');
    if (dateDigits.length !== 8) e.birthdate = 'Informe DD/MM/AAAA';
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) e.phone = 'Informe DDD + numero';
    if (form.zipCode.replace(/\D/g, '').length !== 8) e.zipCode = 'CEP invalido';
    if (!form.street.trim()) e.street = 'Informe a rua';
    if (!form.streetNumber.trim()) e.streetNumber = 'Obrigatorio';
    if (!form.neighborhood.trim()) e.neighborhood = 'Informe o bairro';
    if (!form.city.trim()) e.city = 'Informe a cidade';
    if (!form.state.trim() || form.state.length !== 2) e.state = 'UF';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (!form.bank) e.bank = 'Selecione um banco';
    const branch = form.branchNumber.replace(/\D/g, '');
    if (!branch) e.branchNumber = 'Obrigatório';
    else if (branch.length < 3 || branch.length > 5) e.branchNumber = 'Agência deve ter 3 a 5 dígitos';
    const account = form.accountNumber.replace(/\D/g, '');
    if (!account) e.accountNumber = 'Obrigatório';
    else if (account.length < 3 || account.length > 13) e.accountNumber = 'Conta deve ter 3 a 13 dígitos';
    const checkDigit = form.accountCheckDigit.trim();
    if (!checkDigit) e.accountCheckDigit = 'Obrigatório';
    else if (!/^[0-9Xx]$/.test(checkDigit)) e.accountCheckDigit = 'Dígito inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validateStep1()) return;

    const phoneDigits = form.phone.replace(/\D/g, '');
    const dateDigits = form.birthdate.replace(/\D/g, '');
    const birthdate = `${dateDigits.slice(4, 8)}-${dateDigits.slice(2, 4)}-${dateDigits.slice(0, 2)}`;

    const recipientData = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      document: form.document.replace(/\D/g, ''),
      type: 'individual' as const,
      birthdate,
      phone: { ddd: phoneDigits.slice(0, 2), number: phoneDigits.slice(2) },
      address: {
        street: form.street.trim(), streetNumber: form.streetNumber.trim(),
        neighborhood: form.neighborhood.trim(), city: form.city.trim(),
        state: form.state.toUpperCase().trim(), zipCode: form.zipCode.replace(/\D/g, ''),
      },
      bankAccount: {
        holderName: form.name.trim(),
        bank: form.bank, branchNumber: form.branchNumber.trim(),
        branchCheckDigit: form.branchCheckDigit.trim() || undefined,
        accountNumber: form.accountNumber.trim(),
        accountCheckDigit: form.accountCheckDigit.trim(),
        type: form.accountType,
      },
    };

    // M7: Client-side validation of required fields before sending JSON to API
    if (!recipientData.document || recipientData.document.length < 11) {
      Alert.alert('Erro', 'CPF invalido. Verifique o documento informado.');
      return;
    }
    if (!recipientData.type || !['individual', 'corporation'].includes(recipientData.type)) {
      Alert.alert('Erro', 'Tipo de conta invalido.');
      return;
    }
    if (!recipientData.name?.trim()) {
      Alert.alert('Erro', 'Nome e obrigatorio.');
      return;
    }
    if (!recipientData.bankAccount?.bank || !recipientData.bankAccount?.branchNumber || !recipientData.bankAccount?.accountNumber) {
      Alert.alert('Erro', 'Dados bancarios incompletos. Verifique banco, agencia e conta.');
      return;
    }

    try {
      await registerRecipient({ variables: { recipientData: JSON.stringify(recipientData) } });
      Alert.alert('Tudo certo!', 'Seus dados foram cadastrados. Agora voce pode receber pagamentos!');
      onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Erro ao cadastrar. Tente novamente.';
      Alert.alert('Erro', msg);
    }
  }

  const inputStyle = (field?: string) => [
    styles.input,
    {
      backgroundColor: colors.inputBg,
      borderColor: field && errors[field] ? '#ef4444' : colors.border,
      color: colors.text,
    },
  ];
  const labelStyle = [styles.label, { color: colors.textSecondary }];

  function FieldError({ field }: { field: string }) {
    if (!errors[field]) return null;
    return <Text style={styles.fieldError}>{errors[field]}</Text>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        {/* Step indicator */}
        <View style={styles.steps}>
          {['Seus Dados', 'Conta Bancaria'].map((label, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.stepLine, { backgroundColor: i <= step ? '#f97316' : colors.border }]} />}
              <TouchableOpacity onPress={() => { if (i < step) setStep(i); }} style={styles.stepItem}>
                <View style={[styles.stepDot, { backgroundColor: i <= step ? '#f97316' : isDark ? '#374151' : colors.border }]}>
                  {i < step ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text style={{ fontSize: 12, color: i === step ? '#fff' : colors.textSecondary, fontWeight: 'bold' }}>{i + 1}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 11, color: i <= step ? '#f97316' : colors.textSecondary, fontWeight: i === step ? '600' : 'normal' }}>{label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Step 0: Personal + Address */}
        {step === 0 && (
          <View style={{ gap: 12 }}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Dados Pessoais</Text>
            <View>
              <Text style={labelStyle}>Nome Completo</Text>
              <TextInput style={inputStyle('name')} value={form.name} onChangeText={(v) => set('name', v)} placeholder="Seu nome completo" placeholderTextColor={colors.textSecondary} autoCapitalize="words" />
              <FieldError field="name" />
            </View>
            <View>
              <Text style={labelStyle}>Email</Text>
              <TextInput style={inputStyle('email')} value={form.email} onChangeText={(v) => set('email', v)} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textSecondary} />
              <FieldError field="email" />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>CPF</Text>
                <TextInput style={inputStyle('document')} value={form.document} onChangeText={(v) => set('document', maskCPF(v))} placeholder="000.000.000-00" keyboardType="numeric" maxLength={14} placeholderTextColor={colors.textSecondary} />
                <FieldError field="document" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Nascimento</Text>
                <TextInput style={inputStyle('birthdate')} value={form.birthdate} onChangeText={(v) => set('birthdate', maskDate(v))} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} placeholderTextColor={colors.textSecondary} />
                <FieldError field="birthdate" />
              </View>
            </View>
            <View>
              <Text style={labelStyle}>Telefone com DDD</Text>
              <TextInput style={inputStyle('phone')} value={form.phone} onChangeText={(v) => set('phone', maskPhone(v))} placeholder="(53) 99999-9999" keyboardType="numeric" maxLength={15} placeholderTextColor={colors.textSecondary} />
              <FieldError field="phone" />
            </View>

            <View style={[styles.sectionDivider, { borderColor: colors.border }]} />
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Endereco</Text>

            <View>
              <Text style={labelStyle}>CEP</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[...inputStyle('zipCode'), { flex: 1 }]}
                  value={form.zipCode}
                  onChangeText={(v) => {
                    const masked = maskCEP(v);
                    set('zipCode', masked);
                    if (masked.replace(/\D/g, '').length === 8) fetchCep(masked);
                  }}
                  placeholder="00000-000" keyboardType="numeric" maxLength={9} placeholderTextColor={colors.textSecondary}
                />
                {fetchingCep && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
              </View>
              <FieldError field="zipCode" />
            </View>
            <View>
              <Text style={labelStyle}>Rua</Text>
              <TextInput style={inputStyle('street')} value={form.street} onChangeText={(v) => set('street', v)} placeholder="Nome da rua" placeholderTextColor={colors.textSecondary} />
              <FieldError field="street" />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ width: 90 }}>
                <Text style={labelStyle}>Numero</Text>
                <TextInput style={inputStyle('streetNumber')} value={form.streetNumber} onChangeText={(v) => set('streetNumber', v)} keyboardType="numeric" placeholder="123" placeholderTextColor={colors.textSecondary} />
                <FieldError field="streetNumber" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Bairro</Text>
                <TextInput style={inputStyle('neighborhood')} value={form.neighborhood} onChangeText={(v) => set('neighborhood', v)} placeholder="Seu bairro" placeholderTextColor={colors.textSecondary} />
                <FieldError field="neighborhood" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Cidade</Text>
                <TextInput style={inputStyle('city')} value={form.city} onChangeText={(v) => set('city', v)} placeholder="Sua cidade" placeholderTextColor={colors.textSecondary} />
                <FieldError field="city" />
              </View>
              <View style={{ width: 70 }}>
                <Text style={labelStyle}>Estado</Text>
                <TextInput style={inputStyle('state')} value={form.state} onChangeText={(v) => set('state', v.toUpperCase())} placeholder="RS" maxLength={2} autoCapitalize="characters" placeholderTextColor={colors.textSecondary} />
                <FieldError field="state" />
              </View>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 4 }]} onPress={() => { if (validateStep0()) setStep(1); }}>
              <Text style={styles.primaryBtnText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Bank Account */}
        {step === 1 && (
          <View style={{ gap: 12 }}>
            <View>
              <Text style={labelStyle}>Banco</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
                  {BANKS.map((b) => (
                    <TouchableOpacity
                      key={b.code}
                      onPress={() => set('bank', b.code)}
                      style={[styles.bankChip, {
                        backgroundColor: form.bank === b.code ? '#f97316' : isDark ? '#374151' : colors.card,
                        borderColor: form.bank === b.code ? '#f97316' : colors.border,
                      }]}
                    >
                      <Text style={{
                        fontSize: 12, fontWeight: form.bank === b.code ? '600' : 'normal',
                        color: form.bank === b.code ? '#fff' : colors.text,
                      }}>
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <FieldError field="bank" />
            </View>

            <View>
              <Text style={[labelStyle, { marginBottom: 6 }]}>Tipo de Conta</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => set('accountType', 'checking')}
                  style={[styles.typeBtn, {
                    backgroundColor: form.accountType === 'checking' ? '#f97316' : isDark ? '#374151' : colors.card,
                    borderColor: form.accountType === 'checking' ? '#f97316' : colors.border,
                  }]}
                >
                  <Text style={{ fontSize: 13, color: form.accountType === 'checking' ? '#fff' : colors.text, fontWeight: '600' }}>Corrente</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => set('accountType', 'savings')}
                  style={[styles.typeBtn, {
                    backgroundColor: form.accountType === 'savings' ? '#f97316' : isDark ? '#374151' : colors.card,
                    borderColor: form.accountType === 'savings' ? '#f97316' : colors.border,
                  }]}
                >
                  <Text style={{ fontSize: 13, color: form.accountType === 'savings' ? '#fff' : colors.text, fontWeight: '600' }}>Poupanca</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Agencia</Text>
                <TextInput style={inputStyle('branchNumber')} value={form.branchNumber} onChangeText={(v) => set('branchNumber', v.replace(/\D/g, ''))} placeholder="0001" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
                <FieldError field="branchNumber" />
              </View>
              <View style={{ width: 70 }}>
                <Text style={labelStyle}>Digito</Text>
                <TextInput style={inputStyle()} value={form.branchCheckDigit} onChangeText={(v) => set('branchCheckDigit', v.replace(/\D/g, ''))} placeholder="0" maxLength={1} keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Conta</Text>
                <TextInput style={inputStyle('accountNumber')} value={form.accountNumber} onChangeText={(v) => set('accountNumber', v.replace(/\D/g, ''))} placeholder="00000" keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
                <FieldError field="accountNumber" />
              </View>
              <View style={{ width: 70 }}>
                <Text style={labelStyle}>Digito</Text>
                <TextInput style={inputStyle('accountCheckDigit')} value={form.accountCheckDigit} onChangeText={(v) => set('accountCheckDigit', v.replace(/\D/g, ''))} placeholder="0" maxLength={1} keyboardType="numeric" placeholderTextColor={colors.textSecondary} />
                <FieldError field="accountCheckDigit" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => setStep(0)}>
                <Ionicons name="arrow-back" size={16} color={colors.text} />
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1, opacity: loading ? 0.5 : 1 }]} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>Cadastrar</Text>
                  </>
                )}
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  balanceCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  balanceIconSmall: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  sectionLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  sectionDivider: { borderTopWidth: 1, marginVertical: 4 },
  simBox: { borderRadius: 12, padding: 12, marginBottom: 12, gap: 6 },
  simRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, marginVertical: 4 },
  primaryBtn: {
    backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  secondaryBtn: {
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    alignItems: 'center', borderWidth: 1, flexDirection: 'row', gap: 4,
  },
  retryBtn: {
    flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 16,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  disconnectBtn: {
    flexDirection: 'row', gap: 6, alignSelf: 'center', alignItems: 'center',
    marginTop: 16, paddingVertical: 8, paddingHorizontal: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  steps: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepLine: { height: 2, width: 40, borderRadius: 1, marginBottom: 16 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  fieldError: { fontSize: 11, color: '#ef4444', marginTop: 3 },
  bankChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  typeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center',
  },
});
