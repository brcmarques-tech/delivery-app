/**
 * Texto de um endereço salvo: "Rua X, 123, Apto 2, Centro, Pelotas/RS".
 *
 * As telas montavam `[rua, número, ..., `${cidade}/${estado}`].join(', ')`.
 * Com campos vazios — o caso de todo endereço que a API salva a partir do que
 * a pessoa DIGITOU no checkout, sem bairro nem cidade separados — saía
 * "Rua Andrade Neves 1500 Pelotas, S/N, , /": o "/" da cidade/UF nunca é
 * vazio, e o filtro de vazios só rodava em uma das quatro telas.
 */
export function textoDoEndereco(
  a: {
    street?: string | null;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
  } | null | undefined,
): string {
  if (!a) return '';
  const cidadeUf = [a.city, a.state].map((s) => (s || '').trim()).filter(Boolean).join('/');
  return [a.street, a.number, a.complement, a.neighborhood, cidadeUf]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(', ');
}
