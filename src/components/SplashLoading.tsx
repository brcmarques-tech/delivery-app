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
const CART = require('../../assets/splash-cart.png');

interface SplashProps {
  onReady?: () => void;
  onAnimationDone?: () => void;
}

export function SplashLoading({ onReady, onAnimationDone }: SplashProps = {}) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleLogo = useRef(new Animated.Value(0.7)).current;
  const fadeFooter = useRef(new Animated.Value(0)).current;
  const cartTranslateX = useRef(new Animated.Value(-width)).current;
  const cartOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    onReady?.();

    // Full cart animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cartOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cartTranslateX, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Pause in center with a subtle bounce
      Animated.sequence([
        Animated.timing(cartTranslateX, {
          toValue: -15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cartTranslateX, {
          toValue: 10,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cartTranslateX, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(200),
      ]),
      // Cart slides out to right
      Animated.parallel([
        Animated.timing(cartTranslateX, {
          toValue: width,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cartOpacity, {
          toValue: 0,
          duration: 400,
          delay: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // After cart exits, show logo
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

      // Footer fade in, then notify animation is done
      Animated.timing(fadeFooter, {
        toValue: 1,
        duration: 400,
        delay: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => onAnimationDone?.(), 800);
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Subtle background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Cart image - slides from left to right */}
      <Animated.View
        style={[
          styles.cartWrapper,
          {
            opacity: cartOpacity,
            transform: [{ translateX: cartTranslateX }],
          },
        ]}
      >
        <Image source={CART} style={styles.cartImage} contentFit="contain" />
      </Animated.View>

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: fadeIn, transform: [{ scale: scaleLogo }] },
        ]}
      >
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
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
  cartWrapper: {
    position: 'absolute',
  },
  cartImage: {
    width: width * 0.45,
    height: width * 0.45,
  },
  logoWrapper: {
    marginBottom: 40,
  },
  logo: {
    width: width * 0.7,
    height: width * 0.35,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    fontSize: 14,
    color: colors.gray,
    letterSpacing: 1,
  },
});
