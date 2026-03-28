import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../theme';

const { width } = Dimensions.get('window');
const LOGO = require('../../assets/logo.png');

export function SplashLoading({ onReady }: { onReady?: () => void } = {}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleLogo = useRef(new Animated.Value(0.7)).current;
  const fadeFooter = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleLogo, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide native splash once our custom splash is visible
    onReady?.();

    // Footer + dots fade in
    Animated.timing(fadeFooter, {
      toValue: 1,
      duration: 400,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Loading dots animation
    function animateDots() {
      Animated.sequence([
        Animated.timing(dotOpacity1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotOpacity3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(dotOpacity1, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dotOpacity2, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dotOpacity3, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        ]),
      ]).start(() => animateDots());
    }
    const timeout = setTimeout(animateDots, 700);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      {/* Subtle background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: fadeIn, transform: [{ scale: scaleLogo }] },
        ]}
      >
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
      </Animated.View>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsContainer, { opacity: fadeFooter }]}>
        <Animated.View style={[styles.dot, { opacity: dotOpacity1 }]} />
        <Animated.View style={[styles.dot, { opacity: dotOpacity2 }]} />
        <Animated.View style={[styles.dot, { opacity: dotOpacity3 }]} />
      </Animated.View>

      {/* Footer */}
      <Animated.Text style={[styles.footer, { opacity: fadeFooter }]}>
        Seu shopping, sua cidade
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    top: -width * 0.4,
    right: -width * 0.3,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: colors.primary + '08',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -width * 0.3,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: colors.primary + '06',
  },
  logoWrapper: {
    marginBottom: 40,
  },
  logo: {
    width: width * 0.7,
    height: width * 0.35,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    fontSize: 14,
    color: colors.gray,
    letterSpacing: 1,
  },
});
