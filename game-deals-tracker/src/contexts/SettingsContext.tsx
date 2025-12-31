import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language, type TranslationKeys } from '@/i18n/translations';

export type Currency = 'EUR' | 'USD';

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  t: TranslationKeys;
  formatPrice: (usdPrice: string | number) => string;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// Approximate exchange rate USD to EUR (updated periodically)
const USD_TO_EUR_RATE = 0.92;

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  // Load saved preferences or use defaults (Spanish and EUR)
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'es';
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('app-currency');
    return (saved as Currency) || 'EUR';
  });

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app-currency', currency);
  }, [currency]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
  };

  // Get translations for current language
  const t = translations[language];

  // Format price based on selected currency
  const formatPrice = (usdPrice: string | number): string => {
    const numPrice = typeof usdPrice === 'string' ? parseFloat(usdPrice) : usdPrice;
    
    if (numPrice === 0) {
      return t.common.free;
    }

    if (currency === 'EUR') {
      const eurPrice = numPrice * USD_TO_EUR_RATE;
      return `${eurPrice.toFixed(2)}€`;
    }
    
    return `$${numPrice.toFixed(2)}`;
  };

  const value: SettingsContextType = {
    language,
    setLanguage,
    currency,
    setCurrency,
    t,
    formatPrice,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
