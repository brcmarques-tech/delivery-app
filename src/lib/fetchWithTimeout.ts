// KAN-240: `fetch` com timeout.
//
// Nenhuma chamada HTTP do app definia timeout. Numa rede ruim (ou com um
// terceiro lento — viacep, nominatim, Pagar.me) a promise fica pendente
// indefinidamente e a tela "pendura": o caso mais visivel era o botao
// "Finalizando..." travado no checkout, sem erro nem feedback.
//
// AbortController garante que a chamada falha de forma observavel. Quem chama
// deve tratar o erro: um abort chega como exceção com `name === 'AbortError'`.

export const DEFAULT_TIMEOUT_MS = 15000;

export async function fetchWithTimeout(
  input: any,
  init?: any,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...(init || {}), signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** true se o erro veio de um timeout/abort desta util. */
export function isTimeoutError(err: any): boolean {
  return err?.name === 'AbortError';
}
