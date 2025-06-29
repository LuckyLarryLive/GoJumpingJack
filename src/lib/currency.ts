// Currency utilities for handling different currencies throughout the app

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  isDefault?: boolean;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    isDefault: true,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    isDefault: false,
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    isDefault: false,
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    isDefault: false,
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    isDefault: false,
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    isDefault: false,
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    isDefault: false,
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    isDefault: false,
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    isDefault: false,
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: 'Mex$',
    isDefault: false,
  },
];

/**
 * Get currency symbol by currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

/**
 * Get currency name by currency code
 */
export function getCurrencyName(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.name || currencyCode;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number | string, currencyCode: string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbol = getCurrencySymbol(currencyCode);

  // Handle different formatting for different currencies
  if (currencyCode === 'JPY' || currencyCode === 'CNY') {
    // No decimal places for Yen and Yuan
    return `${symbol}${Math.round(numAmount).toLocaleString()}`;
  }

  return `${symbol}${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format price with currency code (e.g., "USD 123.45")
 */
export function formatPriceWithCode(amount: number | string, currencyCode: string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (currencyCode === 'JPY' || currencyCode === 'CNY') {
    return `${currencyCode} ${Math.round(numAmount).toLocaleString()}`;
  }

  return `${currencyCode} ${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Get default currency code
 */
export function getDefaultCurrency(): string {
  return 'USD';
}

/**
 * Check if currency code is supported
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return SUPPORTED_CURRENCIES.some(c => c.code === currencyCode);
}

/**
 * Get currency codes only
 */
export function getSupportedCurrencyCodes(): string[] {
  return SUPPORTED_CURRENCIES.map(c => c.code);
}
