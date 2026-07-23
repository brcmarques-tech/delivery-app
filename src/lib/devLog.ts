// KAN-223: log informativo que so roda em desenvolvimento.
// Varios console.log do app vazavam PII e dados de pagamento (cardId, userId,
// coordenadas, endereco do cliente) em producao. Use devLog no lugar de
// console.log para logs de depuracao — em build de producao vira no-op.
// console.error/warn de erros reais podem continuar como estao.
export function devLog(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}
