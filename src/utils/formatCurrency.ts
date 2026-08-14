import type { CurrencyCode } from '@/types';

const CURRENCY_META: Record<CurrencyCode, { symbol: string; spaced: boolean }> = {
  AED: { symbol: 'AED', spaced: true },
  SAR: { symbol: 'SAR', spaced: true },
  USD: { symbol: '$',   spaced: false },
  EUR: { symbol: '€',   spaced: false },
  GBP: { symbol: '£',   spaced: false },
  INR: { symbol: '₹',   spaced: false },
};

/** Options for the currency picker in Settings */
export const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
];

/** Format an amount using the given currency's symbol and spacing convention */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const { symbol, spaced } = CURRENCY_META[currency];
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return spaced ? `${symbol} ${formatted}` : `${symbol}${formatted}`;
}
