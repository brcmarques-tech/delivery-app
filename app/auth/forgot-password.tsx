import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { REQUEST_PASSWORD_RESET } from '../../src/lib/graphql/mutations';
import { useAlert } from '../../src/contexts/AlertContext';
import { colors, fonts } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const { alert } = useAlert();
  const [email, setEmail] = useState('');
  const [requestReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET);

  async function handleSubmit() {
    if (!email) {
      alert('Erro', 'Preencha o email');
      return;
    }
    try {
      await requestReset({ variables: { email } });
      alert(
        'Email enviado',
        'Verifique sua caixa de entrada para redefinir sua senha.',
      );
    } catch (err: any) {
      const message =
        err?.graphQLErrors?.[0]?.message || 'Erro ao enviar email';
      alert('Erro', message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.subtitle}>
          Informe seu email e enviaremos um link para redefinir sua senha.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.gray}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Enviando...' : 'Enviar link de recuperacao'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 16,
    fontSize: fonts.regular,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: fonts.regular,
    marginTop: 16,
    fontWeight: '600',
  },
});
