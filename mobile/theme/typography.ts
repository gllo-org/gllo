export const typography = {
  family: {
    display: 'SUIT',
    sans: 'Pretendard',
  },

  amount: {
    hero:   { fontFamily: 'SUIT-Bold',     fontSize: 34, letterSpacing: -0.5 },
    large:  { fontFamily: 'SUIT-Bold',     fontSize: 26, letterSpacing: -0.3 },
    medium: { fontFamily: 'SUIT-SemiBold', fontSize: 18, letterSpacing: 0 },
    small:  { fontFamily: 'SUIT-Medium',   fontSize: 14, letterSpacing: 0 },
  },

  heading: {
    h1: { fontFamily: 'SUIT-Bold',     fontSize: 22 },
    h2: { fontFamily: 'SUIT-Bold',     fontSize: 18 },
    h3: { fontFamily: 'SUIT-SemiBold', fontSize: 16 },
  },

  body: {
    large:  { fontFamily: 'Pretendard-Regular', fontSize: 16 },
    medium: { fontFamily: 'Pretendard-Regular', fontSize: 15 },
    small:  { fontFamily: 'Pretendard-Regular', fontSize: 13 },
  },

  caption: { fontFamily: 'Pretendard-Regular', fontSize: 12 },
  label:   { fontFamily: 'Pretendard-Medium',  fontSize: 13 },
} as const;
