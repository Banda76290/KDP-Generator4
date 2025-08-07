import { useState, useEffect } from 'react';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const AVAILABLE_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' }
];

/**
 * Hook for managing user's preferred display currency
 * This currency setting affects all monetary displays throughout the application
 */
export function useCurrency() {
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');

  // Load saved currency preference on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && AVAILABLE_CURRENCIES.find(c => c.code === savedCurrency)) {
      setPreferredCurrency(savedCurrency);
    }
  }, []);

  // Update preferred currency and save to localStorage
  const updatePreferredCurrency = (currencyCode: string) => {
    if (AVAILABLE_CURRENCIES.find(c => c.code === currencyCode)) {
      setPreferredCurrency(currencyCode);
      localStorage.setItem('preferredCurrency', currencyCode);
    }
  };

  // Get currency object for current preference
  const getCurrentCurrency = (): Currency => {
    return AVAILABLE_CURRENCIES.find(c => c.code === preferredCurrency) || AVAILABLE_CURRENCIES[0];
  };

  // Format amount in preferred currency
  const formatCurrency = (amount: number, originalCurrency?: string): string => {
    const currency = getCurrentCurrency();
    
    // If originalCurrency is provided and different from preferred, add note
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    if (originalCurrency && originalCurrency !== currency.code) {
      return `${formattedAmount} (orig. ${originalCurrency})`;
    }

    return formattedAmount;
  };

  return {
    preferredCurrency,
    updatePreferredCurrency,
    getCurrentCurrency,
    formatCurrency,
    availableCurrencies: AVAILABLE_CURRENCIES
  };
}