export const spacing = {
  screenPadding: 20,
  cardPadding:   20,
  sectionGap:    12,
  itemGap:        8,
} as const;

export const radius = {
  card:   20,
  chip:   12,
  button: 14,
  input:  12,
  bottom: 28,
  pill:   50,
} as const;

export const shadow = {
  card: {
    shadowColor:   '#C4B5F8',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius:  16,
    elevation:     4,
  },
  float: {
    shadowColor:   '#9B7CF8',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius:  20,
    elevation:     8,
  },
} as const;
