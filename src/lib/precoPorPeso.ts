/**
 * Preco de um item de peso variavel, em reais.
 *
 * KAN-282 (item 6): o app somava os valores CRUS (price * grams / 1000) e o
 * servidor arredonda CADA item em centavos antes de somar. Isso produzia uma
 * divergencia silenciosa de centavos entre a tela e o pedido criado.
 *
 * Caso concreto do ticket: 2 itens de R$ 39,90/kg x 355 g.
 *   app:      14,1645 + 14,1645 = R$ 28,33
 *   servidor: 14,16   + 14,16   = R$ 28,32
 * A reconciliacao do checkout so avisa acima de 1 centavo, entao a diferenca
 * passava calada — e a propria tela se contradizia, com as linhas somando 28,32
 * e o subtotal exibindo 28,33.
 *
 * Esta funcao e a formula do servidor, caractere por caractere
 * (orders.service.ts, createOrder e adjustItemWeight):
 *
 *   Math.round((unitPrice * weightGrams) / 10) / 100
 *
 * O `/ 10` converte reais-por-kilo x gramas em CENTAVOS (price * grams / 1000
 * reais = price * grams / 10 centavos), e so depois arredonda. Nao troque por
 * `Math.round(price * grams / 1000 * 100)`: da o mesmo resultado na maioria dos
 * casos, mas nao em todos, e o ponto aqui e ser identico ao servidor.
 *
 * Todo lugar do app que mostre ou some dinheiro de item por peso deve usar esta
 * funcao. O storefront web tem a mesma formula em lib/useCart.ts.
 */
export function precoPorPeso(precoPorKg: number, weightGrams: number): number {
  return Math.round((precoPorKg * (weightGrams || 0)) / 10) / 100;
}

/**
 * Total de uma linha do carrinho/checkout, cobrindo os dois tipos de produto.
 * Mantem a decisao "peso variavel x unidade" em um lugar so.
 */
export function totalDaLinha(item: {
  price: number;
  quantity: number;
  isVariableWeight?: boolean;
  weightGrams?: number | null;
}): number {
  return item.isVariableWeight
    ? precoPorPeso(item.price, item.weightGrams || 0)
    : item.price * item.quantity;
}
