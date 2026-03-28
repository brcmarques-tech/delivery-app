import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type AlertType = 'error' | 'success' | 'warning' | 'info' | 'confirm';

interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextType {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType>({
  alert: () => {},
  showAlert: () => {},
});

export function useAlert() {
  return useContext(AlertContext);
}

const iconMap: Record<AlertType, { name: string; color: string; bg: string }> = {
  error: { name: 'close-circle', color: colors.danger, bg: colors.danger + '15' },
  success: { name: 'checkmark-circle', color: colors.success, bg: colors.success + '15' },
  warning: { name: 'alert-circle', color: colors.warning, bg: colors.warning + '15' },
  info: { name: 'information-circle', color: colors.primary, bg: colors.primary + '15' },
  confirm: { name: 'help-circle', color: colors.primary, bg: colors.primary + '15' },
};

function guessType(title: string, buttons?: AlertButton[]): AlertType {
  const t = title.toLowerCase();
  if (t.includes('erro') || t.includes('error')) return 'error';
  if (t.includes('sucesso') || t.includes('realizado') || t.includes('enviado')) return 'success';
  if (t.includes('permiss') || t.includes('aviso')) return 'warning';
  if (buttons && buttons.length > 1) return 'confirm';
  return 'info';
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const showAlert = useCallback((opts: AlertOptions) => {
    const type = opts.type || guessType(opts.title, opts.buttons);
    const buttons = opts.buttons && opts.buttons.length > 0
      ? opts.buttons
      : [{ text: 'OK', style: 'default' as const }];
    setOptions({ ...opts, type, buttons });
    setVisible(true);
  }, []);

  const alert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert({ title, message, buttons });
  }, [showAlert]);

  function handlePress(button: AlertButton) {
    setVisible(false);
    // Small delay to let modal close before running callback
    if (button.onPress) {
      setTimeout(button.onPress, 100);
    }
  }

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(0.5, { duration: 200 });
      cardScale.value = withSpring(1, { damping: 20, stiffness: 200 });
      cardOpacity.value = withTiming(1, { duration: 200 });
    } else {
      backdropOpacity.value = 0;
      cardScale.value = 0.85;
      cardOpacity.value = 0;
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const icon = iconMap[options.type || 'info'];
  const buttons = options.buttons || [{ text: 'OK' }];
  const hasCancel = buttons.some((b) => b.style === 'cancel');

  return (
    <AlertContext.Provider value={{ alert, showAlert }}>
      {children}
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={() => {
            if (hasCancel) setVisible(false);
          }}
        >
          <Animated.View style={[styles.overlay, backdropStyle]} />
          <Animated.View style={[styles.cardAnimated, cardStyle]}>
          <TouchableOpacity activeOpacity={1} style={styles.card}>
            <View style={[styles.iconWrapper, { backgroundColor: icon.bg }]}>
              <Ionicons name={icon.name as any} size={36} color={icon.color} />
            </View>
            <Text style={styles.title}>{options.title}</Text>
            {options.message ? (
              <Text style={styles.message}>{options.message}</Text>
            ) : null}
            <View style={[styles.buttonsRow, buttons.length === 1 && styles.buttonsSingle]}>
              {buttons.map((btn, idx) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.button,
                      isCancel && styles.buttonCancel,
                      isDestructive && styles.buttonDestructive,
                      !isCancel && !isDestructive && styles.buttonPrimary,
                      buttons.length === 1 && styles.buttonFull,
                    ]}
                    onPress={() => handlePress(btn)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && styles.buttonTextCancel,
                        (isDestructive || (!isCancel && !isDestructive)) && styles.buttonTextWhite,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </AlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,1)',
  },
  cardAnimated: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: fonts.xlarge,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: fonts.regular,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 16,
  },
  buttonsSingle: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonFull: {
    flex: 0,
    paddingHorizontal: 48,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonCancel: {
    backgroundColor: colors.grayLight,
  },
  buttonDestructive: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    fontSize: fonts.regular,
    fontWeight: '600',
  },
  buttonTextWhite: {
    color: colors.white,
  },
  buttonTextCancel: {
    color: colors.text,
  },
});
