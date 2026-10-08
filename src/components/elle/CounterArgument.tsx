"use client";

import type { AnalysisSource } from "@/lib/elle/types";
import { jumpTo } from "./EvidenceBlock";

/** Chips de fonte reutilizados por contraponto e "fato sobre Flávio". */
export function SourceChips({ ids, sources }: { ids: string[]; sources: AnalysisSource[] }) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const items = ids.map((id) => byId.get(id)).filter((s): s is AnalysisSource => !!s);
  if (!items.length) return null;
  return (
    <p className="elle-fact__src">
      {items.map((s) => (
        <button key={s.id} type="button" className="elle-chip" onClick={() => jumpTo(s.id)} aria-label={`Ver fonte ${s.id}: ${s.name}`}>
          <b>{s.id}</b>
          {s.name}
        </button>
      ))}
    </p>
  );
}

/** O principal argumento contrário, dito de forma racional. */
export default function CounterArgument({ text, sourceIds, sources }: { text: string; sourceIds: string[]; sources: AnalysisSource[] }) {
  return (
    <div className="elle-counter">
      <p>{text}</p>
      <SourceChips ids={sourceIds} sources={sources} />
    </div>
  );
}
