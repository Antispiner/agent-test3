import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import pl from "./locales/pl.json";

export type Lang = "en" | "ru" | "pl";

const DICTS: Record<Lang, Record<string, string>> = { en, ru, pl };
const SUPPORTED: Lang[] = ["en", "ru", "pl"];
const STORAGE_KEY = "ancestor.lang";
const DEFAULT_LANG: Lang = "ru";

export function detectInitialLang(): Lang {
  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && (SUPPORTED as string[]).includes(saved)) {
        return saved as Lang;
      }
    } catch {
      /* ignore storage errors */
    }
    const nav = window.navigator?.language?.slice(0, 2).toLowerCase();
    if (nav && (SUPPORTED as string[]).includes(nav)) return nav as Lang;
  }
  return DEFAULT_LANG;
}

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(
    () => initialLang ?? detectInitialLang()
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore storage errors */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const value = useMemo<I18nCtx>(() => {
    const dict = DICTS[lang];
    return {
      lang,
      setLang,
      t: (key: string) => dict[key] ?? DICTS.en[key] ?? key,
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}

export function useT(): (key: string) => string {
  return useI18n().t;
}

export const SUPPORTED_LANGS = SUPPORTED;
