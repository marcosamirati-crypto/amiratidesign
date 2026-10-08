"use client";

import { useEffect, useRef, useState } from "react";
import { elleCopy } from "@/content/elle/copy";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Alternativa para páginas sem permissão da área de transferência.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** "Copiar resposta" → "Copiado." no próprio botão, sem alerta. Anunciado aos leitores de tela. */
export default function CopyButton({ text, label = elleCopy.copy.idle, compact = false }: { text: string; label?: string; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const click = async () => {
    const ok = await copyText(text);
    setState(ok ? "done" : "fail");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  };

  const shown = state === "done" ? elleCopy.copy.done : state === "fail" ? elleCopy.copy.fail : label;
  return (
    <button type="button" className={`elle-btn elle-copy ${compact ? "elle-btn--text" : "elle-btn--ghost"}`} data-state={state} onClick={click} disabled={!text.trim()}>
      <span className="elle-copy__icon" aria-hidden="true">
        {state === "done" ? (
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect x="5.2" y="5.2" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10.8 3.4V3.2a1.4 1.4 0 0 0-1.4-1.4H3.9A1.4 1.4 0 0 0 2.5 3.2v5.5a1.4 1.4 0 0 0 1.4 1.4h.3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span key={state} className="elle-copy__label">
        {shown}
      </span>
      <span className="elle-sr" role="status" aria-live="polite">
        {state === "done" ? elleCopy.copy.done : ""}
      </span>
    </button>
  );
}
