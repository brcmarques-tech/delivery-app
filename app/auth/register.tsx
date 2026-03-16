import React, { useState, useRef, useEffect } from 'react';
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
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { VALIDATE_REGISTRATION, SEND_VERIFICATION_CODE, VERIFY_CODE } from '../../src/lib/graphql/mutations';
import { colors, fonts } from '../../src/theme';

const API_BASE = 'https://delivery-api-fdc4.onrender.com';
const RETURN_URL = Constants.appOwnership === 'expo'
  ? Linking.createURL('google-auth')
  : 'delivery-app://google-auth';

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

function formatPhoneDisplay(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return phone;
}

function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
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
  const { register, registerWithGoogle } = useAuth();
  const { alert } = useAlert();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState(false);

  // Google register state
  const [isGoogleRegister, setIsGoogleRegister] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleRegister() {
    setGoogleLoading(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE}/auth/google/mobile?mode=register&userType=app&returnUrl=${encodeURIComponent(RETURN_URL)}`,
        RETURN_URL,
      );

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const params = parsed.queryParams || {};

        if (params.error) {
          alert('Erro', 'Erro ao conectar com Google. Tente novamente.');
          return;
        }

        if (params.mode === 'register') {
          setName((params.name as string) || '');
          setEmail((params.email as string) || '');
          setGoogleIdToken((params.accessToken as string) || '');
          setIsGoogleRegister(true);
        }
      }
    } catch {
      alert('Erro', 'Erro ao conectar com Google. Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  }

  const [fieldErrors, setFieldErrors] = useState<{ emailError?: string; cpfError?: string; phoneError?: string }>({});

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [validateRegistration] = useMutation(VALIDATE_REGISTRATION);
  const [sendVerificationCode] = useMutation(SEND_VERIFICATION_CODE);
  const [verifyCode] = useMutation(VERIFY_CODE);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

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

  async function handleNext() {
    if (isGoogleRegister) {
      if (!phone || !cpf) {
        alert('Erro', 'Preencha telefone e CPF');
        return;
      }
    } else {
      if (!name || !email || !phone || !cpf || !password) {
        alert('Erro', 'Preencha todos os campos');
        return;
      }
      if (password.length < 6) {
        alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
        return;
      }
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      alert('Erro', 'Telefone invalido. Use DDD + numero');
      return;
    }
    if (!validateCpf(cpf)) {
      alert('Erro', 'CPF invalido');
      return;
    }
    // Valida email, CPF e telefone no servidor antes de enviar codigo
    setOtpSending(true);
    setFieldErrors({});
    try {
      const { data: valData } = await validateRegistration({
        variables: { email, cpf: cpf.replace(/\D/g, ''), phone: phoneDigits, userType: 'app' },
      });
      const result = valData?.validateRegistration;
      if (result && !result.valid) {
        setFieldErrors({
          emailError: result.emailError || undefined,
          cpfError: result.cpfError || undefined,
          phoneError: result.phoneError || undefined,
        });
        setOtpSending(false);
        return;
      }
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Erro na validacao';
      alert('Erro', msg);
      setOtpSending(false);
      return;
    }
    // Tudo ok, envia codigo por WhatsApp
    setOtpSending(false);
    await sendOtp();
  }

  async function sendOtp() {
    setOtpSending(true);
    try {
      await sendVerificationCode({
        variables: { input: { value: phone.replace(/\D/g, ''), channel: 'whatsapp' } },
      });
      setStep(2);
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Erro ao enviar codigo';
      alert('Erro', msg);
    } finally {
      setOtpSending(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) value = value[value.length - 1];
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp() {
    const code = otpDigits.join('');
    if (code.length !== 6) {
      alert('Erro', 'Digite o codigo completo de 6 digitos');
      return;
    }
    setOtpVerifying(true);
    try {
      await verifyCode({
        variables: { input: { value: phone.replace(/\D/g, ''), code, channel: 'whatsapp' } },
      });
      setStep(3);
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'Codigo incorreto';
      alert('Erro', msg);
    } finally {
      setOtpVerifying(false);
    }
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
      if (isGoogleRegister) {
        await registerWithGoogle(googleIdToken, phone.replace(/\D/g, ''), cpfDigits);
      } else {
        await register(name, email, password, phone.replace(/\D/g, ''), undefined, cpfDigits);
      }
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
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepActive]} />
          <View style={styles.stepLine} />
          <View style={styles.stepDot} />
          <View style={styles.stepLine} />
          <View style={styles.stepDot} />
        </View>
        <Text style={styles.stepLabel}>Dados pessoais</Text>

        <View style={styles.headerIcon}>
          <Ionicons name="person-add" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Cadastre-se para comecar a pedir</Text>

        <View style={styles.form}>
          {isGoogleRegister ? (
            <View style={styles.googleInfoBox}>
              <Image source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} style={styles.googleInfoIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.googleInfoName}>{name}</Text>
                <Text style={styles.googleInfoEmail}>{email}</Text>
              </View>
              <TouchableOpacity onPress={() => { setIsGoogleRegister(false); setGoogleIdToken(''); setName(''); setEmail(''); }}>
                <Ionicons name="close-circle" size={22} color={colors.gray} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Nome completo"
                  placeholderTextColor={colors.gray}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View>
                <View style={[styles.inputContainer, fieldErrors.emailError ? styles.inputError : null]}>
                  <Ionicons name="mail-outline" size={20} color={fieldErrors.emailError ? colors.danger : colors.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Email"
                    placeholderTextColor={colors.gray}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setFieldErrors(f => ({ ...f, emailError: undefined })); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {fieldErrors.emailError && <Text style={styles.fieldError}>{fieldErrors.emailError}</Text>}
              </View>
            </>
          )}
          <View>
            <View style={[styles.inputContainer, fieldErrors.phoneError ? styles.inputError : null]}>
              <Ionicons name="call-outline" size={20} color={fieldErrors.phoneError ? colors.danger : colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="(DD) 99999-9999"
                placeholderTextColor={colors.gray}
                value={phone}
                onChangeText={(v) => { setPhone(formatPhone(v)); setFieldErrors(f => ({ ...f, phoneError: undefined })); }}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
            {fieldErrors.phoneError && <Text style={styles.fieldError}>{fieldErrors.phoneError}</Text>}
          </View>
          <View>
            <View style={[styles.inputContainer, fieldErrors.cpfError ? styles.inputError : null]}>
              <Ionicons name="document-text-outline" size={20} color={fieldErrors.cpfError ? colors.danger : colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="CPF"
                placeholderTextColor={colors.gray}
                value={cpf}
                onChangeText={(v) => { setCpf(formatCpf(v)); setFieldErrors(f => ({ ...f, cpfError: undefined })); }}
                keyboardType="numeric"
                maxLength={14}
              />
            </View>
            {fieldErrors.cpfError && <Text style={styles.fieldError}>{fieldErrors.cpfError}</Text>}
          </View>
          {!isGoogleRegister && (
          <View style={styles.passwordContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.gray} style={styles.inputIcon} />
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
          )}

          <TouchableOpacity
            style={[styles.button, otpSending && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={otpSending}
          >
            {otpSending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Continuar</Text>
            )}
          </TouchableOpacity>

          {!isGoogleRegister && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
                onPress={handleGoogleRegister}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Image
                      source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                      style={styles.googleIconBtn}
                    />
                    <Text style={styles.googleButtonText}>Cadastrar com Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Ja tem conta? <Text style={styles.linkBold}>Entrar</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Step 2: WhatsApp verification
  if (step === 2) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.otpContent}>
          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.stepDone]} />
            <View style={[styles.stepLine, styles.stepLineDone]} />
            <View style={[styles.stepDot, styles.stepActive]} />
            <View style={styles.stepLine} />
            <View style={styles.stepDot} />
          </View>
          <Text style={styles.stepLabel}>Verificacao</Text>

          <TouchableOpacity style={styles.backButtonOtp} onPress={() => setStep(1)}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.otpIconContainer}>
            <Ionicons name="logo-whatsapp" size={48} color="#25D366" />
          </View>
          <Text style={styles.otpTitle}>Verifique seu WhatsApp</Text>
          <Text style={styles.otpSubtitle}>
            Enviamos um codigo de 6 digitos para{'\n'}
            <Text style={styles.otpPhone}>{formatPhoneDisplay(phone.replace(/\D/g, ''))}</Text>
          </Text>

          <View style={styles.otpRow}>
            {otpDigits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                value={digit}
                onChangeText={(v) => handleOtpChange(i, v)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, (otpVerifying || otpDigits.join('').length !== 6) && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={otpVerifying || otpDigits.join('').length !== 6}
          >
            {otpVerifying ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Verificar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={sendOtp}
            disabled={resendTimer > 0 || otpSending}
            style={styles.resendContainer}
          >
            <Text style={[styles.resendText, resendTimer > 0 && { color: colors.gray }]}>
              {resendTimer > 0
                ? `Reenviar codigo em ${resendTimer}s`
                : 'Reenviar codigo'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Step 3: Contract view
  return (
    <View style={styles.contractContainer}>
      {/* Step indicator */}
      <View style={styles.contractHeader}>
        <View style={[styles.stepIndicator, { marginTop: 0 }]}>
          <View style={[styles.stepDot, styles.stepDone]} />
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={[styles.stepDot, styles.stepDone]} />
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={[styles.stepDot, styles.stepActive]} />
        </View>
        <Text style={styles.stepLabel}>Contrato</Text>

        <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Ionicons name="document-text" size={32} color={colors.primary} />
        <Text style={styles.contractTitle}>Termos de Uso</Text>
        <Text style={styles.contractSubtitle}>Leia o contrato antes de finalizar o cadastro</Text>
      </View>

      <ScrollView
        style={styles.contractScroll}
        contentContainerStyle={styles.contractScrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.signeeBox}>
          <Text style={styles.signeeLabel}>PARTE CONTRATANTE / ASSINANTE:</Text>
          <Text style={styles.signeeName}>{name}</Text>
          <Text style={styles.signeeInfo}>CPF: {formatCpfDisplay(cpf.replace(/\D/g, ''))}</Text>
          <Text style={styles.signeeInfo}>Telefone: {formatPhoneDisplay(phone.replace(/\D/g, ''))}</Text>
        </View>

        <Text style={styles.contractText}>{CONTRACT_TEXT}</Text>
      </ScrollView>

      <View style={styles.contractFooter}>
        {!scrolledToEnd && (
          <Text style={styles.scrollHint}>
            Role ate o final do contrato para poder aceitar.
          </Text>
        )}

        <TouchableOpacity style={styles.pdfButton} onPress={handleDownloadPdf}>
          <Ionicons name="download-outline" size={20} color={colors.primary} />
          <Text style={styles.pdfButtonText}>Baixar contrato em PDF</Text>
        </TouchableOpacity>

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
  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.grayLight,
    borderWidth: 2,
    borderColor: colors.grayLight,
  },
  stepActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.grayLight,
  },
  stepLineDone: {
    backgroundColor: colors.success,
  },
  stepLabel: {
    fontSize: fonts.small,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Header icon
  headerIcon: {
    alignItems: 'center',
    marginBottom: 12,
  },

  // Step 1 styles
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: fonts.title, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: fonts.regular, color: colors.textLight, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  form: { gap: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: 12,
  },
  inputError: {
    borderWidth: 2,
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  fieldError: {
    color: colors.danger,
    fontSize: fonts.tiny,
    marginTop: 4,
    marginLeft: 4,
  },
  inputIcon: {
    paddingLeft: 16,
  },
  inputWithIcon: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
    fontSize: fonts.regular,
    color: colors.text,
  },
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
    paddingLeft: 12,
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

  // Google styles
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.grayLight,
  },
  dividerText: {
    color: colors.gray,
    fontSize: fonts.small,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.grayLight,
    gap: 10,
  },
  googleIconBtn: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    color: colors.text,
    fontSize: fonts.regular,
    fontWeight: '600',
  },
  googleInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 10,
  },
  googleInfoIcon: {
    width: 24,
    height: 24,
  },
  googleInfoName: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: colors.text,
  },
  googleInfoEmail: {
    fontSize: fonts.small,
    color: colors.textLight,
  },

  // Step 2: OTP styles
  otpContent: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  backButtonOtp: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  otpIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpTitle: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  otpPhone: {
    fontWeight: 'bold',
    color: colors.text,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.grayLight,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    backgroundColor: colors.white,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5F0',
  },
  resendContainer: {
    marginTop: 20,
  },
  resendText: {
    fontSize: fonts.regular,
    color: colors.primary,
    fontWeight: '600',
  },

  // Step 3 styles
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
