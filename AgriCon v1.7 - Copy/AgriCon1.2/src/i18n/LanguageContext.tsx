import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Language } from '../types';
import { translations, TranslationKey } from './translations';

const LANGUAGE_STORAGE_KEY = 'agricon_language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readStoredLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && saved in translations) {
      return saved as Language;
    }
  } catch {
    // localStorage unavailable (private browsing, SSR, etc.) — fall back silently.
  }
  return 'EN';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Non-fatal — the app still works for this session even if it can't persist.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = translations[language] ?? translations.EN;
      return dict[key] ?? translations.EN[key] ?? key;
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
