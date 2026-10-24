import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@apollo/client';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAlert } from '../src/contexts/AlertContext';
import { MINHA_FIDELIDADE } from '../src/lib/graphql/queries';
import { fonts } from '../src/theme';

/**
 * CLIENTE FIEL (KAN-12)
 *
 * A tela existe para responder duas perguntas, nessa ordem:
 *   "o que eu já ganhei?" — os cupons, com o código grande e copiável;
 *   "quanto falta para o próximo?" — a barra por loja.
 *
 * O cupom vem PRIMEIRO de propósito: prêmio que o cliente não encontra é o
 * mesmo que não existir, e ele abre esta tela para usar o que ganhou, não para
 * contemplar progresso.
 */
export default function FidelidadeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const [copiado, setCopiado] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(MINHA_FIDELIDADE, {
    fetchPolicy: 'cache-and-network',
  });

  const copiar = useCallback(
    async (codigo: string) => {
      try {
        await Clipboard.setStringAsync(codigo);
        setCopiado(codigo);
        setTimeout(() => setCopiado(null), 2500);
      } catch {
        showAlert({ title: 'Não consegui copiar', message: `Use o código: ${codigo}` });
      }
    },
    [showAlert],
  );

  const f = data?.minhaFidelidade;
  const cupons = f?.cupons || [];
  const porLoja = f?.porLoja || [];

  const validade = (iso?: string | null) => {
    if (!iso) return 'sem prazo';
    const dias = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
    if (dias < 0) return 'expirado';
    if (dias === 0) return 'vence hoje';
    if (dias === 1) return 'vence amanhã';
    return `vence em ${dias} dias`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cliente fiel</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && !f ? (
        <View style={styles.centro}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => refetch()} tintColor={colors.primary} />
          }
        >
          {/* Resumo */}
          <View style={[styles.resumo, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoNumero, { color: colors.primary }]}>{f?.comprasNoTotal ?? 0}</Text>
              <Text style={[styles.resumoRotulo, { color: colors.textLight }]}>compras</Text>
            </View>
            <View style={[styles.resumoDivisor, { backgroundColor: colors.border }]} />
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoNumero, { color: colors.primary }]}>{f?.lojasOndeSouFiel ?? 0}</Text>
              <Text style={[styles.resumoRotulo, { color: colors.textLight }]}>
                {f?.lojasOndeSouFiel === 1 ? 'loja fiel' : 'lojas fiéis'}
              </Text>
            </View>
            <View style={[styles.resumoDivisor, { backgroundColor: colors.border }]} />
            <View style={styles.resumoItem}>
              <Text style={[styles.resumoNumero, { color: colors.success }]}>{cupons.length}</Text>
              <Text style={[styles.resumoRotulo, { color: colors.textLight }]}>
                {cupons.length === 1 ? 'cupom' : 'cupons'}
              </Text>
            </View>
          </View>

          {/* Cupons ganhos */}
          <Text style={[styles.secao, { color: colors.text }]}>Seus cupons</Text>
          {cupons.length === 0 ? (
            <View style={[styles.vazio, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="gift-outline" size={28} color={colors.gray} />
              <Text style={[styles.vazioTexto, { color: colors.textLight }]}>
                Você ainda não ganhou cupons. Continue comprando nas suas lojas favoritas:
                a cada 5 compras no mês ou 10 no total, a loja te dá um desconto.
              </Text>
            </View>
          ) : (
            cupons.map((c: any) => {
              const expirado = c.expiresAt && new Date(c.expiresAt) < new Date();
              const usado = c.maxUses > 0 && c.usesCount >= c.maxUses;
              const indisponivel = expirado || usado || !c.isActive;
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={indisponivel ? 1 : 0.7}
                  onPress={() => !indisponivel && copiar(c.code)}
                  style={[
                    styles.cupom,
                    {
                      backgroundColor: colors.card,
                      borderColor: indisponivel ? colors.border : colors.success,
                      opacity: indisponivel ? 0.55 : 1,
                    },
                  ]}
                >
                  <View style={[styles.cupomSelo, { backgroundColor: (indisponivel ? colors.gray : colors.success) + '20' }]}>
                    <Text style={[styles.cupomPercent, { color: indisponivel ? colors.gray : colors.success }]}>
                      {c.discountType === 'PERCENT' ? `${Math.round(Number(c.discountValue))}%` : `R$${Number(c.discountValue).toFixed(0)}`}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cupomLoja, { color: colors.text }]} numberOfLines={1}>
                      {c.store?.name || 'Loja'}
                    </Text>
                    <Text style={[styles.cupomCodigo, { color: colors.text }]}>{c.code}</Text>
                    <Text style={[styles.cupomInfo, { color: colors.textLight }]}>
                      {usado ? 'já utilizado' : expirado ? 'expirado' : validade(c.expiresAt)}
                    </Text>
                  </View>
                  {!indisponivel && (
                    <View style={styles.cupomAcao}>
                      <Ionicons
                        name={copiado === c.code ? 'checkmark-circle' : 'copy-outline'}
                        size={18}
                        color={copiado === c.code ? colors.success : colors.primary}
                      />
                      <Text style={[styles.cupomAcaoTexto, { color: copiado === c.code ? colors.success : colors.primary }]}>
                        {copiado === c.code ? 'copiado' : 'copiar'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {/* Progresso por loja */}
          <Text style={[styles.secao, { color: colors.text, marginTop: 18 }]}>Seu progresso</Text>
          {porLoja.length === 0 ? (
            <View style={[styles.vazio, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="storefront-outline" size={28} color={colors.gray} />
              <Text style={[styles.vazioTexto, { color: colors.textLight }]}>
                Assim que você concluir a primeira compra, o progresso aparece aqui.
              </Text>
            </View>
          ) : (
            porLoja.map((l: any) => {
              // A barra mostra o quanto falta para o PRÓXIMO prêmio, não o total
              // de compras: é o número que faz o cliente voltar.
              const alvo = l.faltamParaOProximoPremio + (l.proximoMarco.includes('mês') ? 5 - l.faltamParaOProximoPremio : 10 - l.faltamParaOProximoPremio);
              const feito = Math.max(0, alvo - l.faltamParaOProximoPremio);
              const pct = alvo > 0 ? Math.min(100, (feito / alvo) * 100) : 0;
              return (
                <TouchableOpacity
                  key={l.storeId}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/store/${l.storeId}`)}
                  style={[styles.loja, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.lojaTopo}>
                    <Text style={[styles.lojaNome, { color: colors.text }]} numberOfLines={1}>
                      {l.storeName}
                    </Text>
                    {l.clienteFiel && (
                      <View style={[styles.selo, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="ribbon" size={11} color={colors.primary} />
                        <Text style={[styles.seloTexto, { color: colors.primary }]}>Cliente fiel</Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.barra, { backgroundColor: colors.grayLight }]}>
                    <View style={[styles.barraCheia, { backgroundColor: colors.primary, width: `${pct}%` }]} />
                  </View>
                  <Text style={[styles.lojaInfo, { color: colors.textLight }]}>
                    {l.comprasConcluidas} compra{l.comprasConcluidas === 1 ? '' : 's'} ·{' '}
                    faltam {l.faltamParaOProximoPremio} para {l.proximoMarco}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}

          <Text style={[styles.rodape, { color: colors.gray }]}>
            Os cupons são seus: valem só na sua conta e na loja que te premiou.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: fonts.small, fontWeight: 'bold' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    marginBottom: 16,
  },
  resumoItem: { flex: 1, alignItems: 'center', gap: 2 },
  resumoNumero: { fontSize: fonts.large, fontWeight: 'bold' },
  resumoRotulo: { fontSize: fonts.tiny },
  resumoDivisor: { width: 1, height: 28 },
  secao: { fontSize: fonts.small, fontWeight: 'bold', marginBottom: 8 },
  vazio: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  vazioTexto: { fontSize: fonts.tiny, textAlign: 'center', lineHeight: 16 },
  cupom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  cupomSelo: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cupomPercent: { fontSize: fonts.small, fontWeight: 'bold' },
  cupomLoja: { fontSize: fonts.tiny, fontWeight: '600' },
  cupomCodigo: { fontSize: fonts.small, fontWeight: 'bold', letterSpacing: 0.5 },
  cupomInfo: { fontSize: fonts.tiny },
  cupomAcao: { alignItems: 'center', gap: 2 },
  cupomAcaoTexto: { fontSize: fonts.tiny, fontWeight: '600' },
  loja: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 8, gap: 6 },
  lojaTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  lojaNome: { fontSize: fonts.small, fontWeight: '600', flex: 1 },
  selo: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  seloTexto: { fontSize: fonts.tiny, fontWeight: '700' },
  barra: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barraCheia: { height: 6, borderRadius: 3 },
  lojaInfo: { fontSize: fonts.tiny },
  rodape: { fontSize: fonts.tiny, textAlign: 'center', marginTop: 18 },
});
