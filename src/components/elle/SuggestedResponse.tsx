"use client";

import { useEffect, useRef, useState } from "react";
import { elleCopy } from "@/content/elle/copy";
import type { ReplyVariants } from "@/lib/elle/types";
import CopyButton from "./CopyButton";

type Variant = keyof ReplyVariants;
const LIMIT: Record<Variant, number> = { standard: 280, short: 150, with_source: 280 };
const ORDER: Variant[] = ["standard", "short", "with_source"];
const len = (s: string) => Array.from(s).length;

function useAutosize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}

/**
 * A resposta pronta para colar, em três tamanhos (padrão 280, curta 150, com fonte).
 * O texto é editável: quem posta é a pessoa, então ela ajusta antes de copiar.
 */
export default function SuggestedResponse({ replies, label }: { replies: ReplyVariants; label: string }) {
  const available = ORDER.filter((v) => !!replies[v]);
  const [variant, setVariant] = useState<Variant>(available[0] ?? "standard");
  const [edited, setEdited] = useState<Partial<Record<Variant, string>>>({});
  const taRef = useRef<HTMLTextAreaElement>(null);
  const text = edited[variant] ?? replies[variant] ?? "";
  useAutosize(taRef, text);

  const onKey = (e: React.KeyboardEvent) => {
    const i = available.indexOf(variant);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") setVariant(available[(i + 1) % available.length]);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") setVariant(available[(i - 1 + available.length) % available.length]);
    else return;
    e.preventDefault();
  };

  const n = len(text);
  const over = n > LIMIT[variant];
  const t = elleCopy.result;

  return (
    <div className="elle-reply">
      <div className="elle-variants" role="radiogroup" aria-label={label} onKeyDown={onKey}>
        {available.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={v === variant}
            tabIndex={v === variant ? 0 : -1}
            className="elle-variant"
            data-on={v === variant ? "" : undefined}
            onClick={() => setVariant(v)}
            title={t.variantHelp[v]}
          >
            {t.variants[v]}
          </button>
        ))}
      </div>

      <label className="elle-sr" htmlFor={`elle-reply-${label}`}>
        {label}: {t.variants[variant]}
      </label>
      <textarea
        id={`elle-reply-${label}`}
        ref={taRef}
        className="elle-reply__text"
        value={text}
        rows={3}
        spellCheck
        onChange={(e) => setEdited((p) => ({ ...p, [variant]: e.target.value }))}
      />

      <div className="elle-reply__bar">
        <span className="elle-count" data-over={over ? "" : undefined} aria-live="polite">
          {n}/{LIMIT[variant]}
          <span className="elle-sr">{over ? " caracteres: passou do limite" : " caracteres"}</span>
        </span>
        <CopyButton text={text} />
      </div>
      <p className="elle-reply__help">{t.variantHelp[variant]}</p>
    </div>
  );
}
