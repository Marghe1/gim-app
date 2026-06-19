import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// The three languages the app interface is available in.
export type Lang = 'en' | 'it' | 'fr';
export const LANGS: Lang[] = ['en', 'it', 'fr'];

// Native names shown in the language picker.
export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  it: 'Italiano',
  fr: 'Français',
};

// A per-screen string table: one flat key→text map per language.
export type Strings = Record<Lang, Record<string, string>>;

const STORAGE_KEY = 'gymtrack_language';

// Pick the starting language: a previously chosen one wins; otherwise we match
// the device language if it is Italian or French, else fall back to English.
function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'it' || stored === 'fr') return stored;
  } catch {
    /* localStorage may be unavailable; fall through to device detection */
  }
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  if (nav === 'it' || nav === 'fr') return nav;
  return 'en';
}

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore persistence failures (private mode, etc.) */
    }
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}

// Replace {placeholders} in a translated string with provided values.
function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

// Hook a screen uses to translate its own strings. Falls back to English, then
// to the raw key, so a missing translation never shows a blank.
export function useT(strings: Strings) {
  const { lang } = useLang();
  return (key: string, vars?: Record<string, string | number>): string => {
    const table = strings[lang] || strings.en;
    const value = table[key] ?? strings.en[key] ?? key;
    return interpolate(value, vars);
  };
}
