import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

/**
 * Hook for managing user's preferred display currency
 * This currency setting affects all monetary displays throughout the application
 */
export function useCurrency() {
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');

  // Fetch available currencies from the database
  const { data: availableCurrencies = [] } = useQuery<Currency[]>({
    queryKey: ['/api/currencies'],
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Load saved currency preference on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && availableCurrencies.find(c => c.code === savedCurrency)) {
      setPreferredCurrency(savedCurrency);
    }
  }, [availableCurrencies]);

  // Update preferred currency and save to localStorage
  const updatePreferredCurrency = (currencyCode: string) => {
    if (availableCurrencies.find(c => c.code === currencyCode)) {
      setPreferredCurrency(currencyCode);
      localStorage.setItem('preferredCurrency', currencyCode);
    }
  };

  // Get currency object for current preference
  const getCurrentCurrency = (): Currency => {
    return availableCurrencies.find(c => c.code === preferredCurrency) || availableCurrencies[0] || { code: 'USD', name: 'US Dollar', symbol: '$' };
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
    availableCurrencies
  };
}