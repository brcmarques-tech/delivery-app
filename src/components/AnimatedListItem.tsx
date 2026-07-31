import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { listEnteringAnimationsEnabled } from '../lib/deviceTier';

// Perf (F4): so a primeira tela de itens anima. Antes TODO item de lista ganhava
// um spring de entrada — na busca por categoria (ate ~100 resultados re-montados
// a cada tecla) isso virava uma tempestade de animacoes na UI thread. Itens alem
// do 12o (fora da primeira dobra) e aparelhos low-RAM renderizam direto.
const MAX_ANIMATED_INDEX = 12;

export function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  if (!listEnteringAnimationsEnabled || index >= MAX_ANIMATED_INDEX) {
    return <View>{children}</View>;
  }

  const delay = 100 + Math.min(index * 50, 300);

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300).springify().damping(22).stiffness(200)}>
      {children}
    </Animated.View>
  );
}
