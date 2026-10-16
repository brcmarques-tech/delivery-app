import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { GET_MEU_CODIGO_DE_ENTREGA } from '../lib/graphql/queries';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';

/**
 * O CÓDIGO DO CLIENTE — o segredo que LIBERA O DINHEIRO.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * REGRA INVIOLÁVEL: ESTE COMPONENTE NUNCA PODE RENDERIZAR PARA O ENTREGADOR.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * O app é o mesmo para cliente e entregador (`order/[id].tsx` serve aos dois,
 * chaveado por `isDeliverer`). Se este cartão aparecer na sessão do entregador,
 * o esquema inteiro cai: ele passa a ter o código que deveria RECEBER da pessoa
 * na porta, e a confirmação de entrega volta a ser um botão com passos extras.
 *
 * Há três camadas impedindo isso, e nenhuma delas confia nas outras:
 *
 *  1. o servidor. `meuCodigoDeEntrega` valida que quem pede é o CLIENTE do
 *     pedido; para o entregador ele recusa. É a camada que vale, porque é a
 *     única que o atacante não controla.
 *  2. a prop `ehOCliente`, obrigatória e sem default. Quem monta o componente é
 *     forçado a dizer de quem é a tela — não existe "esqueci de passar".
 *  3. o `skip` do useQuery. Não sendo o cliente, a query NEM SAI. Isso evita o
 *     erro no console e, mais importante, evita o valor em cache do Apollo num
 *     aparelho que troca de sessão.
 *
 * O E2E `scripts/provas/e2e-codigos-entrega.mjs` cobra a camada 1 por três
 * caminhos independentes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Por que o número é tão grande: o cliente mostra a tela ou fala o código em
 * voz alta, na porta, muitas vezes à noite, às vezes para alguém dentro de um
 * carro. Seis dígitos grandes e espaçados resolvem isso; seis dígitos pequenos
 * viram "deixa eu ver de novo" três vezes.
 */

export interface CodigoDoClienteProps {
  orderId: string;
  /**
   * Quem está vendo esta tela é o CLIENTE do pedido?
   *
   * Sem default, de propósito: se fosse opcional, esquecer de passar renderizaria
   * o código para qualquer um.
   */
  ehOCliente: boolean;
}

export function CodigoDoCliente({ orderId, ehOCliente }: CodigoDoClienteProps) {
  const { colors } = useTheme();
  const { data, loading, error, refetch } = useQuery(GET_MEU_CODIGO_DE_ENTREGA, {
    variables: { orderId },
    // Código em cache é código que pode reaparecer na sessão seguinte do mesmo
    // aparelho. Aparelho compartilhado não é hipótese remota.
    fetchPolicy: 'network-only',
    skip: !ehOCliente,
  });

  if (!ehOCliente) return null;

  const codigo: string | null = data?.meuCodigoDeEntrega || null;
  if (!loading && !codigo && !error) return null;

  return (
    <View style={[estilos.caixa, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      <View style={estilos.cabecalho}>
        <Ionicons name="lock-closed" size={22} color={colors.primary} />
        <Text style={[estilos.titulo, { color: colors.text }]}>Seu código de entrega</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 14 }} />
      ) : error ? (
        <TouchableOpacity style={estilos.tentarNovamente} onPress={() => refetch()}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
          <Text style={[estilos.tentarTexto, { color: colors.primary }]}>
            Não deu para carregar. Toque para tentar de novo.
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={[estilos.codigo, { color: colors.primary }]}>{codigo}</Text>
      )}

      <Text style={[estilos.ajuda, { color: colors.textLight }]}>
        Informe este código ao entregador só quando tiver o pedido em mãos. É ele que conclui a
        entrega e libera o pagamento — então não passe antes de receber.
      </Text>
    </View>
  );
}

// `fonts` aqui são TAMANHOS; o peso vem de `fontWeight`, como no resto do app.
// O 40 do código é literal: `fonts.title` (22) não se lê de dentro de um carro,
// à noite, e é essa a situação real de uso.
const estilos = StyleSheet.create({
  caixa: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontSize: fonts.large, fontWeight: 'bold' },
  codigo: {
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 10,
    textAlign: 'center',
    marginVertical: 10,
  },
  ajuda: { fontSize: fonts.small, lineHeight: 18, textAlign: 'center' },
  tentarNovamente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  tentarTexto: { fontSize: fonts.small, textDecorationLine: 'underline' },
});
