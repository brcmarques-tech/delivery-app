/**
 * Quando a sessão cai porque a conta entrou em outro aparelho (sessão única,
 * KAN-84), o app mandava para o login SEM explicar nada — a pessoa não sabia
 * por que tinha saído — e, ao entrar de novo, ia para a Home: o link que ela
 * tinha aberto (o pedido, a loja) se perdia.
 *
 * Este módulo guarda, só em memória, duas coisas entre a queda e o novo login:
 *  - o MOTIVO, que a tela de login mostra uma vez;
 *  - a TELA onde a pessoa estava, para voltar a ela — mas só se quem entrar
 *    for a MESMA conta. Outra pessoa no mesmo aparelho não cai no pedido da
 *    anterior.
 *
 * Em memória de propósito: é uma ponte de segundos, não estado do app.
 */

const ROTAS_SEM_VOLTA = ['/auth', '/accept-terms', '/google-auth', '/onboarding'];

let caminhoAtual: string | null = null;
let usuarioAtual: string | null = null;

let motivoPendente: 'SESSAO_ENCERRADA' | null = null;
let voltarPara: { caminho: string; usuarioId: string } | null = null;

/** O layout raiz chama a cada mudança de rota. */
export function anotarCaminho(caminho: string | null | undefined) {
  if (!caminho || caminho === '/') return;
  if (ROTAS_SEM_VOLTA.some((r) => caminho.startsWith(r))) return;
  caminhoAtual = caminho;
}

/** O AuthContext chama quando o usuário muda. */
export function anotarUsuario(id: string | null | undefined) {
  if (id) usuarioAtual = id;
}

/**
 * A sessão caiu por ter sido aberta em outro lugar.
 * `jaAvisado`: quem chamou já mostrou um alerta (o aviso por WebSocket com o
 * app aberto) — aí o login não repete a mensagem, só guarda a volta.
 */
export function registrarSessaoEncerrada(opcoes?: { jaAvisado?: boolean }) {
  if (!opcoes?.jaAvisado) motivoPendente = 'SESSAO_ENCERRADA';
  if (caminhoAtual && usuarioAtual) voltarPara = { caminho: caminhoAtual, usuarioId: usuarioAtual };
}

/** A tela de login lê uma vez. */
export function consumirMotivo(): 'SESSAO_ENCERRADA' | null {
  const m = motivoPendente;
  motivoPendente = null;
  return m;
}

/** Depois do login: a tela para voltar, se for a mesma conta. */
export function consumirVoltarPara(usuarioId: string): string | null {
  const v = voltarPara;
  voltarPara = null;
  return v && v.usuarioId === usuarioId ? v.caminho : null;
}

/** O erro é a API dizendo que a sessão não vale mais (e não falta de rede)? */
export function ehSessaoInvalida(err: any): boolean {
  const erros: any[] = err?.graphQLErrors || [];
  return erros.some(
    (e) => e?.message?.includes('SESSION_EXPIRED') || e?.extensions?.code === 'UNAUTHENTICATED',
  );
}
