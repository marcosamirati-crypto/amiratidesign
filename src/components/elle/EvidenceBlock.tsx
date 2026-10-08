"use client";

import { elleCopy } from "@/content/elle/copy";
import type { AnalysisFact, AnalysisSource } from "@/lib/elle/types";
import StatusMark from "./StatusMark";

function jumpTo(id: string) {
  const el = document.getElementById(`elle-src-${id}`);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  el.removeAttribute("data-flash");
  void el.offsetWidth; // reinicia a animação
  el.setAttribute("data-flash", "");
}

/** Lista de fatos, cada um com o seu estado de confiança e as fontes que o sustentam. */
export default function EvidenceBlock({ facts, sources }: { facts: AnalysisFact[]; sources: AnalysisSource[] }) {
  if (!facts.length) return <p className="elle-quiet">{elleCopy.result.noFacts}</p>;
  const byId = new Map(sources.map((s) => [s.id, s]));

  return (
    <ul className="elle-facts">
      {facts.map((f, i) => (
        <li key={i} className="elle-fact" data-status={f.status}>
          <StatusMark status={f.status} />
          <p className="elle-fact__text">{f.text}</p>
          {f.quote && <blockquote className="elle-fact__quote">{f.quote}</blockquote>}
          {f.source_ids.length > 0 && (
            <p className="elle-fact__src">
              {f.source_ids.map((id) => {
                const s = byId.get(id);
                if (!s) return null;
                return (
                  <button key={id} type="button" className="elle-chip" onClick={() => jumpTo(id)} aria-label={`Ver fonte ${id}: ${s.name}`}>
                    <b>{id}</b>
                    {s.name}
                  </button>
                );
              })}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export { jumpTo };
