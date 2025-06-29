'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDefaultCurrency, isSupportedCurrency } from '@/lib/currency';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const [currency, setCurrencyState] = useState<string>(getDefaultCurrency());
  const [loading, setLoading] = useState(true);

  // Update currency when user changes or loads
  useEffect(() => {
    if (user?.preferredCurrency && isSupportedCurrency(user.preferredCurrency)) {
      setCurrencyState(user.preferredCurrency);
    } else {
      setCurrencyState(getDefaultCurrency());
    }
    setLoading(false);
  }, [user]);

  const setCurrency = (newCurrency: string) => {
    if (isSupportedCurrency(newCurrency)) {
      setCurrencyState(newCurrency);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
