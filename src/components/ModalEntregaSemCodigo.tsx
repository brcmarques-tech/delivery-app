import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';

/**
 * ENTREGA SEM O CÓDIGO DO CLIENTE.
 *
 * Para quando o cliente não atende, está dormindo, pediu para deixar na
 * portaria, ou simplesmente se recusa a informar o código. Existe para o
 * pagamento do entregador não ficar preso à boa vontade de outra pessoa — sem
 * isso, o entregador rápido abandona a plataforma.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O MOTIVO NÃO É FORMALIDADE. É A PEÇA DE DEFESA.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Registrar aqui abre uma janela de contestação: o cliente é avisado na hora,
 * com o prazo, e se ele contestar a decisão passa a ser humana — e quem decide
 * vai ler ESTE texto, junto com o GPS e o horário. "nao atendeu" não sustenta
 * decisão nenhuma; por isso o servidor exige 10 caracteres e a tela diz o
 * porquê, em vez de só bloquear o botão.
 *
 * A tela também avisa que o GPS vai junto. Não é pedido de permissão
 * escondido: é a pessoa sabendo que a localização dela é o que vai defendê-la
 * se o cliente disser que não recebeu nada.
 */

const MINIMO = 10;
const MAXIMO = 300;

export interface ModalEntregaSemCodigoProps {
  visivel: boolean;
  numeroDoPedido?: string;
  /** Horas da janela de contestação, para a tela não inventar o prazo. */
  horasDeContestacao?: number;
  temGps: boolean;
  carregando?: boolean;
  erro?: string | null;
  onConfirmar: (motivo: string) => void;
  onFechar: () => void;
}

export function ModalEntregaSemCodigo({
  visivel,
  numeroDoPedido,
  horasDeContestacao = 24,
  temGps,
  carregando,
  erro,
  onConfirmar,
  onFechar,
}: ModalEntregaSemCodigoProps) {
  const { colors } = useTheme();
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (visivel) setMotivo('');
  }, [visivel]);

  const limpo = motivo.trim();
  const suficiente = limpo.length >= MINIMO;
  const podeEnviar = suficiente && !carregando;

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <KeyboardAvoidingView
        style={estilos.fundo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={estilos.centro} keyboardShouldPersistTaps="handled">
          <View style={[estilos.caixa, { backgroundColor: colors.card }]}>
            <View style={estilos.cabecalho}>
              <Ionicons name="document-text" size={26} color={colors.warning} />
              <Text style={[estilos.titulo, { color: colors.text }]}>Entrega sem o código</Text>
            </View>

            <Text style={[estilos.explicacao, { color: colors.textLight }]}>
              {numeroDoPedido ? `Pedido #${numeroDoPedido}. ` : ''}
              Conte o que aconteceu. O cliente é avisado agora e tem {horasDeContestacao}h para
              contestar; se ele contestar, alguém vai ler exatamente o que você escrever aqui.
            </Text>

            <TextInput
              value={motivo}
              onChangeText={(t) => setMotivo(t.slice(0, MAXIMO))}
              editable={!carregando}
              multiline
              numberOfLines={4}
              maxLength={MAXIMO}
              placeholder="Ex.: toquei a campainha 3 vezes e liguei duas, ninguém atendeu; deixei com o porteiro"
              placeholderTextColor={colors.gray}
              style={[
                estilos.campo,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: erro ? colors.danger : suficiente ? colors.success : colors.border,
                },
              ]}
              textAlignVertical="top"
              accessibilityLabel="Motivo da entrega sem código"
            />

            {/* Diz o que falta, não "campo inválido". A pessoa está de pé na
                rua: ela precisa saber quantos caracteres, não que errou. */}
            <Text
              style={[
                estilos.contador,
                { color: suficiente ? colors.success : colors.textLight },
              ]}
            >
              {suficiente
                ? `${limpo.length} caracteres`
                : `faltam ${MINIMO - limpo.length} caracteres`}
            </Text>

            <View style={[estilos.gpsCaixa, { backgroundColor: colors.grayLight }]}>
              <Ionicons
                name={temGps ? 'location' : 'location-outline'}
                size={16}
                color={temGps ? colors.success : colors.warning}
              />
              <Text style={[estilos.gpsTexto, { color: colors.textLight }]}>
                {temGps
                  ? 'Sua localização será registrada junto — é ela que te defende numa contestação.'
                  : 'Sem localização disponível. O registro vale, mas sem GPS você fica com menos prova.'}
              </Text>
            </View>

            {!!erro && (
              <View style={[estilos.erroCaixa, { backgroundColor: colors.danger + '18' }]}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={[estilos.erroTexto, { color: colors.danger }]}>{erro}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[estilos.botao, { backgroundColor: podeEnviar ? colors.warning : colors.gray }]}
              onPress={() => podeEnviar && onConfirmar(limpo)}
              disabled={!podeEnviar}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={estilos.botaoTexto}>Registrar entrega sem código</Text>
              )}
            </TouchableOpacity>

            {!carregando && (
              <TouchableOpacity style={estilos.cancelar} onPress={onFechar}>
                <Text style={[estilos.cancelarTexto, { color: colors.gray }]}>
                  Voltar e tentar o código
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// `fonts` aqui são TAMANHOS; o peso vem de `fontWeight`, como no resto do app.
const estilos = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  centro: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  caixa: { borderRadius: 16, padding: 22 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  titulo: { fontSize: fonts.xlarge, fontWeight: 'bold', flex: 1 },
  explicacao: { fontSize: fonts.regular, lineHeight: 20, marginBottom: 16 },
  campo: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    minHeight: 96,
    fontSize: fonts.regular,
  },
  contador: { fontSize: fonts.small, textAlign: 'right', marginTop: 6 },
  gpsCaixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  gpsTexto: { fontSize: fonts.small, flex: 1, lineHeight: 17 },
  erroCaixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  erroTexto: { fontSize: fonts.small, flex: 1 },
  botao: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  botaoTexto: { color: '#FFFFFF', fontSize: fonts.large, fontWeight: 'bold' },
  cancelar: { paddingVertical: 12, alignItems: 'center' },
  cancelarTexto: { fontSize: fonts.regular },
});
