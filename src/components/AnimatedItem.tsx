import React from 'react';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeInUp, FadeInLeft } from 'react-native-reanimated';

export function AnimatedItem({ delay = 0, fromX = 0, fromY = 0, children }: { delay?: number; fromX?: number; fromY?: number; children: React.ReactNode }) {
  let entering;

  if (fromX > 0) {
    entering = FadeInRight.delay(delay).duration(300).springify().damping(22).stiffness(200);
  } else if (fromX < 0) {
    entering = FadeInLeft.delay(delay).duration(300).springify().damping(22).stiffness(200);
  } else if (fromY < 0) {
    entering = FadeInUp.delay(delay).duration(300).springify().damping(22).stiffness(200);
  } else if (fromY > 0) {
    entering = FadeInDown.delay(delay).duration(300).springify().damping(22).stiffness(200);
  } else {
    entering = FadeIn.delay(delay).duration(300);
  }

  return (
    <Animated.View entering={entering}>
      {children}
    </Animated.View>
  );
}
