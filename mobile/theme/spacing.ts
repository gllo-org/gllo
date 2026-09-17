export const spacing = {
  screenPadding: 20,
  cardPadding:   20,
  sectionGap:    12,
  itemGap:        8,
} as const;

export const radius = {
  card:   16,
  chip:   10,
  button: 12,
  input:  12,
  bottom: 24,
  pill:   999,
} as const;

export const shadow = {
  card: {
    shadowColor:   '#0F172A',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  12,
    elevation:     3,
  },
  float: {
    shadowColor:   '#0F172A',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius:  20,
    elevation:     8,
  },
} as const;
