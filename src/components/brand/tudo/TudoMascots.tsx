"use client";

import { useEffect } from "react";
import { tudoColors } from "@/content/brands/tudo-aqui";

/** O formato do bolso: topo reto, cantos arredondados e a ponta embaixo. */
export const POCKET = "M14 4H86Q96 4 96 14V58Q96 64 91 67L55 95Q50 98 45 95L9 67Q4 64 4 58V14Q4 4 14 4Z";

export type Mood = "grin" | "smile" | "tongue" | "oh";
export type Tone = keyof Pick<typeof tudoColors, "petroleo" | "azul" | "menta" | "sol" | "melancia">;

const INK = "#073B4C";

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case "grin":
      return (
        <g className="t-mouth">
          <path d="M30 56Q50 74 70 56Z" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M40 60v8M50 62v9M60 60v8" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case "smile":
      return <path className="t-mouth" d="M32 56Q50 76 68 56Q50 61 32 56Z" fill={INK} stroke={INK} strokeWidth="4" strokeLinejoin="round" />;
    case "tongue":
      return (
        <g className="t-mouth">
          <path d="M32 56Q50 72 68 56" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M50 64q8 0 8 8t-8 8q-8 0-8-8t8-8z" fill="#EF476F" stroke={INK} strokeWidth="3" transform="translate(-2 -6) scale(0.8) translate(10 10)" />
        </g>
      );
    default:
      return <ellipse className="t-mouth" cx="50" cy="64" rx="7" ry="9" fill={INK} />;
  }
}

/**
 * Um vizinho: o bolso da marca com olho, boca e opinião. Os olhos seguem o cursor (veja <MascotLooks />),
 * piscam de vez em quando e, ao clicar, a boca troca de humor.
 */
export function Mascot({
  tone,
  mood = "grin",
  className = "",
  title,
  size,
}: {
  tone: Tone;
  mood?: Mood;
  className?: string;
  title?: string;
  /** Tamanho fixo em px (para usar dentro de outro SVG). Sem isso, ocupa a largura do contêiner. */
  size?: number;
}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`t-mascot${size ? " is-fixed" : ""} ${className}`} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path d={POCKET} fill={tudoColors[tone]} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      {[34, 66].map((x) => (
        <g key={x} className="t-eye" transform={`translate(${x} 33)`}>
          <ellipse rx="12" ry="13.5" fill="#fff" stroke={INK} strokeWidth="4" className="t-eye-w" />
          <circle r="5.2" fill={INK} className="t-pupil" />
        </g>
      ))}
      <Mouth mood={mood} />
    </svg>
  );
}

/** Um único ouvinte de mouse que vira as pupilas de todos os vizinhos da página para o cursor. */
export function MascotLooks() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      document.querySelectorAll<SVGSVGElement>(".t-mascot").forEach((svg) => {
        const r = svg.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const k = r.width / 100;
        svg.querySelectorAll<SVGGElement>(".t-eye").forEach((eye) => {
          const e = eye.getBoundingClientRect();
          const dx = x - (e.left + e.width / 2);
          const dy = y - (e.top + e.height / 2);
          const d = Math.hypot(dx, dy) || 1;
          const m = Math.min(d / (60 * k), 1) * 4.6;
          const pupil = eye.querySelector<SVGCircleElement>(".t-pupil");
          if (pupil) pupil.style.transform = `translate(${((dx / d) * m).toFixed(2)}px, ${((dy / d) * m).toFixed(2)}px)`;
        });
      });
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
