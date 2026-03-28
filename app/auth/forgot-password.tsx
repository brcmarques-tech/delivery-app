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
import { useTheme } from '../../src/contexts/ThemeContext';
import { fonts } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
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
      style={[styles.container, { backgroundColor: colors.white }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Recuperar senha</Text>
        <Text style={[styles.subtitle, { color: colors.textLight }]}>
          Informe seu email e enviaremos um link para redefinir sua senha.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.grayLight, color: colors.text }]}
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
          <Text style={[styles.link, { color: colors.primary }]}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: 6,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.regular,
  },
  button: {
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  link: {
    textAlign: 'center',
    fontSize: fonts.regular,
    marginTop: 12,
    fontWeight: '600',
  },
});
