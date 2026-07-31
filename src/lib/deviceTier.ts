// Perf (F0): tier de memoria do aparelho, calculado 1x no load do modulo.
//
// Principio combinado com o Bruno: baseline FRUGAL para todo mundo (garante que
// celular fraco nao trava) e o tier so AFROUXA a economia em aparelhos com muita
// RAM — nunca aperta o low alem do baseline. A internet e a moeda de troca:
// preferimos re-baixar da rede a segurar memoria.
import * as Device from 'expo-device';

export type DeviceTier = 'low' | 'mid' | 'high';

const GB = 1024 * 1024 * 1024;

function computeTier(): DeviceTier {
  const total = Device.totalMemory ?? 0;
  if (!total) return 'mid'; // web/simulador sem info: baseline conservador
  if (total < 3 * GB) return 'low';
  if (total > 6 * GB) return 'high';
  return 'mid';
}

export const deviceTier: DeviceTier = computeTier();

/**
 * Knobs de lista virtualizada por tier. Uso:
 *   <FlatList {...listPerfProps} ... />
 * low  = janela minima (menos itens montados = menos RAM)
 * high = janela maior (scroll mais fluido; RAM sobra)
 */
export const listPerfProps = {
  low: { windowSize: 3, maxToRenderPerBatch: 4, initialNumToRender: 4, removeClippedSubviews: true },
  mid: { windowSize: 5, maxToRenderPerBatch: 8, initialNumToRender: 6, removeClippedSubviews: true },
  high: { windowSize: 9, maxToRenderPerBatch: 12, initialNumToRender: 10, removeClippedSubviews: true },
}[deviceTier];

/**
 * Politica de cache de imagem (expo-image) por tier: no low nao seguramos
 * bitmap decodificado em memoria — so disco (re-decodifica ao rolar de volta,
 * troca aceitavel: rede/CPU no lugar de RAM).
 */
export const imageCachePolicy: 'disk' | 'memory-disk' =
  deviceTier === 'low' ? 'disk' : 'memory-disk';

/** Animacoes de entrada em listas: desligadas no low (menos trabalho na UI thread). */
export const listEnteringAnimationsEnabled = deviceTier !== 'low';
