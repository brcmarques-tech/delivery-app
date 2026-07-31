import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { Image as ExpoImage } from 'expo-image';
import { useAuth } from '../../src/contexts/AuthContext';
import { useAlert } from '../../src/contexts/AlertContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { fonts } from '../../src/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CART_IMG = require('../../assets/splash-cart.png');

const API_BASE = 'https://api.bcmtech.com.br';
const RETURN_URL = Constants.appOwnership === 'expo'
  ? Linking.createURL('google-auth')
  : 'shopping-app://google-auth';

const SPRING = { damping: 22, stiffness: 200 };

function OnceAnimated({ delay = 0, fromX = 0, fromY = 0, children }: { delay?: number; fromX?: number; fromY?: number; children: React.ReactNode }) {
  const hasAnimated = useRef(false);
  const opacity = useSharedValue(hasAnimated.current ? 1 : 0);
  const translateX = useSharedValue(hasAnimated.current ? 0 : fromX);
  const translateY = useSharedValue(hasAnimated.current ? 0 : fromY);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    opacity.value = withDelay(delay, withSpring(1, SPRING));
    translateX.value = withDelay(delay, withSpring(0, SPRING));
    translateY.value = withDelay(delay, withSpring(0, SPRING));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, loginWithGoogle, setAuthData } = useAuth();
  const { alert } = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Transition animation values
  // Phase 1: header slides up, form slides down
  const headerTranslateY = useSharedValue(0);
  const formTranslateY = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  // Phase 2: cart slides left to right
  const cartTranslateX = useSharedValue(-SCREEN_W);
  const cartOpacity = useSharedValue(0);
  // Background
  const bgColor = useSharedValue(0); // 0 = current, 1 = white

  const headerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
    opacity: contentOpacity.value,
  }));

  const formAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
    opacity: contentOpacity.value,
  }));

  const cartAnimStyle = useAnimatedStyle(() => ({
    opacity: cartOpacity.value,
    transform: [{ translateX: cartTranslateX.value }],
  }));

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: bgColor.value,
  }));

  function playTransitionAndNavigate() {
    setTransitioning(true);

    // Phase 1: slide content out (400ms)
    headerTranslateY.value = withTiming(-SCREEN_H * 0.5, { duration: 400, easing: Easing.in(Easing.cubic) });
    formTranslateY.value = withTiming(SCREEN_H * 0.5, { duration: 400, easing: Easing.in(Easing.cubic) });
    contentOpacity.value = withTiming(0, { duration: 400 });
    bgColor.value = withTiming(1, { duration: 400 });

    // Phase 2: cart slides across (after content exits)
    cartOpacity.value = withDelay(400, withTiming(1, { duration: 150 }));
    cartTranslateX.value = withDelay(400,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // Phase 2b: cart pauses with bounce then exits
    setTimeout(() => {
      // Small bounce
      cartTranslateX.value = withTiming(-15, { duration: 150 }, () => {
        cartTranslateX.value = withTiming(10, { duration: 150 }, () => {
          cartTranslateX.value = withTiming(0, { duration: 100 }, () => {
            // Exit to right
            cartTranslateX.value = withTiming(SCREEN_W, { duration: 500, easing: Easing.in(Easing.cubic) });
            cartOpacity.value = withDelay(300, withTiming(0, { duration: 200 }, () => {
              runOnJS(router.replace)('/');
            }));
          });
        });
      });
    }, 1050); // 400 (phase1) + 600 (slide in) + 50 buffer
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const url = `${API_BASE}/auth/google/mobile?mode=login&userType=app&returnUrl=${encodeURIComponent(RETURN_URL)}`;
      const result = await WebBrowser.openAuthSessionAsync(url, RETURN_URL);

      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const params = parsed.queryParams || {};

        if (params.error) {
          const error = params.error as string;
          if (error === 'GOOGLE_NO_ACCOUNT') {
            alert('Conta nao encontrada', 'Nenhuma conta encontrada com este email Google. Cadastre-se primeiro.');
          } else {
            alert('Erro', 'Erro ao entrar com Google. Tente novamente.');
          }
          return;
        }

        if (params.accessToken) {
          await loginWithGoogle(params.accessToken as string);
          playTransitionAndNavigate();
        } else if (params.token && params.user) {
          try {
            const userData = JSON.parse(params.user as string);
            await setAuthData(params.token as string, userData);
            playTransitionAndNavigate();
          } catch {
            alert('Erro', 'Dados de autenticacao invalidos.');
          }
        }
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('GOOGLE_NO_ACCOUNT')) {
        alert('Conta nao encontrada', 'Nenhuma conta encontrada com este email Google. Cadastre-se primeiro.');
      } else {
        alert('Erro', 'Erro ao entrar com Google. Tente novamente.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLogin(forceLogin: boolean = false) {
    setLoginError('');
    if (!email || !password) {
      setLoginError('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      await login(email, password, forceLogin);
      playTransitionAndNavigate();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('ACTIVE_SESSION')) {
        Alert.alert(
          'Sessao ativa',
          'Esta conta ja esta logada em outro dispositivo. Deseja desconectar o outro e entrar aqui?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sim, entrar aqui', onPress: () => handleLogin(true) },
          ],
        );
      } else {
        setLoginError('Email ou senha invalidos');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.white }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      <Animated.View style={headerAnimStyle}>
        <View style={styles.brandedHeader}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.decorCircle3} />
          <OnceAnimated delay={0} fromY={-30}>
            <View style={styles.brandedContent}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.brandedLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandedTagline}>Tudo perto de voce</Text>
            </View>
          </OnceAnimated>
        </View>
      </Animated.View>

      <Animated.View style={formAnimStyle}>
        <OnceAnimated delay={50} fromY={30}>
          <View style={[styles.formCard, { backgroundColor: colors.white }]}>
            <View style={styles.form}>
              <OnceAnimated delay={100} fromX={30}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.grayLight, color: colors.text }]}
                  placeholder="Email"
                  placeholderTextColor={colors.gray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </OnceAnimated>

              <OnceAnimated delay={150} fromX={30}>
                <View style={[styles.passwordContainer, { backgroundColor: colors.grayLight }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder="Senha"
                    placeholderTextColor={colors.gray}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.gray}
                    />
                  </TouchableOpacity>
                </View>
              </OnceAnimated>

              <Text style={[styles.errorText, !loginError && { height: 0, marginTop: 0 }]}>{loginError}</Text>

              <OnceAnimated delay={200} fromX={0}>
                <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                  <Text style={[styles.forgotPassword, { color: colors.primary }]}>Esqueci minha senha</Text>
                </TouchableOpacity>
              </OnceAnimated>

              <OnceAnimated delay={230} fromY={15}>
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={() => handleLogin()}
                  disabled={loading || transitioning}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Text>
                </TouchableOpacity>
              </OnceAnimated>

              <OnceAnimated delay={280} fromY={0}>
                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.grayLight }]} />
                  <Text style={[styles.dividerText, { color: colors.gray }]}>ou</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.grayLight }]} />
                </View>
              </OnceAnimated>

              <OnceAnimated delay={320} fromY={15}>
                <TouchableOpacity
                  style={[styles.googleButton, { backgroundColor: colors.white, borderColor: colors.grayLight }, googleLoading && styles.buttonDisabled]}
                  onPress={handleGoogleLogin}
                  disabled={googleLoading || transitioning}
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      {/* Perf (F7): expo-image cacheia em disco; RN Image re-baixava */}
                      <ExpoImage
                        source="https://developers.google.com/identity/images/g-logo.png"
                        style={styles.googleIcon}
                        cachePolicy="disk"
                      />
                      <Text style={[styles.googleButtonText, { color: colors.text }]}>Continuar com Google</Text>
                    </>
                  )}
                </TouchableOpacity>
              </OnceAnimated>

              <OnceAnimated delay={360} fromY={0}>
                <TouchableOpacity onPress={() => router.push('/auth/register')}>
                  <Text style={[styles.link, { color: colors.textLight }]}>
                    Nao tem conta? <Text style={[styles.linkBold, { color: colors.primary }]}>Cadastre-se</Text>
                  </Text>
                </TouchableOpacity>
              </OnceAnimated>
            </View>
          </View>
        </OnceAnimated>
      </Animated.View>
    </ScrollView>

      {/* White overlay + cart crossing animation */}
      {transitioning && (
        <>
          <Animated.View style={[styles.transitionOverlay, overlayAnimStyle]} />
          <Animated.View style={[styles.transitionCart, cartAnimStyle]}>
            <ExpoImage source={CART_IMG} style={styles.transitionCartImage} contentFit="contain" />
          </Animated.View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  brandedHeader: {
    backgroundColor: '#1e293b',
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(249,115,22,0.15)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  decorCircle3: {
    position: 'absolute',
    top: '50%' as unknown as number,
    left: -15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(249,115,22,0.08)',
  },
  brandedContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  brandedLogo: {
    width: 280,
    height: 170,
  },
  brandedTagline: {
    fontSize: fonts.large,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  formCard: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 12,
    paddingTop: 28,
  },
  form: {
    gap: 6,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: fonts.regular,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: fonts.regular,
  },
  eyeButton: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: fonts.small,
    marginTop: 2,
    marginLeft: 4,
  },
  forgotPassword: {
    fontSize: fonts.small,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: fonts.large,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: fonts.small,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 6,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: fonts.regular,
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    fontSize: fonts.regular,
    marginTop: 12,
  },
  linkBold: {
    fontWeight: 'bold',
  },
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },
  transitionCart: {
    position: 'absolute',
    top: SCREEN_H / 2 - SCREEN_W * 0.225,
    left: 0,
    width: SCREEN_W * 0.45,
    height: SCREEN_W * 0.45,
    zIndex: 101,
    alignSelf: 'center',
  },
  transitionCartImage: {
    width: SCREEN_W * 0.45,
    height: SCREEN_W * 0.45,
  },
});
