import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAncestorsStore } from "../stores/ancestorsStore";

export function AddPage() {
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
  const [language, setLanguage] = useState("English");
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
      <h1 className="text-fg text-lg font-mono mb-1">Add ancestor</h1>
      <p className="text-muted-fg text-xs mb-5">
        Profile fields shape the persona prompt. Be specific.
      </p>

      {err && (
        <div className="border border-red/40 bg-red/10 text-red rounded-lg px-3 py-2 text-xs mb-4 font-mono">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Relation">
            <input
              required
              placeholder="great-grandfather"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Birth year">
            <input
              required
              type="number"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Death year">
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
          <Field label="Birthplace">
            <input
              required
              value={birthplace}
              onChange={(e) => setBirthplace(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Profession">
            <input
              required
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Language">
            <input
              required
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Photo URL (optional)">
            <input
              type="url"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field
          label="Life events"
          hint="One per line, or comma-separated."
        >
          <textarea
            rows={3}
            value={lifeEvents}
            onChange={(e) => setLifeEvents(e.target.value)}
            className="input"
          />
        </Field>

        <Field
          label="Personality traits"
          hint="One per line, or comma-separated."
        >
          <textarea
            rows={3}
            value={traits}
            onChange={(e) => setTraits(e.target.value)}
            className="input"
          />
        </Field>

        <Field
          label="Historical context"
          hint="Eras, wars, movements they lived through."
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
            {submitting ? "Saving..." : "Save & open chat"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn btn-outline"
          >
            Cancel
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
