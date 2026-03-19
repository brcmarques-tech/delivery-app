import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightSensor } from 'expo-sensors';

const lightColors = {
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  secondary: '#2D3436',
  background: '#F5F5F5',
  white: '#FFFFFF',
  card: '#FFFFFF',
  gray: '#95A5A6',
  grayLight: '#ECF0F1',
  grayDark: '#7F8C8D',
  success: '#27AE60',
  danger: '#E74C3C',
  warning: '#F39C12',
  text: '#2D3436',
  textLight: '#7F8C8D',
  textSecondary: '#6B7280',
  inputBg: '#FFFFFF',
  border: '#E5E7EB',
};

const darkColors = {
  primary: '#FF6B35',
  primaryDark: '#E55A2B',
  secondary: '#F5F5F5',
  background: '#111827',
  white: '#1F2937',
  card: '#1F2937',
  gray: '#6B7280',
  grayLight: '#374151',
  grayDark: '#9CA3AF',
  success: '#27AE60',
  danger: '#E74C3C',
  warning: '#F39C12',
  text: '#F9FAFB',
  textLight: '#D1D5DB',
  textSecondary: '#9CA3AF',
  inputBg: '#374151',
  border: '#4B5563',
};

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextData {
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

const ThemeContext = createContext<ThemeContextData>({
  isDark: false,
  mode: 'system',
  setMode: () => {},
  toggleTheme: () => {},
  colors: lightColors,
});

const LIGHT_THRESHOLD = 15; // lux - abaixo disso é escuro (noite/ambiente escuro)
const DEBOUNCE_MS = 10000; // 10s de debounce pra não ficar trocando

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemDark, setSystemDark] = useState(Appearance.getColorScheme() === 'dark');
  const [sensorDark, setSensorDark] = useState<boolean | null>(null);
  const lastSensorSwitch = useRef(0);

  // Carregar preferência salva
  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setModeState(val);
      }
    });
  }, []);

  // Ouvir mudanças do tema do sistema
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemDark(colorScheme === 'dark');
    });
    return () => listener.remove();
  }, []);

  // Sensor de luminosidade (só no modo system)
  useEffect(() => {
    if (mode !== 'system') return;

    let subscription: any = null;

    LightSensor.isAvailableAsync().then((available) => {
      if (!available) return;

      LightSensor.setUpdateInterval(5000); // checar a cada 5s
      subscription = LightSensor.addListener(({ illuminance }) => {
        const now = Date.now();
        if (now - lastSensorSwitch.current < DEBOUNCE_MS) return;

        const shouldBeDark = illuminance < LIGHT_THRESHOLD;
        setSensorDark((prev) => {
          if (prev === null || prev !== shouldBeDark) {
            lastSensorSwitch.current = now;
            return shouldBeDark;
          }
          return prev;
        });
      });
    });

    return () => {
      if (subscription) subscription.remove();
    };
  }, [mode]);

  // Determinar se é dark
  let isDark: boolean;
  if (mode === 'dark') {
    isDark = true;
  } else if (mode === 'light') {
    isDark = false;
  } else {
    // system: sensor tem prioridade, senão usa o tema do sistema
    isDark = sensorDark !== null ? sensorDark : systemDark;
  }

  function setMode(newMode: ThemeMode) {
    setModeState(newMode);
    AsyncStorage.setItem('themeMode', newMode);
    if (newMode !== 'system') {
      setSensorDark(null); // reset sensor ao sair do modo system
    }
  }

  // toggleTheme cicla: system -> dark -> light -> system
  function toggleTheme() {
    const next: ThemeMode = mode === 'system' ? 'dark' : mode === 'dark' ? 'light' : 'system';
    setMode(next);
  }

  return (
    <ThemeContext.Provider value={{ isDark, mode, setMode, toggleTheme, colors: isDark ? darkColors : lightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
