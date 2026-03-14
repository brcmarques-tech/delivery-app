import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ACCEPT_TERMS } from '../src/lib/graphql/mutations';
import { GET_CONTRACT_CONTENT } from '../src/lib/graphql/queries';
import { useAuth } from '../src/contexts/AuthContext';
import { useAlert } from '../src/contexts/AlertContext';
import { colors, fonts } from '../src/theme';

const DEFAULT_CUSTOMER_CONTRACT = `TERMOS DE USO — BCM TECH DELIVERY (CLIENTE)
Ultima atualizacao: Marco de 2026

Estes Termos de Uso regulam o acesso e o uso da plataforma bcmTech Delivery pelo Cliente (consumidor final).

A plataforma e operada por BCM TECH, inscrita no CNPJ sob o n. 59.858.037/0001-06, com sede na Avenida Nossa Senhora da Graca, 19, Centro, CEP 96330-000, Arroio Grande - RS.

1. OBJETO
1.1. A Plataforma conecta consumidores finais a estabelecimentos comerciais (vendedores), oferecendo infraestrutura para visualizacao de produtos, realizacao de pedidos, pagamento online e logistica de entrega.
1.2. A Empresa atua como intermediaria tecnologica, nao sendo parte na relacao de consumo entre o Cliente e o Vendedor.

2. CADASTRO
2.1. O Cliente declara que todas as informacoes fornecidas no cadastro sao verdadeiras e atualizadas.
2.2. O Cliente e responsavel pela seguranca de suas credenciais de acesso.
2.3. E vedado o cadastro de menores de 18 anos sem consentimento dos responsaveis legais.

3. PEDIDOS E PAGAMENTOS
3.1. Ao confirmar um pedido, o Cliente assume o compromisso de pagamento conforme o metodo selecionado.
3.2. Os pagamentos sao processados pelo Mercado Pago, intermediador autorizado pelo Banco Central do Brasil.
3.3. Cancelamentos e estornos seguem as politicas do Codigo de Defesa do Consumidor (Lei 8.078/90).

4. ENTREGAS
4.1. Os prazos de entrega sao estimativas e podem variar conforme demanda e condicoes externas.
4.2. O Cliente deve fornecer endereco completo e correto. A Empresa nao se responsabiliza por entregas em enderecos incorretos fornecidos pelo Cliente.
4.3. Os entregadores sao profissionais autonomos, sem vinculo empregaticio com a Empresa.

5. DIREITOS DO CONSUMIDOR
5.1. O Cliente tem direito a informacoes claras sobre produtos, precos e condicoes de entrega, nos termos do art. 6, III do CDC.
5.2. O direito de arrependimento (art. 49 do CDC) aplica-se conforme a natureza do produto adquirido.
5.3. Reclamacoes devem ser direcionadas primeiramente ao estabelecimento vendedor.

6. RESPONSABILIDADES DO CLIENTE
6.1. Utilizar a Plataforma de forma licita e de boa-fe.
6.2. Nao realizar pedidos fraudulentos ou com informacoes falsas.
6.3. Confirmar o recebimento dos pedidos entregues.

7. PROTECAO DE DADOS (LGPD)
7.1. Os dados pessoais sao tratados conforme a Lei 13.709/2018 (LGPD).
7.2. Os dados sao utilizados para prestacao dos servicos, processamento de pagamentos e comunicacoes necessarias.
7.3. O Cliente pode exercer seus direitos (acesso, correcao, eliminacao) pelo e-mail bcmtechdev@gmail.com.

8. LIMITACAO DE RESPONSABILIDADE
8.1. A Empresa nao se responsabiliza pela qualidade dos produtos vendidos pelos estabelecimentos.
8.2. A Empresa nao garante disponibilidade ininterrupta da Plataforma.

9. DISPOSICOES GERAIS
9.1. Estes Termos sao regidos pela legislacao brasileira.
9.2. Foro: comarca de Arroio Grande - RS.
9.3. A Empresa pode alterar estes Termos, notificando o usuario pela Plataforma.

Ao aceitar, voce manifesta seu consentimento livre, informado e inequivoco com todos os termos acima.`;

const DEFAULT_DELIVERER_CONTRACT = `TERMO DE COMPROMISSO DO ENTREGADOR — BCM TECH DELIVERY
Ultima atualizacao: Marco de 2026

Este Termo regula a atuacao de entregadores autonomos na plataforma bcmTech Delivery, operada por BCM TECH, CNPJ 59.858.037/0001-06, Arroio Grande - RS.

1. OBRIGACAO DE ENTREGA
O entregador que aceitar um pedido se compromete a realizar a entrega no endereco indicado, dentro do prazo estimado pela plataforma.

2. RESPONSABILIDADE SOBRE O PRODUTO
O entregador e responsavel pela integridade do produto desde a coleta no estabelecimento ate a entrega ao destinatario, conforme Art. 14 do CDC (Lei 8.078/90).

3. PENALIDADES POR NAO ENTREGA
O entregador que aceitar um pedido e nao realizar a entrega sem justificativa valida estara sujeito a:
a) Suspensao temporaria da plataforma;
b) Bloqueio permanente em caso de reincidencia;
c) Responsabilizacao civil pelos prejuizos causados (Arts. 186 e 927 do Codigo Civil).

4. EXTRAVIO OU DANO AO PRODUTO
Em caso de extravio, perda ou dano ao produto, o entregador podera ser responsabilizado civil e criminalmente (Arts. 155 e 163 do Codigo Penal).

5. RELACAO JURIDICA
O cadastro como entregador NAO configura vinculo empregaticio com a plataforma (Art. 442-B da CLT). O entregador e profissional autonomo.

6. REQUISITOS
6.1. O entregador deve ter pelo menos 18 anos.
6.2. Para veiculos motorizados (moto/carro), e obrigatoria a apresentacao de CNH valida.
6.3. O entregador deve manter seus dados cadastrais atualizados.

7. PAGAMENTOS
7.1. Os valores das entregas sao repassados via Mercado Pago.
7.2. O entregador deve conectar sua conta do Mercado Pago para receber os pagamentos.

8. PROTECAO DE DADOS
As informacoes pessoais sao tratadas conforme a LGPD (Lei 13.709/18).

9. FORO
Fica eleito o foro da comarca de Arroio Grande - RS para dirimir quaisquer controversias.

Ao aceitar, voce declara ter lido, compreendido e concordado com todos os termos acima.`;

const DEFAULT_VENDOR_CONTRACT = `TERMOS DE USO DA PLATAFORMA BCM TECH DELIVERY (VENDEDOR)
Ultima atualizacao: Marco de 2026

Estes Termos regulam o uso da plataforma bcmTech Delivery por Vendedores (estabelecimentos comerciais).

Operada por BCM TECH, CNPJ 59.858.037/0001-06, Arroio Grande - RS.

1. OBJETO
1.1. A Plataforma e um marketplace que conecta vendedores a consumidores finais.
1.2. A Empresa atua como intermediaria tecnologica.

2. RESPONSABILIDADES DO VENDEDOR
2.1. Qualidade, seguranca e legalidade dos produtos anunciados.
2.2. Cumprimento do CDC, normas sanitarias e fiscais.
2.3. Veracidade das informacoes dos produtos.
2.4. Emissao de nota fiscal conforme legislacao.
2.5. Preparo dos pedidos dentro do prazo informado.

3. PAGAMENTOS E COMISSOES
3.1. A Empresa cobra comissao conforme o plano contratado.
3.2. Pagamentos processados pelo Mercado Pago.

4. PROTECAO DE DADOS (LGPD)
Dados tratados conforme Lei 13.709/2018.

5. FORO
Comarca de Arroio Grande - RS.

Ao aceitar, voce manifesta seu consentimento com todos os termos acima.`;

function getContractTypeForRole(role: string): string {
  switch (role) {
    case 'VENDOR': return 'vendor';
    case 'DELIVERER': return 'deliverer';
    default: return 'customer';
  }
}

function getDefaultContract(role: string): string {
  switch (role) {
    case 'VENDOR': return DEFAULT_VENDOR_CONTRACT;
    case 'DELIVERER': return DEFAULT_DELIVERER_CONTRACT;
    default: return DEFAULT_CUSTOMER_CONTRACT;
  }
}

function getCheckboxText(role: string): string {
  switch (role) {
    case 'VENDOR':
      return 'Li e aceito os Termos de Uso da Plataforma e estou ciente das minhas responsabilidades como vendedor.';
    case 'DELIVERER':
      return 'Li e aceito o Termo de Compromisso do Entregador e estou ciente das minhas responsabilidades.';
    default:
      return 'Li e aceito os Termos de Uso da Plataforma e a Politica de Privacidade.';
  }
}

interface AcceptTermsScreenProps {
  readOnly?: boolean;
  onClose?: () => void;
}

export default function AcceptTermsScreen({ readOnly, onClose }: AcceptTermsScreenProps) {
  const { user, updateUser } = useAuth();
  const { alert } = useAlert();
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState(false);
  const [acceptTerms, { loading }] = useMutation(ACCEPT_TERMS);

  const role = user?.role || 'CUSTOMER';
  const contractType = getContractTypeForRole(role);

  const { data: contractData } = useQuery(GET_CONTRACT_CONTENT, {
    variables: { type: contractType },
  });

  const contractText = contractData?.contractContent || getDefaultContract(role);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const scrolled = contentOffset.y + layoutMeasurement.height;
    if (scrolled >= contentSize.height * 0.8) {
      setScrolledToEnd(true);
    }
  }

  async function handleAccept() {
    try {
      const { data } = await acceptTerms();
      if (user && data?.acceptTerms) {
        await updateUser({ ...user, acceptedTermsAt: data.acceptTerms.acceptedTermsAt });
      }
      router.replace('/');
    } catch {
      alert('Erro', 'Nao foi possivel aceitar os termos. Tente novamente.');
    }
  }

  const title = role === 'VENDOR'
    ? 'Termos de Uso (Vendedor)'
    : role === 'DELIVERER'
      ? 'Termo de Compromisso (Entregador)'
      : 'Termos de Uso';

  const formatCpf = (cpf: string) =>
    cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  async function handleDownloadPdf() {
    try {
      const html = `
        <html><head><meta charset="utf-8"><style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { background: #F97316; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
          .header h1 { color: white; margin: 0; font-size: 22px; }
          .signee { background: #f5f5f5; border-radius: 10px; padding: 16px; margin-bottom: 24px; }
          .signee-label { font-size: 10px; color: #888; font-weight: 600; margin-bottom: 6px; }
          .signee-name { font-size: 16px; font-weight: 600; }
          .signee-info { font-size: 13px; color: #666; margin-top: 2px; }
          .contract { font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
        </style></head><body>
          <div class="header"><h1>bcmTech Delivery</h1></div>
          ${user?.name || user?.cpf ? `<div class="signee">
            <div class="signee-label">PARTE CONTRATANTE / ASSINANTE:</div>
            ${user?.name ? `<div class="signee-name">${user.name}</div>` : ''}
            ${user?.cpf ? `<div class="signee-info">CPF: ${formatCpf(user.cpf)}</div>` : ''}
            ${user?.phone ? `<div class="signee-info">Telefone: ${user.phone}</div>` : ''}
          </div>` : ''}
          <div class="contract">${contractText}</div>
          <div class="footer">Contrato aceito digitalmente na plataforma bcmTech Delivery.</div>
        </body></html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${title} - bcmTech Delivery` });
    } catch {
      alert('Erro', 'Nao foi possivel gerar o PDF.');
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {readOnly && onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Ionicons name="document-text" size={32} color={colors.primary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {readOnly
            ? 'Visualizacao do contrato aceito.'
            : 'Leia atentamente antes de continuar usando a plataforma.'}
        </Text>
      </View>

      {/* Contract body */}
      <ScrollView
        style={styles.contractScroll}
        contentContainerStyle={styles.contractContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Signee info */}
        {(user?.name || user?.cpf) && (
          <View style={styles.signeeBox}>
            <Text style={styles.signeeLabel}>PARTE CONTRATANTE / ASSINANTE:</Text>
            {user?.name && <Text style={styles.signeeName}>{user.name}</Text>}
            {user?.cpf && <Text style={styles.signeeCpf}>CPF: {formatCpf(user.cpf)}</Text>}
          </View>
        )}

        <Text style={styles.contractText}>{contractText}</Text>
      </ScrollView>

      {/* Footer */}
      {readOnly ? (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.pdfButton} onPress={handleDownloadPdf}>
            <Ionicons name="download-outline" size={20} color={colors.primary} />
            <Text style={styles.pdfButtonText}>Baixar contrato em PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
            <Text style={styles.closeFooterText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footer}>
          {!scrolledToEnd && (
            <Text style={styles.scrollHint}>
              Role ate o final do contrato para poder aceitar.
            </Text>
          )}

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => scrolledToEnd && setChecked(!checked)}
            disabled={!scrolledToEnd}
          >
            <Ionicons
              name={checked ? 'checkbox' : 'square-outline'}
              size={24}
              color={checked ? colors.primary : scrolledToEnd ? colors.gray : colors.grayLight}
            />
            <Text style={[styles.checkboxText, !scrolledToEnd && { color: colors.gray }]}>
              {getCheckboxText(role)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, (!checked || !scrolledToEnd || loading) && styles.buttonDisabled]}
            onPress={handleAccept}
            disabled={!checked || !scrolledToEnd || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.acceptButtonText}>Aceitar e Continuar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 16,
    padding: 8,
  },
  title: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.small,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  contractScroll: {
    flex: 1,
  },
  contractContent: {
    padding: 20,
    paddingBottom: 32,
  },
  signeeBox: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  signeeLabel: {
    fontSize: fonts.tiny,
    color: colors.textLight,
    fontWeight: '600',
    marginBottom: 6,
  },
  signeeName: {
    fontSize: fonts.regular,
    fontWeight: '600',
    color: colors.text,
  },
  signeeCpf: {
    fontSize: fonts.small,
    color: colors.textLight,
    marginTop: 2,
  },
  contractText: {
    fontSize: fonts.small,
    color: colors.textLight,
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    backgroundColor: colors.white,
  },
  scrollHint: {
    fontSize: fonts.tiny,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  checkboxText: {
    flex: 1,
    fontSize: fonts.small,
    color: colors.text,
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
  },
  pdfButtonText: {
    color: colors.primary,
    fontSize: fonts.small,
    fontWeight: '600',
  },
  closeFooterButton: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  closeFooterText: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: colors.textLight,
  },
});
