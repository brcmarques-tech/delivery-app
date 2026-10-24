import { formatarReais } from './dinheiro';

/**
 * Como anunciar o frete de uma loja ANTES do checkout.
 *
 * O app mostrava o campo `store.deliveryFee` ("R$ 8.00"), mas a API não cobra
 * isso: com coordenada do cliente — que o app sempre manda — o frete é base +
 * km × preço por km (ver createOrder / calculateDeliveryFee). O `deliveryFee`
 * da loja só vale como piso quando não há coordenada. Resultado: a loja
 * anunciava R$ 8,00 e o checkout cobrava R$ 0,63 (ou o contrário, numa entrega
 * longa).
 *
 * Regra igual à da API:
 *  - loja com entrega grátis → "Entrega grátis";
 *  - com a estimativa do servidor (calculateDeliveryFee na posição atual) →
 *    o valor, com "~" porque o endereço final do checkout pode ser outro;
 *  - sem estimativa → "Frete pela distância", sem número inventado.
 */
export function rotuloDoFrete(
  store: { freeDelivery?: boolean | null } | null | undefined,
  estimativa?: number | null,
): string {
  if (store?.freeDelivery) return 'Entrega grátis';
  if (estimativa != null && Number.isFinite(Number(estimativa))) {
    return Number(estimativa) > 0 ? `Entrega ~${formatarReais(estimativa)}` : 'Entrega grátis';
  }
  return 'Frete pela distância';
}

/** "Grátis acima de R$ 50,00", quando a loja tem esse limite. */
export function rotuloDoFreteGratisAcima(
  store: { freeDelivery?: boolean | null; freeDeliveryAbove?: number | string | null } | null | undefined,
): string | null {
  if (!store || store.freeDelivery) return null;
  const limite = Number(store.freeDeliveryAbove);
  if (!limite || limite <= 0) return null;
  return `Grátis acima de ${formatarReais(limite)}`;
}
