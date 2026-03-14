import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { colors, fonts } from '../../src/theme';

const CONTRACT_TEXT = `TERMOS DE USO — BCM TECH DELIVERY (CLIENTE)
Ultima atualizacao: Marco de 2026

Estes Termos de Uso regulam o acesso e o uso da plataforma bcmTech Delivery pelo Cliente (consumidor final).

A plataforma e operada por BCM TECH, inscrita no CNPJ sob o n. 59.858.037/0001-06, com sede na Avenida Nossa Senhora da Graca, 19, Centro, CEP 96330-000, Arroio Grande - RS.

1. OBJETO
1.1. A Plataforma conecta consumidores finais a estabelecimentos comerciais (vendedores), oferecendo infraestrutura para visualizacao de produtos, realizacao de pedidos, pagamento online e logistica de entrega.
1.2. A Empresa atua como intermediaria tecnologica, nao sendo parte na relacao de consumo entre o Cliente e o Vendedor.

2. CADASTRO
2.1. O Cliente declara que todas as informacoes fornecidas no cadastro sao verdadeiras e atualizadas.
2.2. O Cliente e responsavel pela seguranca de suas credenciais de acesso.
2.3. E vedado o cadastro de menores de 18 anos sem consentimento dos responsaveis legais.

3. PEDIDOS E PAGAMENTOS
3.1. Ao confirmar um pedido, o Cliente assume o compromisso de pagamento conforme o metodo selecionado.
3.2. Os pagamentos sao processados pelo Mercado Pago, intermediador autorizado pelo Banco Central do Brasil.
3.3. Cancelamentos e estornos seguem as politicas do Codigo de Defesa do Consumidor (Lei 8.078/90).

4. ENTREGAS
4.1. Os prazos de entrega sao estimativas e podem variar conforme demanda e condicoes externas.
4.2. O Cliente deve fornecer endereco completo e correto. A Empresa nao se responsabiliza por entregas em enderecos incorretos fornecidos pelo Cliente.
4.3. Os entregadores sao profissionais autonomos, sem vinculo empregaticio com a Empresa.

5. DIREITOS DO CONSUMIDOR
5.1. O Cliente tem direito a informacoes claras sobre produtos, precos e condicoes de entrega, nos termos do art. 6, III do CDC.
5.2. O direito de arrependimento (art. 49 do CDC) aplica-se conforme a natureza do produto adquirido.
5.3. Reclamacoes devem ser direcionadas primeiramente ao estabelecimento vendedor.

6. RESPONSABILIDADES DO CLIENTE
6.1. Utilizar a Plataforma de forma licita e de boa-fe.
6.2. Nao realizar pedidos fraudulentos ou com informacoes falsas.
6.3. Confirmar o recebimento dos pedidos entregues.

7. PROTECAO DE DADOS (LGPD)
7.1. Os dados pessoais sao tratados conforme a Lei 13.709/2018 (LGPD).
7.2. Os dados sao utilizados para prestacao dos servicos, processamento de pagamentos e comunicacoes necessarias.
7.3. O Cliente pode exercer seus direitos (acesso, correcao, eliminacao) pelo e-mail bcmtechdev@gmail.com.

8. LIMITACAO DE RESPONSABILIDADE
8.1. A Empresa nao se responsabiliza pela qualidade dos produtos vendidos pelos estabelecimentos.
8.2. A Empresa nao garante disponibilidade ininterrupta da Plataforma.

9. DISPOSICOES GERAIS
9.1. Estes Termos sao regidos pela legislacao brasileira.
9.2. Foro: comarca de Arroio Grande - RS.
9.3. A Empresa pode alterar estes Termos, notificando o usuario pela Plataforma.

Ao aceitar, voce manifesta seu consentimento livre, informado e inequivoco com todos os termos acima.`;

function formatCpfDisplay(cpf: string) {
  const d = cpf.replace(/\D/g, '');
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function buildContractHtml(userName: string, userCpf: string, userPhone: string) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `
    <html><head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
      .header { background: #F97316; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
      .header h1 { color: white; margin: 0; font-size: 22px; }
      .signee { background: #f5f5f5; border-radius: 10px; padding: 16px; margin-bottom: 24px; }
      .signee-label { font-size: 10px; color: #888; font-weight: 600; margin-bottom: 6px; }
      .signee-name { font-size: 16px; font-weight: 600; }
      .signee-info { font-size: 13px; color: #666; margin-top: 2px; }
      .contract { font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
      .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
    </style></head><body>
      <div class="header"><h1>bcmTech Delivery</h1></div>
      <div class="signee">
        <div class="signee-label">PARTE CONTRATANTE / ASSINANTE:</div>
        <div class="signee-name">${userName}</div>
        <div class="signee-info">CPF: ${formatCpfDisplay(userCpf)}</div>
        <div class="signee-info">Telefone: ${userPhone}</div>
      </div>
      <div class="contract">${CONTRACT_TEXT}</div>
      <div class="footer">Contrato aceito digitalmente em ${dateStr} na plataforma bcmTech Delivery.</div>
    </body></html>
  `;
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const { alert } = useAlert();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState(false);

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_: string, a: string, b?: string, c?: string, d?: string) =>
      [a, b, c].filter(Boolean).join('.') + (d ? `-${d}` : '')
    );
  }

  function validateCpf(value: string): boolean {
    const d = value.replace(/\D/g, '');
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    let s = 0;
    for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
    let c = 11 - (s % 11); if (c >= 10) c = 0;
    if (parseInt(d[9]) !== c) return false;
    s = 0;
    for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
    c = 11 - (s % 11); if (c >= 10) c = 0;
    return parseInt(d[10]) === c;
  }

  function handleNext() {
    if (!name || !email || !phone || !cpf || !password) {
      alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (!validateCpf(cpf)) {
      alert('Erro', 'CPF invalido');
      return;
    }
    setStep(2);
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const scrolled = contentOffset.y + layoutMeasurement.height;
    if (scrolled >= contentSize.height * 0.8) {
      setScrolledToEnd(true);
    }
  }

  async function handleDownloadPdf() {
    try {
      const html = buildContractHtml(name, cpf.replace(/\D/g, ''), phone);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Termos de Uso - bcmTech Delivery' });
    } catch {
      alert('Erro', 'Nao foi possivel gerar o PDF.');
    }
  }

  async function handleAcceptAndRegister() {
    const cpfDigits = cpf.replace(/\D/g, '');
    setLoading(true);
    try {
      await register(name, email, password, phone, undefined, cpfDigits);
      router.replace('/onboarding-address');
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Nao foi possivel criar a conta. Tente novamente.';
      alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Registration form
  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Cadastre-se para comecar a pedir</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            placeholderTextColor={colors.gray}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Telefone"
            placeholderTextColor={colors.gray}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="CPF"
            placeholderTextColor={colors.gray}
            value={cpf}
            onChangeText={(v) => setCpf(formatCpf(v))}
            keyboardType="numeric"
            maxLength={14}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Senha (min. 6 caracteres)"
              placeholderTextColor={colors.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.gray}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Ja tem conta? <Text style={styles.linkBold}>Entrar</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Step 2: Contract view with user data
  return (
    <View style={styles.contractContainer}>
      {/* Header */}
      <View style={styles.contractHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Ionicons name="document-text" size={32} color={colors.primary} />
        <Text style={styles.contractTitle}>Termos de Uso</Text>
        <Text style={styles.contractSubtitle}>Leia o contrato antes de finalizar o cadastro</Text>
      </View>

      {/* Contract body */}
      <ScrollView
        style={styles.contractScroll}
        contentContainerStyle={styles.contractScrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Signee box */}
        <View style={styles.signeeBox}>
          <Text style={styles.signeeLabel}>PARTE CONTRATANTE / ASSINANTE:</Text>
          <Text style={styles.signeeName}>{name}</Text>
          <Text style={styles.signeeInfo}>CPF: {formatCpfDisplay(cpf.replace(/\D/g, ''))}</Text>
          <Text style={styles.signeeInfo}>Telefone: {phone}</Text>
        </View>

        <Text style={styles.contractText}>{CONTRACT_TEXT}</Text>
      </ScrollView>

      {/* Footer */}
      <View style={styles.contractFooter}>
        {!scrolledToEnd && (
          <Text style={styles.scrollHint}>
            Role ate o final do contrato para poder aceitar.
          </Text>
        )}

        {/* Download PDF */}
        <TouchableOpacity style={styles.pdfButton} onPress={handleDownloadPdf}>
          <Ionicons name="download-outline" size={20} color={colors.primary} />
          <Text style={styles.pdfButtonText}>Baixar contrato em PDF</Text>
        </TouchableOpacity>

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => scrolledToEnd && setChecked(!checked)}
          disabled={!scrolledToEnd}
        >
          <Ionicons
            name={checked ? 'checkbox' : 'square-outline'}
            size={24}
            color={checked ? colors.primary : scrolledToEnd ? colors.gray : colors.grayLight}
          />
          <Text style={[styles.checkboxText, !scrolledToEnd && { color: colors.gray }]}>
            Li e aceito os Termos de Uso da Plataforma e a Politica de Privacidade.
          </Text>
        </TouchableOpacity>

        {/* Accept button */}
        <TouchableOpacity
          style={[styles.acceptButton, (!checked || !scrolledToEnd || loading) && styles.buttonDisabled]}
          onPress={handleAcceptAndRegister}
          disabled={!checked || !scrolledToEnd || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.acceptButtonText}>Aceitar e Criar Conta</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Step 1 styles
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: fonts.title, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fonts.regular, color: colors.textLight, marginTop: 8, marginBottom: 24 },
  form: { gap: 16 },
  input: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 16,
    fontSize: fonts.regular,
    color: colors.text,
  },
  passwordContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.grayLight,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: fonts.regular,
    color: colors.text,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.white, fontSize: fonts.large, fontWeight: 'bold' },
  link: { textAlign: 'center', color: colors.textLight, fontSize: fonts.regular, marginTop: 16 },
  linkBold: { color: colors.primary, fontWeight: 'bold' },

  // Step 2 styles
  contractContainer: { flex: 1, backgroundColor: colors.white },
  contractHeader: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 16,
    padding: 8,
  },
  contractTitle: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  contractSubtitle: {
    fontSize: fonts.small,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  contractScroll: { flex: 1 },
  contractScrollContent: { padding: 20, paddingBottom: 32 },
  signeeBox: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  signeeLabel: {
    fontSize: fonts.tiny,
    color: colors.textLight,
    fontWeight: '600',
    marginBottom: 6,
  },
  signeeName: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: colors.text,
  },
  signeeInfo: {
    fontSize: fonts.small,
    color: colors.textLight,
    marginTop: 2,
  },
  contractText: {
    fontSize: fonts.small,
    color: colors.textLight,
    lineHeight: 22,
  },
  contractFooter: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    backgroundColor: colors.white,
  },
  scrollHint: {
    fontSize: fonts.tiny,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
  },
  pdfButtonText: {
    color: colors.primary,
    fontSize: fonts.small,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  checkboxText: {
    flex: 1,
    fontSize: fonts.small,
    color: colors.text,
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
});
