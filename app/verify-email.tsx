import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { SEND_EMAIL_VERIFICATION, CONFIRM_EMAIL_VERIFICATION } from '../src/lib/graphql/mutations';
import { fonts } from '../src/theme';

export default function VerifyEmailScreen() {
  const { user, updateUser } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);
  // BUGFIX: o interval do cooldown e o timeout de voltar nunca eram limpos —
  // sair da tela no meio deixava um timer rodando por ate 60s e chamando
  // setState num componente desmontado.
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    if (backTimerRef.current) clearTimeout(backTimerRef.current);
  }, []);

  const [sendVerification] = useMutation(SEND_EMAIL_VERIFICATION);
  const [confirmVerification] = useMutation(CONFIRM_EMAIL_VERIFICATION);

  async function handleSendCode() {
    setSending(true);
    setError('');
    try {
      await sendVerification({ variables: { userType: 'APP' } });
      setSent(true);
      setCooldown(60);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      const interval = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
      cooldownRef.current = interval;
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar codigo.');
    }
    setSending(false);
  }

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Digite o codigo de 6 digitos.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      await confirmVerification({ variables: { code: fullCode, userType: 'APP' } });
      setSuccess(true);
      if (updateUser && user) {
        updateUser({ ...user, emailVerified: true });
      }
      // BUGFIX: este timeout nunca era limpo — sair da tela antes dele disparar
      // chamava router.back() de um componente desmontado.
      backTimerRef.current = setTimeout(() => router.back(), 1500);
    } catch (err: any) {
      setError(err.message || 'Codigo invalido ou expirado.');
    }
    setVerifying(false);
  }

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Email verificado!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textLight }]}>
            Agora voce recebera notificacoes por email.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Verificar Email</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="mail" size={36} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {sent ? 'Digite o codigo' : 'Verificar seu email'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>
          {sent
            ? `Enviamos um codigo de 6 digitos para ${user?.email}`
            : `Enviaremos um codigo de verificacao para ${user?.email}`}
        </Text>

        {!sent ? (
          <>
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleSendCode}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Enviar Codigo</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
              <Text style={[styles.skipText, { color: colors.textLight }]}>Agora nao</Text>
            </TouchableOpacity>
            <View style={[styles.warningBanner, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.textLight }]}>
                Sem verificar, voce pode perder promocoes e cupons das suas lojas favoritas
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.codeRow}>
              {code.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputs.current[i] = ref; }}
                  style={[
                    styles.codeInput,
                    { backgroundColor: colors.card, color: colors.text, borderColor: digit ? colors.primary : colors.border },
                  ]}
                  value={digit}
                  onChangeText={(v) => handleCodeChange(i, v)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sendButtonText}>Verificar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSendCode}
              disabled={cooldown > 0 || sending}
              style={styles.resendButton}
            >
              <Text style={[styles.resendText, { color: cooldown > 0 ? colors.gray : colors.primary }]}>
                {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar codigo'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.danger + '15' }]}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: fonts.large, fontWeight: '600' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: fonts.regular, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
  },
  sendButtonText: { color: '#FFFFFF', fontSize: fonts.regular, fontWeight: '600' },
  codeRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  resendButton: { marginTop: 12 },
  resendText: { fontSize: fonts.regular, fontWeight: '500' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    width: '100%',
  },
  errorText: { fontSize: fonts.small, flex: 1 },
  skipButton: { marginTop: 16 },
  skipText: { fontSize: fonts.regular, fontWeight: '500' },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
  },
  warningText: { fontSize: fonts.small, flex: 1, lineHeight: 18 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  successIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  successTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  successSubtitle: { fontSize: fonts.regular, textAlign: 'center' },
});
