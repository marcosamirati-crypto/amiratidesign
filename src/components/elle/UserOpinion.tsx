"use client";

import { useEffect, useRef, useState } from "react";
import { elleCopy } from "@/content/elle/copy";
import { personalize, PersonalizeError } from "@/lib/elle/client";
import type { Analysis, ReplyVariants } from "@/lib/elle/types";
import type { OrbState } from "@/lib/elle/orb-engine";
import SuggestedResponse from "./SuggestedResponse";

/**
 * "Qual é a sua opinião sobre isso?" A Elle não substitui a sua opinião: ela só reescreve a resposta
 * com o que você digitou aqui (e nada além disso) e com os fatos que já foram verificados.
 */
export default function UserOpinion({ analysis, onOrb }: { analysis: Analysis; onOrb: (s: OrbState) => void }) {
  const t = elleCopy.result;
  const [opinion, setOpinion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replies, setReplies] = useState<ReplyVariants | null>(null);
  const [sent, setSent] = useState("");
  const [version, setVersion] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 96)}px`;
  }, [opinion]);

  const submit = async () => {
    const text = opinion.trim();
    if (text.length < 3 || busy) return;
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setBusy(true);
    setError(null);
    onOrb("thinking");
    try {
      const out = await personalize(
        {
          opinion: text,
          transcript: analysis.transcript,
          summary: analysis.summary,
          categories: analysis.categories,
          facts: analysis.facts.map((f) => ({ text: f.text, status: f.status })),
          counter_argument: analysis.counter_argument?.text ?? "",
          standard_response: analysis.responses.standard,
          source_name: analysis.sources[0]?.name ?? null,
        },
        ac.signal,
      );
      setReplies(out);
      setSent(text);
      setVersion((v) => v + 1);
      onOrb("found");
    } catch (e) {
      if (ac.signal.aborted) return;
      const code = e instanceof PersonalizeError ? e.code : "unknown";
      const m = elleCopy.errors[code];
      setError(typeof m === "string" ? m : `${m.title} ${m.body}`);
      onOrb("error");
      window.setTimeout(() => onOrb("found"), 2400);
    } finally {
      if (!ac.signal.aborted) setBusy(false);
    }
  };

  return (
    <div className="elle-opinion">
      <label className="elle-opinion__label" htmlFor="elle-opinion">
        {t.opinionLabel}
      </label>
      <p className="elle-opinion__hint" id="elle-opinion-hint">
        {t.opinionHint}
      </p>
      <textarea
        id="elle-opinion"
        ref={taRef}
        className="elle-field"
        value={opinion}
        maxLength={1200}
        rows={3}
        placeholder={t.opinionPlaceholder}
        aria-describedby="elle-opinion-hint"
        onChange={(e) => setOpinion(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit();
        }}
      />
      <div className="elle-actions elle-actions--start">
        <button type="button" className="elle-btn elle-btn--primary" onClick={submit} disabled={busy || opinion.trim().length < 3} aria-busy={busy}>
          {busy ? t.opinionWorking : replies ? t.redo : t.opinionAction}
        </button>
      </div>
      {error && (
        <p className="elle-notice" role="alert">
          {error}
        </p>
      )}

      {replies && (
        <section className="elle-yours" aria-labelledby="elle-yours-title" key={version}>
          <p className="elle-yours__mine">
            <span>{t.myOpinion}</span>
            {sent}
          </p>
          <h3 id="elle-yours-title" className="elle-label">
            {t.sections.yours}
          </h3>
          <SuggestedResponse replies={replies} label={t.sections.yours} />
          <p className="elle-note">{t.reviewNote}</p>
        </section>
      )}
    </div>
  );
}
