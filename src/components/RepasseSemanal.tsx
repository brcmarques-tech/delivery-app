import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@apollo/client';
import { MEU_SALDO_DE_ENTREGAS } from '../lib/graphql/queries';
import { SALVAR_CHAVE_PIX } from '../lib/graphql/mutations';
import { formatarReais } from '../lib/dinheiro';

/** "qua, 28/10" a partir do instante que a API manda (00:00 de Brasília). */
function quarta(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `qua, ${dd}/${mm}`;
}

function dataCurta(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Saldo das entregas pagas por fora do Pagar.me (frete dos pedidos PIX): vira
 * saldo e cai toda quarta, pelas entregas de segunda a domingo da semana
 * anterior — o mesmo modelo do iFood. O que entra pelo cartão continua no saldo
 * do Pagar.me, mais abaixo nesta tela.
 */
export function RepasseSemanal({ colors }: { colors: any }) {
  const { data, loading, refetch } = useQuery(MEU_SALDO_DE_ENTREGAS, { fetchPolicy: 'cache-and-network' });
  const [salvarChave, { loading: salvando }] = useMutation(SALVAR_CHAVE_PIX);
  const saldo = data?.meuSaldoDeEntregas;
  const [chave, setChave] = useState('');
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (saldo && !editando) setChave(saldo.chavePix || '');
  }, [saldo?.chavePix]);

  if (loading && !saldo) {
    return (
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center' }]}>
        <ActivityIndicator color="#f97316" />
      </View>
    );
  }
  if (!saldo) return null;

  const semChave = !saldo.chavePix;
  const atrasado = saldo.proximoPagamento && new Date(saldo.proximoPagamento).getTime() < Date.now() - 24 * 60 * 60 * 1000;

  async function salvar() {
    setErro('');
    try {
      await salvarChave({ variables: { chave } });
      setEditando(false);
      refetch();
    } catch (e: any) {
      setErro(e?.graphQLErrors?.[0]?.message || 'Não foi possível salvar a chave.');
    }
  }

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={s.linha}>
        <Ionicons name="calendar-outline" size={18} color="#f97316" />
        <Text style={[s.titulo, { color: colors.text }]}>Entregas pagas toda quarta</Text>
      </View>

      <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>
        Pedidos pagos no PIX: o seu ganho fica guardado e cai na quarta-feira, pelas entregas de segunda a domingo da semana anterior.
      </Text>

      <View style={[s.destaque, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 10, color: colors.textSecondary }}>
          {saldo.proximoPagamento ? (atrasado ? 'Pagamento em atraso' : `Próximo pagamento · ${quarta(saldo.proximoPagamento)}`) : 'Nada a receber agora'}
        </Text>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: atrasado ? '#dc2626' : '#16a34a', marginTop: 2 }}>
          {formatarReais(saldo.proximoPagamentoCents / 100)}
        </Text>
        {saldo.aReceberCents > saldo.proximoPagamentoCents && (
          <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
            Total a receber: {formatarReais(saldo.aReceberCents / 100)}
          </Text>
        )}
      </View>

      {/* Chave PIX */}
      <Text style={[s.rotulo, { color: colors.text }]}>Sua chave PIX</Text>
      {semChave || editando ? (
        <View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TextInput
              value={chave}
              onChangeText={setChave}
              placeholder="CPF, celular, e-mail ou chave aleatória"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              style={[s.input, { flex: 1, color: colors.text, borderColor: colors.border }]}
            />
            <TouchableOpacity style={s.botao} onPress={salvar} disabled={salvando || !chave.trim()}>
              {salvando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.botaoTexto}>Salvar</Text>}
            </TouchableOpacity>
          </View>
          {!!erro && <Text style={{ fontSize: 10, color: '#dc2626', marginTop: 4 }}>{erro}</Text>}
          {semChave && !erro && (
            <Text style={{ fontSize: 10, color: '#dc2626', marginTop: 4 }}>
              Cadastre a chave para receber o pagamento de quarta.
            </Text>
          )}
        </View>
      ) : (
        <TouchableOpacity style={s.linha} onPress={() => setEditando(true)}>
          <Text style={{ fontSize: 12, color: colors.text, flex: 1 }}>{saldo.chavePix}</Text>
          <Text style={{ fontSize: 10, color: '#f97316' }}>Alterar</Text>
        </TouchableOpacity>
      )}

      {saldo.entregas.length > 0 && (
        <>
          <Text style={[s.rotulo, { color: colors.text }]}>A receber</Text>
          {saldo.entregas.map((e: any) => (
            <View key={e.orderNumber} style={s.item}>
              <Text style={{ fontSize: 10, color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
                {dataCurta(e.concluidoEm)} · {e.loja}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginRight: 8 }}>{quarta(e.pagamentoPrevisto)}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{formatarReais(e.cents / 100)}</Text>
            </View>
          ))}
        </>
      )}

      {saldo.pagos.length > 0 && (
        <>
          <Text style={[s.rotulo, { color: colors.text }]}>Já recebido</Text>
          {saldo.pagos.map((p: any) => (
            <View key={p.id} style={s.item}>
              <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
              <Text style={{ fontSize: 10, color: colors.textSecondary, flex: 1, marginLeft: 4 }}>
                {dataCurta(p.pagoEm)} · {p.quantidade} entrega(s)
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#16a34a' }}>{formatarReais(p.totalCents / 100)}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 12 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titulo: { fontSize: 12, fontWeight: 'bold' },
  destaque: { borderRadius: 10, padding: 10, marginTop: 10, marginBottom: 4 },
  rotulo: { fontSize: 10, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12 },
  botao: { backgroundColor: '#f97316', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  botaoTexto: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
});
