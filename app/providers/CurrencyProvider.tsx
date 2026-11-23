'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Currency = 'EGP' | 'USD';

const CurrencyContext = createContext<{
  currency: Currency;
  setCurrency: (c: Currency) => void;
}>({ currency: 'EGP', setCurrency: () => {} });

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('EGP');

  useEffect(() => {
    const saved = localStorage.getItem('solo_currency');
    if (saved === 'EGP' || saved === 'USD') setCurrencyState(saved);
  }, []);

  function setCurrency(c: Currency) {
    localStorage.setItem('solo_currency', c);
    setCurrencyState(c);
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);