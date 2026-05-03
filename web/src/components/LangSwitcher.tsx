import { SUPPORTED_LANGS, useI18n, type Lang } from "../i18n";

export function LangSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <div
      role="group"
      aria-label="language"
      className="inline-flex border border-border rounded-md overflow-hidden"
    >
      {SUPPORTED_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l as Lang)}
          className={
            "px-2 h-7 text-[11px] font-mono transition-colors " +
            (lang === l
              ? "bg-accent text-white"
              : "text-muted-fg hover:text-fg hover:bg-bg-soft")
          }
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}
