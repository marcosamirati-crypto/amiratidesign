"use client";

import { useSyncExternalStore } from "react";
import { elleCopy } from "@/content/elle/copy";

const subscribe = (cb: () => void) => {
  const m = window.matchMedia("(hover: none) and (pointer: coarse)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/** Texto e ação da tela inicial: uma frase curta e um botão. O orbe fica acima, no palco. */
export default function ElleIntro({ onPick, onCamera, notice }: { onPick: () => void; onCamera: () => void; notice?: string | null }) {
  const touch = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(hover: none) and (pointer: coarse)").matches,
    () => false,
  );
  const t = elleCopy.home;

  return (
    <div className="elle-intro">
      <h1 className="elle-lede">
        <span>{t.line1}</span> <span>{t.line2}</span>
      </h1>
      <div className="elle-actions">
        <button type="button" className="elle-btn elle-btn--primary" onClick={onPick}>
          {t.action}
        </button>
        {touch && (
          <button type="button" className="elle-btn elle-btn--text" onClick={onCamera}>
            {t.camera}
          </button>
        )}
        <p className="elle-hint">{touch ? t.hintTouch : t.hintDesktop}</p>
        {notice && (
          <p className="elle-notice" role="alert">
            {notice}
          </p>
        )}
      </div>
    </div>
  );
}
