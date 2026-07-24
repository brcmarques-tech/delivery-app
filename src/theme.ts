export const colors = {
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
};

export const fonts = {
  regular: 14,
  // KAN-236: `fonts.medium` ja era usado como fontSize em profile.tsx e
  // addresses.tsx, mas nao existia aqui — resultava em `fontSize: undefined`
  // (caia no default 14 do RN). Fica entre regular (14) e large (16).
  medium: 15,
  small: 12,
  tiny: 10,
  large: 16,
  xlarge: 18,
  title: 22,
};
