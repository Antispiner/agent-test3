import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAncestorsStore } from "../stores/ancestorsStore";
import { useT } from "../i18n";

const ANCESTOR_LANGS = ["ru", "be", "uk", "pl", "en"] as const;

export function AddPage() {
  const t = useT();
  const navigate = useNavigate();
  const create = useAncestorsStore((s) => s.create);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [birth, setBirth] = useState("");
  const [death, setDeath] = useState("");
  const [birthplace, setBirthplace] = useState("");
  const [profession, setProfession] = useState("");
  const [language, setLanguage] = useState<string>("ru");
  const [photo, setPhoto] = useState("");
  const [lifeEvents, setLifeEvents] = useState("");
  const [traits, setTraits] = useState("");
  const [historicalContext, setHistoricalContext] = useState("");

  function splitLines(v: string): string[] {
    return v
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    try {
      const created = await create({
        name,
        relation,
        birth_year: parseInt(birth, 10),
        death_year: parseInt(death, 10),
        birthplace,
        profession,
        language,
        life_events: splitLines(lifeEvents),
        personality_traits: splitLines(traits),
        historical_context: splitLines(historicalContext),
        photo_url: photo || undefined,
      });
      navigate(`/chat/${created.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-fg text-lg font-mono mb-1">{t("form.title")}</h1>
      <p className="text-muted-fg text-xs mb-5">{t("form.tagline")}</p>

      {err && (
        <div className="border border-red/40 bg-red/10 text-red rounded-lg px-3 py-2 text-xs mb-4 font-mono">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("form.name")}>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("form.relation")}>
            <input
              required
              placeholder={t("form.relation.placeholder")}
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("form.birth_year")}>
            <input
              required
              type="number"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("form.death_year")}>
            <input
              required
              type="number"
              value={death}
              onChange={(e) => setDeath(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("form.birthplace")}>
            <input
              required
              value={birthplace}
              onChange={(e) => setBirthplace(e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("form.profession")}>
            <input
              required
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("form.language")}>
            <select
              required
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input"
            >
              {ANCESTOR_LANGS.map((l) => (
                <option key={l} value={l}>
                  {t(`language.${l}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("form.photo_url")}>
            <input
              type="url"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field
          label={t("form.life_events")}
          hint={t("form.life_events.hint")}
        >
          <textarea
            rows={3}
            value={lifeEvents}
            onChange={(e) => setLifeEvents(e.target.value)}
            className="input"
          />
        </Field>

        <Field
          label={t("form.personality_traits")}
          hint={t("form.personality_traits.hint")}
        >
          <textarea
            rows={3}
            value={traits}
            onChange={(e) => setTraits(e.target.value)}
            className="input"
          />
        </Field>

        <Field
          label={t("form.historical_context")}
          hint={t("form.historical_context.hint")}
        >
          <textarea
            rows={3}
            value={historicalContext}
            onChange={(e) => setHistoricalContext(e.target.value)}
            className="input"
          />
        </Field>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? t("form.submitting") : t("form.submit")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn btn-outline"
          >
            {t("form.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[12px] text-muted-fg font-mono mb-1">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-micro-fg mt-1">{hint}</div>}
    </label>
  );
}
