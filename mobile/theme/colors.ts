export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'KRW';

type GradientPair = readonly [string, string];

export interface ThemeColors {
  gradient: { hero: GradientPair; accent: GradientPair };
  bg: { screen: string; surface: string; input: string; overlay: string };
  text: { primary: string; secondary: string; tertiary: string; inverse: string; brand: string };
  accent: { primary: string; light: string; text: string };
  profit: { text: string; bg: string; light: string };
  loss: { text: string; bg: string; light: string };
  neutral: { text: string; bg: string };
  currency: Record<CurrencyCode, { primary: string; bg: string; text: string }>;
  system: { border: string; divider: string; shadow: string; skeleton: string };
  status: { normal: string; warning: string; danger: string };
}

const light: ThemeColors = {
  gradient: {
    hero: ['#EEF2FF', '#F8FAFC'],
    accent: ['#6366F1', '#4F46E5'],
  },

  bg: {
    screen:  '#F8FAFC',
    surface: '#FFFFFF',
    input:   '#F1F5F9',
    overlay: 'rgba(15,23,42,0.5)',
  },

  text: {
    primary:   '#0F172A',
    secondary: '#64748B',
    tertiary:  '#94A3B8',
    inverse:   '#FFFFFF',
    brand:     '#4F46E5',
  },

  accent: {
    primary: '#4F46E5',
    light:   '#EEF2FF',
    text:    '#4F46E5',
  },

  profit: {
    text:  '#059669',
    bg:    '#D1FAE5',
    light: '#ECFDF5',
  },
  loss: {
    text:  '#DC2626',
    bg:    '#FEE2E2',
    light: '#FEF2F2',
  },
  neutral: {
    text:  '#64748B',
    bg:    '#F1F5F9',
  },

  currency: {
    EUR: { primary: '#6366F1', bg: '#EEF2FF', text: '#4338CA' },
    USD: { primary: '#059669', bg: '#D1FAE5', text: '#047857' },
    GBP: { primary: '#DC2626', bg: '#FEE2E2', text: '#B91C1C' },
    KRW: { primary: '#0284C7', bg: '#E0F2FE', text: '#0369A1' },
  },

  system: {
    border:   '#E2E8F0',
    divider:  '#EDF1F5',
    shadow:   'rgba(15, 23, 42, 0.08)',
    skeleton: '#E2E8F0',
  },

  status: {
    normal:  '#4F46E5',
    warning: '#D97706',
    danger:  '#DC2626',
  },
};

const dark: ThemeColors = {
  gradient: {
    hero: ['#151B2C', '#0B1120'],
    accent: ['#6366F1', '#4F46E5'],
  },

  bg: {
    screen:  '#0B1120',
    surface: '#151B2C',
    input:   '#1C2436',
    overlay: 'rgba(0,0,0,0.6)',
  },

  text: {
    primary:   '#F8FAFC',
    secondary: '#94A3B8',
    tertiary:  '#64748B',
    inverse:   '#0F172A',
    brand:     '#818CF8',
  },

  accent: {
    primary: '#818CF8',
    light:   '#1E2340',
    text:    '#A5B4FC',
  },

  profit: {
    text:  '#34D399',
    bg:    '#0F2E22',
    light: '#132F25',
  },
  loss: {
    text:  '#F87171',
    bg:    '#3B1414',
    light: '#331414',
  },
  neutral: {
    text:  '#94A3B8',
    bg:    '#1C2436',
  },

  currency: {
    EUR: { primary: '#818CF8', bg: '#1E2340', text: '#A5B4FC' },
    USD: { primary: '#34D399', bg: '#0F2E22', text: '#6EE7B7' },
    GBP: { primary: '#F87171', bg: '#3B1414', text: '#FCA5A5' },
    KRW: { primary: '#38BDF8', bg: '#0C2536', text: '#7DD3FC' },
  },

  system: {
    border:   '#263042',
    divider:  '#1C2436',
    shadow:   'rgba(0, 0, 0, 0.4)',
    skeleton: '#1C2436',
  },

  status: {
    normal:  '#818CF8',
    warning: '#FBBF24',
    danger:  '#F87171',
  },
};

export const themes: Record<'light' | 'dark', ThemeColors> = { light, dark };
export const colors = light;
export type ColorScheme = keyof typeof themes;
