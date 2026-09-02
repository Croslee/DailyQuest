import React, { createContext, useContext, useMemo } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { en } from './locales/en';
import { vi } from './locales/vi';
import type { Language } from '@/types/settings';

type TranslationKeys = keyof typeof vi;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKeys | string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  vi,
  en,
};

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSetting } = useSettings();
  const language = settings.language || 'vi';

  const setLanguage = async (lang: Language) => {
    await updateSetting('language', lang);
  };

  const t = useMemo(() => {
    const dict = translations[language] || translations.vi;
    return (key: string, params?: Record<string, string | number>): string => {
      let text = dict[key] || translations.en[key] || key;
      if (params) {
        Object.entries(params).forEach(([pKey, pVal]) => {
          text = text.replace(new RegExp(`{${pKey}}`, 'g'), String(pVal));
        });
      }
      return text;
    };
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if not wrapped in provider
    const fallbackT = (key: string) => vi[key as keyof typeof vi] || key;
    return {
      language: 'vi' as Language,
      setLanguage: async () => {},
      t: fallbackT,
    };
  }
  return context;
}
