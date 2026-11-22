// Palette taken from the Kalfa logo: charcoal shop shutter + red / orange /
// amber bars. Green and red keep their money meaning (in / out).
export const Colors = {
  // Brand: charcoal (headers, primary buttons, selected chips)
  primary: '#1C1E23',
  primaryLight: '#EEEDEA',
  primaryDark: '#0F1013',
  primaryMid: '#3B3E46',

  // Accent: logo orange (active tab, links, loading, highlights)
  accent: '#E8711C',
  accentLight: '#FDEEDF',
  accentDark: '#B4540E',

  // Money in: income, receivables, healthy stock
  success: '#15865A',
  successLight: '#E2F3EA',
  successMid: '#0F6F49',
  successDark: '#0A4E33',

  // Money out: expenses, debts
  danger: '#D33A2A',
  dangerLight: '#FCE8E5',
  dangerDark: '#7A1E14',
  dangerMid: '#B02E20',

  // Low stock / attention (logo amber)
  warning: '#B97606',
  warningLight: '#FDF1D8',
  warningDark: '#5E3C00',

  // Backgrounds
  background: '#F6F5F2',
  surface: '#FFFFFF',
  surfaceSecondary: '#EFEDE8',

  // Text
  textPrimary: '#17181C',
  textSecondary: '#5F626A',
  textTertiary: '#9A9CA3',

  // Borders
  border: '#E7E4DD',
  borderStrong: '#CDC9C0',

  // On dark (charcoal) surfaces
  onDark: '#FFFFFF',
  onDarkMuted: 'rgba(255,255,255,0.62)',
  onDarkBorder: 'rgba(255,255,255,0.12)',
  successOnDark: '#5FD39C',
  dangerOnDark: '#FF8A7A',

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
