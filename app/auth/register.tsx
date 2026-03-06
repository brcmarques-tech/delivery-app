import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, fonts } from '../../src/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'VENDOR' | 'DELIVERER'>('CUSTOMER');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !phone || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, phone, role);
      router.replace('/(tabs)/home');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel criar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const roles = [
    { key: 'CUSTOMER' as const, label: 'Comprar' },
    { key: 'VENDOR' as const, label: 'Vender' },
    { key: 'DELIVERER' as const, label: 'Entregar' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>O que voce quer fazer?</Text>

      <View style={styles.roleContainer}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.roleButton, role === r.key && styles.roleButtonActive]}
            onPress={() => setRole(r.key)}
          >
            <Text style={[styles.roleText, role === r.key && styles.roleTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
          placeholder="Senha (min. 6 caracteres)"
          placeholderTextColor={colors.gray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Criando...' : 'Criar conta'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Ja tem conta? <Text style={styles.linkBold}>Entrar</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: fonts.title, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fonts.regular, color: colors.textLight, marginTop: 8, marginBottom: 24 },
  roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.grayLight,
    alignItems: 'center',
  },
  roleButtonActive: { borderColor: colors.primary, backgroundColor: '#FFF3EE' },
  roleText: { fontSize: fonts.regular, color: colors.textLight, fontWeight: '600' },
  roleTextActive: { color: colors.primary },
  form: { gap: 16 },
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: fonts.large, fontWeight: 'bold' },
  link: { textAlign: 'center', color: colors.textLight, fontSize: fonts.regular, marginTop: 16 },
  linkBold: { color: colors.primary, fontWeight: 'bold' },
});
