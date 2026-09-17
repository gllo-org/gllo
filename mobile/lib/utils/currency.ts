export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'KRW';

const LOCALE_MAP: Record<CurrencyCode, string> = {
  KRW: 'ko-KR',
  EUR: 'de-DE',
  USD: 'en-US',
  GBP: 'en-GB',
};

const FRACTION_MAP: Record<CurrencyCode, number> = {
  KRW: 0,
  EUR: 2,
  USD: 2,
  GBP: 2,
};

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(LOCALE_MAP[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: FRACTION_MAP[currency],
    maximumFractionDigits: FRACTION_MAP[currency],
  }).format(amount);
}

export function formatAmount(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(LOCALE_MAP[currency], {
    minimumFractionDigits: FRACTION_MAP[currency],
    maximumFractionDigits: FRACTION_MAP[currency],
  }).format(amount);
}

export type FlagCode = 'DE' | 'FR' | 'NL' | 'ES' | 'AT' | 'EU' | 'US' | 'GB' | 'KR';

export const CURRENCY_FLAGS: Record<CurrencyCode, FlagCode> = {
  EUR: 'EU',
  USD: 'US',
  GBP: 'GB',
  KRW: 'KR',
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  KRW: '₩',
};
