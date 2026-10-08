"use client";

import { useEffect, useRef, useState } from "react";
import { elleCopy } from "@/content/elle/copy";
import type { StageId } from "@/lib/elle/types";

export interface StageInfo {
  id: StageId;
  detail?: string;
  demo?: boolean;
}

/**
 * Mostra a etapa REAL em andamento. Cada mensagem fica pelo menos ~1 s na tela para dar tempo de ler;
 * se várias etapas passarem de uma vez, mostra a mais recente. Nunca avança sozinha: sem evento
 * novo do servidor, a mensagem não muda.
 */
function useDwell(stage: StageInfo | null, minMs = 1000): StageInfo | null {
  const [shown, setShown] = useState<StageInfo | null>(stage);
  const shownAt = useRef(Date.now());
  const latest = useRef(stage);
  latest.current = stage;

  useEffect(() => {
    if (!stage || (shown && shown.id === stage.id && shown.detail === stage.detail)) return;
    const wait = Math.max(0, minMs - (Date.now() - shownAt.current));
    const t = window.setTimeout(() => {
      shownAt.current = Date.now();
      setShown(latest.current);
    }, wait);
    return () => window.clearTimeout(t);
  }, [stage, shown, minMs]);

  return shown;
}

export default function ThinkingState({ stage, onCancel }: { stage: StageInfo | null; onCancel: () => void }) {
  const t = elleCopy.thinking;
  const shown = useDwell(stage);

  return (
    <div className="elle-thinking">
      <h1 className="elle-think-title">{t.title}</h1>
      <div className="elle-think-live" role="status" aria-live="polite">
        {shown && (
          <p key={shown.id} className="elle-think-stage">
            {elleCopy.stages[shown.id]}
          </p>
        )}
        {shown?.detail && (
          <p key={`${shown.id}-d`} className="elle-think-detail">
            {shown.detail}
          </p>
        )}
      </div>
      {shown?.demo && <p className="elle-demo-tag">{t.demo}</p>}
      <button type="button" className="elle-btn elle-btn--text" onClick={onCancel}>
        {t.cancel}
      </button>
    </div>
  );
}
