import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { GET_MEU_CODIGO_DE_ENTREGADOR } from '../lib/graphql/queries';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';

/**
 * O CÓDIGO DO PRÓPRIO ENTREGADOR, para ele DITAR ao lojista na coleta.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ESTE COMPONENTE É O ÚNICO LUGAR DO APP QUE DEPENDE DO TERCEIRO CÓDIGO.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Está isolado num arquivo só por isso. O desenho de três códigos (lojista,
 * entregador, cliente) está em discussão: há a opção de ficar em DOIS, com o
 * entregador apenas RECOLHENDO o código da loja e o do cliente, sem ditar nada.
 *
 * Se essa decisão vier, apaga-se o uso deste componente em deliveries.tsx — uma
 * linha — e nada mais do fluxo muda. Nenhuma outra tela sabe que ele existe.
 *
 * O que se perde com a decisão de dois códigos, para a escolha ser informada: a
 * digitação do lojista é a ÚNICA prova de que a loja entregou aquele pedido ao
 * entregador certo. Sem ela, um entregador que coletou pode alegar que coletou
 * outro pedido, e não há nada do lado da loja que diga o contrário. Um
 * meio-caminho possível é exigir a digitação do lojista só acima de um
 * determinado valor de pedido.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `network-only` não é cosmético. Código em cache é código que pode aparecer na
 * tela depois de um logout, ou na sessão de outra pessoa no mesmo aparelho —
 * aparelho compartilhado entre entregadores é comum.
 */

export interface CodigoDoEntregadorProps {
  orderId: string;
  /** Já registrou o código da loja? Muda o que o texto pede à pessoa. */
  codigoDaLojaJaRegistrado: boolean;
}

export function CodigoDoEntregador({ orderId, codigoDaLojaJaRegistrado }: CodigoDoEntregadorProps) {
  const { colors } = useTheme();
  const { data, loading, error } = useQuery(GET_MEU_CODIGO_DE_ENTREGADOR, {
    variables: { orderId },
    fetchPolicy: 'network-only',
  });

  const codigo: string | null = data?.meuCodigoDeEntregador || null;

  // Sem código não há caixa: pedido antigo (sem códigos) ou corrida ainda não
  // aceita. Melhor não desenhar nada do que desenhar uma caixa vazia que a
  // pessoa fica olhando sem entender.
  if (!loading && !codigo) return null;

  return (
    <View style={[estilos.caixa, { backgroundColor: colors.grayLight, borderColor: colors.primary }]}>
      <View style={estilos.linhaTitulo}>
        <Ionicons name="megaphone" size={16} color={colors.primary} />
        <Text style={[estilos.titulo, { color: colors.text }]}>Dite este código na loja</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
      ) : (
        <Text style={[estilos.codigo, { color: colors.primary }]}>{codigo}</Text>
      )}

      {codigoDaLojaJaRegistrado && (
        <Text style={[estilos.ajuda, { color: colors.textLight }]}>
          Falta o lojista digitar este código.
        </Text>
      )}

      {!!error && (
        <Text style={[estilos.ajuda, { color: colors.danger }]}>
          Não deu para carregar seu código agora. Puxe a lista para baixo para tentar de novo.
        </Text>
      )}
    </View>
  );
}

// `fonts` aqui são TAMANHOS; o peso vem de `fontWeight`, como no resto do app.
// O 28 do código é literal: ele é DITADO em voz alta, às vezes de longe, e
// `fonts.title` (22) não dá o mesmo conforto de leitura.
const estilos = StyleSheet.create({
  caixa: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 12,
    marginTop: 10,
  },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titulo: { fontSize: fonts.small, fontWeight: '600' },
  codigo: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 6,
    textAlign: 'center',
    marginVertical: 6,
  },
  ajuda: { fontSize: fonts.tiny, lineHeight: 15, textAlign: 'center' },
});
