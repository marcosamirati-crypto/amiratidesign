"use client";

import { useState } from "react";
import { sante } from "@/content/brands/sante";
import InView from "./InView";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

/** Antes e depois do logo: arraste (ou use as setas do teclado) para revelar. */
export function LogoShow() {
  const l = sante.logo;
  const [x, setX] = useState<number | null>(null);
  const style = x === null ? undefined : ({ "--x": x } as React.CSSProperties);
  return (
    <section className="s-sec is-cream s-logo">
      <div className="s-wrap">
        <InView>
          <p className="s-small s-up">Identidade visual</p>
          <h3 className="s-h s-mega s-xl s-up" style={stag(1)}>{l.title}</h3>
        </InView>
        <InView className="s-cmp-wrap" threshold={0.3}>
          <div className={`s-cmp s-up${x === null ? "" : " is-touched"}`} style={style}>
            <div className="cmp-a">
              <span className="cmp-logo" style={{ maskImage: "url(/brands/sante/logo-pitch.png)", WebkitMaskImage: "url(/brands/sante/logo-pitch.png)" }} />
              <span className="cmp-tag s-small">Antes · {l.antes}</span>
            </div>
            <div className="cmp-b">
              <span className="cmp-logo" style={{ maskImage: "url(/brands/sante/logo-atual.png)", WebkitMaskImage: "url(/brands/sante/logo-atual.png)" }} />
              <span className="cmp-tag s-small">Depois · {l.depois}</span>
            </div>
            <div className="cmp-handle" aria-hidden>
              <i />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={x ?? 50}
              className="cmp-range"
              aria-label="Comparar o logo do pitch com o logo atual"
              onChange={(e) => setX(+e.target.value)}
            />
          </div>
        </InView>
        <InView>
          <ul className="s-probs">
            {l.problemas.map((p, i) => (
              <li key={p} className="s-up" style={stag(i)}>
                <i aria-hidden className="prob-x s-h">✕</i>
                <span className="s-h">{p}</span>
              </li>
            ))}
          </ul>
        </InView>
      </div>
    </section>
  );
}
