/**
 * Telefone para DISCAR (`tel:`), no formato internacional: +55 DDD NUMERO.
 *
 * O banco tem o mesmo telefone em formatos diferentes, conforme quem gravou:
 * o cadastro do app grava DDD + numero (10 ou 11 digitos), o painel e o
 * WhatsApp gravam com o 55 na frente (12 ou 13). Mandar o texto cru para o
 * discador falhava de dois jeitos:
 *
 *  - com o 55 na frente, o discador lia o 55 como parte do numero e ligava
 *    para outro lugar;
 *  - sem o +55, a chamada dependia da operadora e do DDD de quem liga.
 *
 * Com +55 o celular completa a ligacao de qualquer DDD, no Brasil ou fora.
 *
 * Devolve null quando o que esta gravado nao e um telefone (sobra de teste,
 * numero incompleto): a tela esconde o botao em vez de discar lixo.
 */
export function telefoneParaDiscar(telefone?: string | null): string | null {
  let digitos = (telefone || '').replace(/\D/g, '');
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    digitos = digitos.slice(2);
  }
  if (digitos.length !== 10 && digitos.length !== 11) return null;
  return `+55${digitos}`;
}
