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

  // Format amount in preferred currency with automatic conversion
  const formatCurrency = async (amount: number, originalCurrency?: string): Promise<string> => {
    const currency = getCurrentCurrency();
    let displayAmount = amount;
    
    // Convert currency if needed
    if (originalCurrency && originalCurrency !== currency.code) {
      try {
        const response = await fetch(`/api/convert-currency?amount=${amount}&from=${originalCurrency}&to=${currency.code}`);
        if (response.ok) {
          const data = await response.json();
          displayAmount = data.convertedAmount;
        }
      } catch (error) {
        console.warn('Currency conversion failed, using original amount:', error);
      }
    }
    
    // Format in preferred currency
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(displayAmount);

    return formattedAmount;
  };

  // Synchronous version for immediate display (without conversion)
  const formatCurrencySync = (amount: number, targetCurrency?: string): string => {
    const currency = targetCurrency ? { code: targetCurrency } : getCurrentCurrency();
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return {
    preferredCurrency,
    updatePreferredCurrency,
    getCurrentCurrency,
    formatCurrency,
    formatCurrencySync,
    availableCurrencies
  };
}