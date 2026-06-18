"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Locale } from './translations';
export type { Locale };

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations.pt;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('pt');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Locale;
      if (saved && (saved === 'pt' || saved === 'es' || saved === 'en')) {
        setLocaleState(saved);
      }
      setMounted(true);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', newLocale);
    }
  };

  const t = translations[locale] || translations.pt;

  // Render children immediately to avoid hydration flash, but default to 'pt'
  // until client loads the stored preference.
  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
