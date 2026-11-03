export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  rate: number;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", symbol: "$", label: "USD", rate: 1 },
  { code: "AUD", symbol: "A$", label: "AUD", rate: 1.55 },
  { code: "CAD", symbol: "C$", label: "CAD", rate: 1.36 },
  { code: "EUR", symbol: "€", label: "EUR", rate: 0.92 },
  { code: "GBP", symbol: "£", label: "GBP", rate: 0.79 },
];

export function convertCurrency(usdAmount: number, currency: CurrencyConfig): number {
  return Math.round(usdAmount * currency.rate);
}

export function formatCurrencyValue(value: number, currency: CurrencyConfig): string {
  if (value >= 1_000_000) return `${currency.symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${currency.symbol}${(value / 1_000).toFixed(0)}K`;
  return `${currency.symbol}${value}`;
}

export function detectCurrency(locationName: string): CurrencyConfig {
  const lower = locationName.toLowerCase();
  if (/australia/.test(lower)) return CURRENCIES[1];
  if (/canada/.test(lower)) return CURRENCIES[2];
  if (/\b(germany|france|spain|italy|netherlands|belgium|austria|ireland|portugal|finland|greece)\b/.test(lower)) return CURRENCIES[3];
  if (/\b(united kingdom|uk|england|scotland|wales)\b/.test(lower)) return CURRENCIES[4];
  return CURRENCIES[1]; // default AUD
}
