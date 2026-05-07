export const Colors = {
  // Marka
  primary: '#1D9E75',
  primaryLight: '#E1F5EE',
  primaryDark: '#085041',
  primaryMid: '#0F6E56',

  // Gider / Uyarı
  danger: '#D85A30',
  dangerLight: '#FAECE7',
  dangerDark: '#712B13',
  dangerMid: '#993C1D',

  // Uyarı (düşük stok)
  warning: '#BA7517',
  warningLight: '#FAEEDA',
  warningDark: '#412402',

  // Arkaplanlar
  background: '#F5F4F0',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0EFE9',

  // Metin
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9E9E9E',

  // Kenarlık
  border: '#E5E3DB',
  borderStrong: '#C8C5BC',

  // Diğer
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
} as const;

export type ColorKey = keyof typeof Colors;
