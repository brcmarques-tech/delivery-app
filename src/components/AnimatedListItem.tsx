import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

export function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const delay = 100 + Math.min(index * 50, 300);

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300).springify().damping(22).stiffness(200)}>
      {children}
    </Animated.View>
  );
}
