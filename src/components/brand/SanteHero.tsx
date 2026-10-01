"use client";

import { useEffect, useState } from "react";
import { SanteStamp } from "./SanteLogos";

const WORD = "CHEGUEI!";
const CONFETTI = [
  { dx: "-34vw", dy: "-20vh", r: "-40deg", c: "cream", s: 3.2 },
  { dx: "-24vw", dy: "18vh", r: "30deg", c: "teal", s: 2.4 },
  { dx: "-12vw", dy: "-30vh", r: "15deg", c: "blue", s: 2.2 },
  { dx: "10vw", dy: "-28vh", r: "-25deg", c: "cream", s: 2.8 },
  { dx: "26vw", dy: "-16vh", r: "50deg", c: "teal", s: 3.4 },
  { dx: "34vw", dy: "14vh", r: "-18deg", c: "cream", s: 2.4 },
  { dx: "20vw", dy: "26vh", r: "35deg", c: "blue", s: 2.6 },
  { dx: "-6vw", dy: "30vh", r: "-30deg", c: "teal", s: 2 },
];

/**
 * "CHEGUEI!": uma onda de quadrados do xadrez se dissolve, o selo da Santé cai e bate na tela (com tremida),
 * as letras de CHEGUEI! pulam uma a uma e quadradinhos voam do impacto. O botão repete a entrada.
 */
export default function SanteHero({ client, year, kicker }: { client: string; year: string; kicker: string }) {
  const [run, setRun] = useState(0);
  const [grid, setGrid] = useState<{ cols: number; rows: number } | null>(null);

  useEffect(() => {
    const cols = window.innerWidth < 640 ? 7 : 16;
    const size = window.innerWidth / cols;
    const rows = Math.ceil(window.innerHeight / size) + 1;
    setGrid({ cols, rows });
  }, [run]);

  return (
    <section key={run} className="s-hero" aria-label={client}>
      {grid && (
        <div
          className="s-tiles"
          aria-hidden
          style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, gridAutoRows: `calc(100vw / ${grid.cols})` }}
        >
          {Array.from({ length: grid.cols * grid.rows }, (_, i) => {
            const c = i % grid.cols;
            const r = Math.floor(i / grid.cols);
            return (
              <span
                key={i}
                className={(c + r) % 2 ? "t-a" : "t-b"}
                style={{ "--d": `${(c + r) * 38}ms` } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      <div className="s-shake">
        <div className="s-confetti" aria-hidden>
          {CONFETTI.map((p, i) => (
            <i
              key={i}
              className={`k-${p.c}`}
              style={{ "--dx": p.dx, "--dy": p.dy, "--r": p.r, "--s": `${p.s}vmin` } as React.CSSProperties}
            />
          ))}
        </div>
        <SanteStamp className="s-stamp" />
        <h1 className="s-cheguei" aria-label="Cheguei!">
          {Array.from(WORD).map((ch, i) => (
            <span key={i} aria-hidden className={`s-letter${ch === "!" ? " is-bang" : ""}`} style={{ "--i": i } as React.CSSProperties}>
              {ch}
            </span>
          ))}
        </h1>
        <p className="s-hero-sub">
          {kicker} · {year}
        </p>
      </div>

      <button type="button" className="s-replay" onClick={() => setRun((r) => r + 1)}>
        de novo
      </button>
    </section>
  );
}
