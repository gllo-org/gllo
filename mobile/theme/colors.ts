export const colors = {
  gradient: {
    primary: ['#C4B5F8', '#F0A8C8', '#FFBDA0'] as const,
    light:   ['#EDE8FF', '#FDE8F2', '#FFF0E8'] as const,
    card:    ['#D4C8FC', '#F8C0D8', '#FFC8AE'] as const,
  },

  bg: {
    screen:  '#FFFFFF',
    surface: '#F8F7FF',
    input:   '#F4F3FF',
    overlay: 'rgba(0,0,0,0.4)',
  },

  text: {
    primary:   '#1A1A2E',
    secondary: '#6B7280',
    tertiary:  '#9CA3AF',
    inverse:   '#FFFFFF',
    brand:     '#9B7CF8',
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
    text:  '#6B7280',
    bg:    '#F3F4F6',
  },

  currency: {
    EUR: { primary: '#C4B5F8', bg: '#EDE8FF', text: '#7C3AED' },
    USD: { primary: '#86EFAC', bg: '#DCFCE7', text: '#16A34A' },
    GBP: { primary: '#FCA5A5', bg: '#FEE2E2', text: '#DC2626' },
    KRW: { primary: '#93C5FD', bg: '#DBEAFE', text: '#2563EB' },
  },

  system: {
    border:   '#F0EEF8',
    divider:  '#F3F4F6',
    shadow:   'rgba(196, 181, 248, 0.15)',
    skeleton: '#F0EEF8',
  },

  status: {
    normal:  '#9B7CF8',
    warning: '#F59E0B',
    danger:  '#EF4444',
  },
} as const;

export type CurrencyCode = keyof typeof colors.currency;
