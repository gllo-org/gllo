export const typography = {
  family: {
    display: 'SUIT',
    sans: 'Pretendard',
  },

  amount: {
    hero:   { fontFamily: 'Pretendard-Bold',     fontSize: 36, letterSpacing: -1 },
    large:  { fontFamily: 'Pretendard-Bold',     fontSize: 28, letterSpacing: -0.5 },
    medium: { fontFamily: 'Pretendard-SemiBold', fontSize: 20, letterSpacing: 0 },
    small:  { fontFamily: 'Pretendard-Medium',   fontSize: 15, letterSpacing: 0 },
  },

  heading: {
    h1: { fontFamily: 'SUIT-Bold',     fontSize: 24 },
    h2: { fontFamily: 'SUIT-Bold',     fontSize: 20 },
    h3: { fontFamily: 'SUIT-SemiBold', fontSize: 17 },
  },

  body: {
    large:  { fontFamily: 'Pretendard-Regular', fontSize: 16 },
    medium: { fontFamily: 'Pretendard-Regular', fontSize: 15 },
    small:  { fontFamily: 'Pretendard-Regular', fontSize: 13 },
  },

  caption: { fontFamily: 'Pretendard-Regular', fontSize: 12 },
  label:   { fontFamily: 'Pretendard-Medium',  fontSize: 13 },
} as const;
