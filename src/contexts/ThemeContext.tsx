import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface ThemeContextData {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

const ThemeContext = createContext<ThemeContextData>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then((val) => {
      if (val === 'dark') setIsDark(true);
    });
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: isDark ? darkColors : lightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
