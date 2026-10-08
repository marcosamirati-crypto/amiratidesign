"use client";

import { elleCopy } from "@/content/elle/copy";
import type { Analysis, AnalysisSource } from "@/lib/elle/types";
import { SourceChips } from "./CounterArgument";

/**
 * Um fato verificável ligado ao tema do comentário, sempre com fonte. Só aparece quando existe.
 * Quando há o que dizer do outro lado sobre o mesmo tema, vem logo abaixo, no mesmo peso.
 */
export default function FlavioFact({ fact, sources }: { fact: NonNullable<Analysis["flavio_fact"]>; sources: AnalysisSource[] }) {
  const s = elleCopy.result.sections;
  return (
    <div className="elle-flavio">
      <p>{fact.text}</p>
      <SourceChips ids={fact.source_ids} sources={sources} />
      {fact.other_side && (
        <div className="elle-flavio__other">
          <h4>{s.flavioOther}</h4>
          <p>{fact.other_side.text}</p>
          <SourceChips ids={fact.other_side.source_ids} sources={sources} />
        </div>
      )}
    </div>
  );
}
