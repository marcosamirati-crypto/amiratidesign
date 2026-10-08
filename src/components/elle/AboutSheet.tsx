"use client";

import { useEffect, useRef } from "react";
import { categoryCopy, elleCopy } from "@/content/elle/copy";
import { CATEGORY_IDS } from "@/lib/elle/types";

/**
 * "Oi. Eu sou a Elle." Usa <dialog> nativo: o navegador cuida do foco, do Esc e de travar o fundo.
 * No celular é uma folha que sobe de baixo (e dá para arrastar para baixo para fechar); no desktop, um modal central.
 */
export default function AboutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ y: number; id: number } | null>(null);
  const t = elleCopy.about;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Arrastar a alça para baixo fecha a folha (só em tela de toque/pequena; o CSS esconde a alça no desktop).
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { y: e.clientY, id: e.pointerId };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* sem captura o gesto ainda funciona enquanto o dedo estiver sobre a alça */
    }
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = ref.current;
    if (!drag.current || !d) return;
    const dy = Math.max(0, e.clientY - drag.current.y);
    d.style.setProperty("--drag", `${dy}px`);
    d.dataset.dragging = "";
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = ref.current;
    if (!drag.current || !d) return;
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    delete d.dataset.dragging;
    d.style.removeProperty("--drag");
    if (dy > 90) onClose();
  };

  return (
    <dialog
      ref={ref}
      className="elle-sheet"
      aria-labelledby="elle-about-title"
      onClose={onClose}
      onClick={(e) => {
        // Clique no fundo escurecido (o próprio <dialog>) fecha.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="elle-sheet__grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <span aria-hidden="true" />
      </div>
      <button type="button" className="elle-sheet__close" onClick={onClose} aria-label={t.close}>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      <div className="elle-sheet__body">
        <h2 id="elle-about-title" className="elle-sheet__title">
          {t.title}
        </h2>
        <p className="elle-sheet__sub">{t.subtitle}</p>
        <p className="elle-sheet__text">{t.body}</p>

        <div className="elle-axes">
          <h3 className="elle-axes__title">{t.categoriesTitle}</h3>
          {CATEGORY_IDS.map((id) => (
            <details key={id} name="elle-axis" className="elle-axis">
              <summary>
                <span>{categoryCopy[id].name}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 4.5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <p>{categoryCopy[id].text}</p>
            </details>
          ))}
        </div>

        <footer className="elle-credit">
          <p>
            {t.credit1}{" "}
            <a href={t.instagramUrl} target="_blank" rel="noopener noreferrer">
              {t.instagramHandle}
            </a>
          </p>
          <p>{t.credit2}</p>
        </footer>
      </div>
    </dialog>
  );
}
