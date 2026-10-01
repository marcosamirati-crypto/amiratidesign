"use client";

import { useState } from "react";
import { tudo } from "@/content/brands/tudo-aqui";
import { TudoWordmark } from "./TudoLogos";
import { Mascot, POCKET, type Mood, type Tone } from "./TudoMascots";

const CREW: { tone: Tone; mood: Mood; x: number; r: number; s: number }[] = [
  { tone: "melancia", mood: "grin", x: 6, r: -14, s: 0.92 },
  { tone: "sol", mood: "smile", x: 29, r: 7, s: 1 },
  { tone: "menta", mood: "tongue", x: 54, r: -6, s: 0.96 },
  { tone: "azul", mood: "oh", x: 77, r: 12, s: 0.9 },
];

/**
 * Abertura: o bolso se desenha, o logo "tudo aqui" entra letra por letra e os vizinhos
 * sobem de trás do bolso para espiar. Os olhos seguem o cursor.
 */
export default function TudoHero({ client, year }: { client: string; year: string }) {
  const [run, setRun] = useState(0);
  return (
    <section key={run} className="t-hero" aria-label={client}>
      <div className="t-hero-pat" aria-hidden />
      <div className="t-hero-in">
        <p className="t-kicker t-hero-k">
          {tudo.kicker} · {year}
        </p>
        <h1 className="t-hero-h" aria-label={client}>
          <span className="t-badge">
            <span className="t-crew" aria-hidden>
              {CREW.map((c, i) => (
                <span key={i} className="t-crew-i" style={{ left: `${c.x}%`, "--r": `${c.r}deg`, "--s": c.s, "--i": i } as React.CSSProperties}>
                  <Mascot tone={c.tone} mood={c.mood} />
                </span>
              ))}
            </span>
            <svg viewBox="0 0 100 100" className="t-badge-svg" aria-hidden>
              <path d={POCKET} className="t-badge-fill" />
              <path d={POCKET} className="t-badge-line" pathLength={1} />
              <path d="M18 16Q50 9 82 16" className="t-badge-stitch" pathLength={1} />
            </svg>
            <TudoWordmark className="t-badge-mark" aria-hidden />
          </span>
        </h1>
        <p className="t-hero-claim">{tudo.claim}</p>
      </div>
      <button type="button" className="t-replay" onClick={() => setRun((r) => r + 1)}>
        de novo
      </button>
    </section>
  );
}
