import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { useAlert } from '../src/contexts/AlertContext';
import { fonts } from '../src/theme';

const IMPEDIMENTOS = gql`
  query ImpedimentosParaExcluirConta {
    impedimentosParaExcluirConta
  }
`;
const EXCLUIR = gql`
  mutation ExcluirMinhaConta($senha: String, $confirmacao: String) {
    excluirMinhaConta(senha: $senha, confirmacao: $confirmacao)
  }
`;

const VERMELHO = '#E74C3C';

/**
 * KAN-326 / LGPD (e exigência da Google Play): o próprio titular exclui a conta.
 * Os dados pessoais são apagados; pedidos e valores ficam no histórico das lojas
 * como "Cliente removido".
 */
export default function ExcluirContaScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { alert } = useAlert();
  const [senha, setSenha] = useState('');
  const [comGoogle, setComGoogle] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const { data, loading } = useQuery(IMPEDIMENTOS, { fetchPolicy: 'network-only' });
  const [excluir, { loading: excluindo }] = useMutation(EXCLUIR);
  const impedimentos: string[] = data?.impedimentosParaExcluirConta || [];
  const preenchido = comGoogle ? confirmacao.trim().toUpperCase() === 'EXCLUIR' : senha.length > 0;

  const confirmar = () => {
    setErro('');
    alert(
      'Excluir conta',
      'Sua conta e seus dados pessoais serão apagados. Isso não pode ser desfeito.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await excluir({ variables: comGoogle ? { confirmacao } : { senha } });
              await logout();
              router.replace('/');
            } catch (e: any) {
              setErro(e?.graphQLErrors?.[0]?.message || e?.message || 'Não foi possível excluir a conta.');
            }
          },
        },
      ],
    );
  };

  const Item = ({ icone, texto }: { icone: any; texto: string }) => (
    <View style={s.item}>
      <Ionicons name={icone} size={16} color={colors.textSecondary} />
      <Text style={[s.itemTexto, { color: colors.text }]}>{texto}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.titulo, { color: colors.text }]}>Excluir minha conta</Text>
        <View style={{ width: 18 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={[s.secao, { color: colors.text }]}>O que é apagado</Text>
        <Item icone="person-outline" texto="Nome, e-mail, telefone, CPF e foto" />
        <Item icone="location-outline" texto="Endereços salvos e endereços dos seus pedidos" />
        <Item icone="card-outline" texto="Cartões salvos" />
        <Item icone="document-outline" texto="Documentos e dados de entregador, se houver" />

        <Text style={[s.secao, { color: colors.text, marginTop: 16 }]}>O que fica</Text>
        <Text style={[s.explica, { color: colors.textSecondary }]}>
          Os pedidos e os valores continuam no histórico das lojas, sem o seu nome ("Cliente removido"), porque a loja e a
          plataforma precisam deles por obrigação fiscal.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : impedimentos.length > 0 ? (
          <View style={[s.aviso, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: '#92400E', fontWeight: '700' }}>Ainda não dá para excluir</Text>
              {impedimentos.map((m) => (
                <Text key={m} style={{ color: '#92400E', fontSize: fonts.small }}>{m}</Text>
              ))}
            </View>
          </View>
        ) : (
          <>
            {comGoogle ? (
              <>
                <Text style={[s.rotulo, { color: colors.text }]}>Digite EXCLUIR para confirmar</Text>
                <TextInput
                  style={[s.input, { borderColor: colors.border, color: colors.text }]}
                  value={confirmacao}
                  onChangeText={setConfirmacao}
                  autoCapitalize="characters"
                  placeholder="EXCLUIR"
                  placeholderTextColor={colors.textSecondary}
                />
              </>
            ) : (
              <>
                <Text style={[s.rotulo, { color: colors.text }]}>Confirme com a sua senha</Text>
                <TextInput
                  style={[s.input, { borderColor: colors.border, color: colors.text }]}
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                  placeholder="Sua senha"
                  placeholderTextColor={colors.textSecondary}
                />
              </>
            )}
            <TouchableOpacity onPress={() => { setComGoogle(!comGoogle); setErro(''); }}>
              <Text style={[s.link, { color: colors.primary }]}>
                {comGoogle ? 'Tenho senha' : 'Entrei com o Google e não tenho senha'}
              </Text>
            </TouchableOpacity>

            {!!erro && <Text style={s.erro}>{erro}</Text>}

            <TouchableOpacity
              style={[s.botao, { opacity: preenchido && !excluindo ? 1 : 0.5 }]}
              disabled={!preenchido || excluindo}
              onPress={confirmar}
            >
              {excluindo ? <ActivityIndicator color="#fff" /> : <Text style={s.botaoTexto}>Excluir minha conta</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1 },
  titulo: { fontSize: fonts.large, fontWeight: '700' },
  secao: { fontSize: fonts.regular, fontWeight: '700', marginBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  itemTexto: { fontSize: fonts.small, flex: 1 },
  explica: { fontSize: fonts.small, lineHeight: 19 },
  aviso: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, marginTop: 20 },
  rotulo: { fontSize: fonts.small, fontWeight: '600', marginTop: 20, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: fonts.regular },
  link: { fontSize: fonts.small, fontWeight: '600', marginTop: 10 },
  erro: { color: VERMELHO, fontSize: fonts.small, marginTop: 12 },
  botao: { backgroundColor: VERMELHO, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  botaoTexto: { color: '#fff', fontSize: fonts.regular, fontWeight: '700' },
});
