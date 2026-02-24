export const typography = {
  family: {
    sans: 'System',
    mono: 'Courier',
  },

  amount: {
    hero:   { fontSize: 36, fontWeight: '700' as const, letterSpacing: -1 },
    large:  { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
    medium: { fontSize: 20, fontWeight: '600' as const, letterSpacing: 0 },
    small:  { fontSize: 15, fontWeight: '500' as const, letterSpacing: 0 },
  },

  heading: {
    h1: { fontSize: 24, fontWeight: '700' as const },
    h2: { fontSize: 20, fontWeight: '700' as const },
    h3: { fontSize: 17, fontWeight: '600' as const },
  },

  body: {
    large:  { fontSize: 16, fontWeight: '400' as const },
    medium: { fontSize: 15, fontWeight: '400' as const },
    small:  { fontSize: 13, fontWeight: '400' as const },
  },

  caption: { fontSize: 12, fontWeight: '400' as const },
  label:   { fontSize: 13, fontWeight: '500' as const },
} as const;
