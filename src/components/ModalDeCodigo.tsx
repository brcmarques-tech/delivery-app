import React, { useState, useEffect, useRef } from 'react';
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
 * MODAL DE DIGITAÇÃO DE CÓDIGO DE ENTREGA.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * O CÓDIGO É FALADO EM VOZ ALTA, NA PORTA, COM O CELULAR NA MÃO.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Tudo aqui sai dessa frase. São seis dígitos, só número, porque quem dita está
 * de pé num portão e quem digita pode estar na chuva:
 *
 *  - `keyboardType="number-pad"`: abre o teclado numérico, não o alfabético com
 *    um atalho de números. São dois toques de diferença por dígito.
 *  - fonte 30 e `letterSpacing`: o entregador confere o que digitou contra o que
 *    ouviu sem aproximar o celular do rosto.
 *  - só dígitos entram, e o campo para em 6. Colar "12 34 56" ou "123-456"
 *    funciona: a máscara limpa em vez de recusar.
 *  - confirma sozinho ao completar 6 dígitos? NÃO. O envio é explícito, porque
 *    um toque errado vira tentativa errada, e são 5 antes de 15 minutos de
 *    bloqueio. Errar por pressa do software seria o software gastando a chance
 *    da pessoa.
 *
 * O componente não conhece mutation nenhuma. Ele recebe `onConfirmar` e devolve
 * o código; quem sabe qual código é esse, e o que fazer com ele, é a tela. Isso
 * existe porque o mesmo modal serve três digitações diferentes (o entregador
 * digita o da loja e o do cliente; o lojista digita o do entregador), e cada
 * uma tem consequência distinta — a do cliente LIBERA O DINHEIRO.
 */

export interface ModalDeCodigoProps {
  visivel: boolean;
  titulo: string;
  /** O que a pessoa precisa saber antes de digitar. Uma ou duas linhas. */
  explicacao: string;
  /** Texto do botão de confirmar. Diz o que vai acontecer, não "OK". */
  rotuloConfirmar: string;
  carregando?: boolean;
  /** Mensagem de erro do servidor (código errado, bloqueio, ordem). */
  erro?: string | null;
  /** Ação secundária opcional — hoje é "não consegui o código". */
  acaoSecundaria?: { rotulo: string; onPress: () => void };
  onConfirmar: (codigo: string) => void;
  onFechar: () => void;
}

const TAMANHO = 6;

export function ModalDeCodigo({
  visivel,
  titulo,
  explicacao,
  rotuloConfirmar,
  carregando,
  erro,
  acaoSecundaria,
  onConfirmar,
  onFechar,
}: ModalDeCodigoProps) {
  const { colors } = useTheme();
  const [codigo, setCodigo] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Abriu: limpa o que sobrou da vez anterior e foca.
  //
  // Limpar importa de verdade: sem isso, reabrir o modal depois de um código
  // recusado deixaria o valor errado no campo, e o próximo toque em confirmar
  // gastaria mais uma das 5 tentativas com o MESMO erro.
  useEffect(() => {
    if (!visivel) return;
    setCodigo('');
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [visivel]);

  const aoDigitar = (texto: string) => {
    // Aceita o que a pessoa colar ou ditar e limpa: espaço, ponto, hífen.
    setCodigo(texto.replace(/\D/g, '').slice(0, TAMANHO));
  };

  const completo = codigo.length === TAMANHO;
  const podeEnviar = completo && !carregando;

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <KeyboardAvoidingView
        style={estilos.fundo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={estilos.centro}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[estilos.caixa, { backgroundColor: colors.card }]}>
            <View style={estilos.cabecalho}>
              <View style={[estilos.icone, { backgroundColor: colors.primary + '1A' }]}>
                <Ionicons name="keypad" size={26} color={colors.primary} />
              </View>
              <Text style={[estilos.titulo, { color: colors.text }]}>{titulo}</Text>
            </View>

            <Text style={[estilos.explicacao, { color: colors.textLight }]}>{explicacao}</Text>

            {/* Uma caixa por digito. O TextInput de verdade fica por cima, invisivel:
                e ele que recebe o toque, o teclado numerico e o "colar" — as caixas
                so desenham o que ja foi digitado. Antes era um campo unico com
                textAlign como PROPRIEDADE, que o react-native-web ignora: na web os
                numeros ficavam encostados a esquerda. */}
            <View style={estilos.digitos}>
              {Array.from({ length: TAMANHO }).map((_, i) => {
                const digito = codigo[i];
                const daVez = i === codigo.length && !completo;
                const corBorda = erro
                  ? colors.danger
                  : completo
                    ? colors.success
                    : daVez
                      ? colors.primary
                      : digito
                        ? colors.text + '55'
                        : colors.border;
                return (
                  <View
                    key={i}
                    style={[
                      estilos.digito,
                      { backgroundColor: colors.inputBg, borderColor: corBorda },
                      daVez && estilos.digitoDaVez,
                    ]}
                  >
                    <Text style={[estilos.digitoTexto, { color: colors.text }]}>{digito ?? ''}</Text>
                  </View>
                );
              })}
              <TextInput
                ref={inputRef}
                value={codigo}
                onChangeText={aoDigitar}
                keyboardType="number-pad"
                // Sem maxLength: ele cortaria o texto COLADO antes da limpeza ("12 34 56"
                // viraria "1234"). Quem limita a 6 digitos e o aoDigitar.
                editable={!carregando}
                caretHidden
                style={estilos.campoInvisivel}
                accessibilityLabel={titulo}
              />
            </View>

            {/* Contador de dígitos: diz quanto falta sem acusar erro de quem
                ainda está digitando. A mensagem do servidor é outra coisa e
                aparece em vermelho, abaixo. */}
            <Text style={[estilos.contador, { color: completo ? colors.success : colors.textLight }]}>
              {codigo.length}/{TAMANHO} dígitos
            </Text>

            {!!erro && (
              <View style={[estilos.erroCaixa, { backgroundColor: colors.danger + '18' }]}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={[estilos.erroTexto, { color: colors.danger }]}>{erro}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                estilos.botao,
                { backgroundColor: podeEnviar ? colors.primary : colors.gray },
              ]}
              onPress={() => podeEnviar && onConfirmar(codigo)}
              disabled={!podeEnviar}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={estilos.botaoTexto}>{rotuloConfirmar}</Text>
              )}
            </TouchableOpacity>

            {!!acaoSecundaria && !carregando && (
              <TouchableOpacity style={estilos.secundaria} onPress={acaoSecundaria.onPress}>
                <Text style={[estilos.secundariaTexto, { color: colors.textLight }]}>
                  {acaoSecundaria.rotulo}
                </Text>
              </TouchableOpacity>
            )}

            {!carregando && (
              <TouchableOpacity style={estilos.cancelar} onPress={onFechar}>
                <Text style={[estilos.cancelarTexto, { color: colors.gray }]}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// `fonts` neste projeto são TAMANHOS, não famílias — o peso vem de
// `fontWeight`, como no resto das telas. A primeira versão destes estilos usava
// `fontFamily: fonts.bold`, que não existe: renderizaria peso normal em
// silêncio, sem erro nenhum para denunciar.
//
// O 30 dos dígitos é literal de propósito: `fonts.title` é 22, e aqui o número
// precisa ser lido de longe, com o celular na mão, na porta de alguém.
const estilos = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  centro: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  caixa: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  cabecalho: { alignItems: 'center', gap: 12, marginBottom: 8 },
  icone: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: fonts.xlarge, fontWeight: 'bold', textAlign: 'center' },
  explicacao: { fontSize: fonts.regular, lineHeight: 20, marginBottom: 20, textAlign: 'center' },
  digitos: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  digito: {
    flex: 1,
    maxWidth: 48,
    aspectRatio: 0.8,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitoDaVez: { borderWidth: 2.5 },
  digitoTexto: { fontSize: 30, fontWeight: 'bold' },
  campoInvisivel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
  },
  contador: { fontSize: fonts.small, textAlign: 'center', marginTop: 8 },
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
  secundaria: { paddingVertical: 14, alignItems: 'center' },
  secundariaTexto: { fontSize: fonts.regular, fontWeight: '600', textDecorationLine: 'underline' },
  cancelar: { paddingVertical: 8, alignItems: 'center' },
  cancelarTexto: { fontSize: fonts.regular },
});
