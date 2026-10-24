/**
 * KAN-13 — a loja pinta a própria vitrine dentro do app.
 *
 * O app tem um tema (claro/escuro) e a loja escolhe três cores: primária,
 * fundo e texto. Esta função costura as duas coisas: parte do tema do app e
 * sobrescreve SÓ o que a loja definiu.
 *
 * POR QUE SÓ TRÊS CORES: o tema do app tem dezenas de tokens (sucesso, perigo,
 * cinzas, bordas). Deixar a loja mexer em todos seria entregar a ela a chance
 * de tornar ilegível o aviso de "indisponível" ou o botão de erro — e a
 * primeira vez que isso acontecesse seria com um cliente tentando comprar.
 * Três cores cobrem a identidade (a cor da marca, o fundo e o texto) sem tocar
 * nos sinais do sistema.
 *
 * `card` acompanha o fundo porque um cartão branco sobre fundo escuro some —
 * mas com um leve desvio, para o cartão não sumir dentro do fundo. Quando a
 * loja não escolhe fundo, nada disso acontece.
 */
export interface CoresDaLoja {
  primaryColor?: string | null;
  backgroundColor?: string | null;
  textColor?: string | null;
}

/** Clareia ou escurece um hex em `delta` (0–255), conforme a luminância. */
function desviar(hex: string, delta: number): string {
  const limpo = hex.replace('#', '');
  const cheio = limpo.length === 3 ? limpo.split('').map((c) => c + c).join('') : limpo.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(cheio)) return hex;
  const n = [0, 2, 4].map((i) => parseInt(cheio.slice(i, i + 2), 16));
  const claro = (n[0] * 299 + n[1] * 587 + n[2] * 114) / 1000 > 128;
  const ajustado = n.map((v) =>
    Math.max(0, Math.min(255, claro ? v - delta : v + delta)),
  );
  return '#' + ajustado.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function aplicarCoresDaLoja<T extends Record<string, any>>(
  tema: T,
  loja: CoresDaLoja | null | undefined,
): T {
  if (!loja) return tema;
  const { primaryColor, backgroundColor, textColor } = loja;
  if (!primaryColor && !backgroundColor && !textColor) return tema;

  return {
    ...tema,
    ...(primaryColor ? { primary: primaryColor } : {}),
    ...(backgroundColor
      ? { background: backgroundColor, card: desviar(backgroundColor, 12) }
      : {}),
    ...(textColor ? { text: textColor, textLight: desviar(textColor, 60) } : {}),
  };
}
