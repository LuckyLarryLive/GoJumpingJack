// Currency conversion utilities

interface ExchangeRateResponse {
  success: boolean;
  rates: Record<string, number>;
  base: string;
  date: string;
}

interface ConversionResult {
  originalAmount: string;
  originalCurrency: string;
  convertedAmount: string;
  convertedCurrency: string;
  rate: number;
  isEstimate: boolean;
}

// Cache for exchange rates (in production, consider using Redis or similar)
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Get exchange rate from cache or API
 */
async function getExchangeRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;

  const cacheKey = `${from}_${to}`;
  const cached = rateCache.get(cacheKey);

  // Check if we have a valid cached rate
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rate;
  }

  try {
    // Using exchangerate-api.com free tier
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Exchange rate API error: ${response.status}`);
      return null;
    }

    const data: ExchangeRateResponse = await response.json();

    if (!data.success || !data.rates[to]) {
      console.warn(`No exchange rate found for ${from} to ${to}`);
      return null;
    }

    const rate = data.rates[to];

    // Cache the rate
    rateCache.set(cacheKey, {
      rate,
      timestamp: Date.now(),
    });

    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
}

/**
 * Convert currency amount
 */
export async function convertCurrency(
  amount: string | number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult | null> {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return null;
  }

  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount.toString(),
      originalCurrency: fromCurrency,
      convertedAmount: amount.toString(),
      convertedCurrency: toCurrency,
      rate: 1,
      isEstimate: false,
    };
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency);

  if (!rate) {
    return null;
  }

  const convertedAmount = (numAmount * rate).toFixed(2);

  return {
    originalAmount: amount.toString(),
    originalCurrency: fromCurrency,
    convertedAmount,
    convertedCurrency: toCurrency,
    rate,
    isEstimate: true,
  };
}

/**
 * Format converted currency for display
 */
export function formatConvertedCurrency(
  conversion: ConversionResult,
  showOriginal: boolean = true
): string {
  // Fallback formatting without external dependency
  const formatPrice = (amount: string | number, currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
      BRL: 'R$',
      MXN: 'Mex$',
    };
    const symbol = symbols[currency] || currency;
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${symbol}${numAmount.toFixed(2)}`;
  };

  const convertedDisplay = formatPrice(conversion.convertedAmount, conversion.convertedCurrency);

  if (!showOriginal || !conversion.isEstimate) {
    return convertedDisplay;
  }

  const originalDisplay = formatPrice(conversion.originalAmount, conversion.originalCurrency);

  return `~${convertedDisplay} (${originalDisplay})`;
}

/**
 * Get fallback display when conversion fails
 */
export function getFallbackCurrencyDisplay(amount: string | number, currency: string): string {
  // Fallback formatting without external dependency
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    BRL: 'R$',
    MXN: 'Mex$',
  };
  const symbol = symbols[currency] || currency;
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${symbol}${numAmount.toFixed(2)}`;
}
