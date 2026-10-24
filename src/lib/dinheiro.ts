/**
 * Valor em reais no formato brasileiro: "R$ 1.234,56".
 *
 * O app inteiro mostrava `R$ ${valor.toFixed(2)}` — "R$ 40.00", ponto como
 * separador decimal, formato americano — enquanto a loja web mostrava
 * "R$ 19,90". Feito à mão, sem Intl: o Hermes de alguns Androids não traz os
 * dados de locale, e `toLocaleString('pt-BR')` devolveria o formato errado em
 * silêncio justamente no celular.
 *
 * Aceita número ou string (o GraphQL devolve decimal como string em vários
 * campos) e trata nulo/NaN como zero.
 */
export function formatarReais(valor: number | string | null | undefined): string {
  return `R$ ${formatarNumero(valor)}`;
}

/** Só o número, sem o "R$": "1.234,56". Para quando o "R$" vem separado na tela. */
export function formatarNumero(valor: number | string | null | undefined): string {
  const n = Number(valor);
  const seguro = Number.isFinite(n) ? n : 0;
  const negativo = seguro < 0;
  const [inteiro, centavos] = Math.abs(seguro).toFixed(2).split('.');
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}${comMilhar},${centavos}`;
}
