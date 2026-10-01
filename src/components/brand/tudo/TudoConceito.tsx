"use client";

import { useState } from "react";
import { tudo } from "@/content/brands/tudo-aqui";
import InView from "../InView";
import { TudoWordmark } from "./TudoLogos";
import { Mascot, POCKET } from "./TudoMascots";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

/** Rota do "daqui até aqui": o caminho se desenha e um vizinho percorre. */
const ROUTE = "M70 70C190 70 190 150 110 150S10 230 130 230 330 150 420 190 560 290 640 250 740 150 780 190";

function Route() {
  return (
    <div className="t-route" aria-hidden>
      <svg viewBox="0 0 860 330">
        <path d={ROUTE} className="rt-bg" />
        <path d={ROUTE} className="rt-line" pathLength={1} />
        <g className="rt-pin" transform="translate(70 70)">
          <path d="M0 0C-14-16-22-28-22-40a22 22 0 0 1 44 0c0 12-8 24-22 40z" />
          <circle cy="-40" r="8" />
        </g>
        <g className="rt-flag" transform="translate(780 190)">
          <path d="M0 0V-62" />
          <path d="M0-62h46l-10 16 10 16H0z" />
        </g>
        <text x="70" y="104" className="rt-t">daqui</text>
        <text x="738" y="228" className="rt-t">até aqui</text>
        <g className="rt-runner" style={{ offsetPath: `path("${ROUTE}")` } as React.CSSProperties}>
          <g transform="translate(-26 -34)">
            <Mascot tone="melancia" mood="smile" size={52} />
          </g>
        </g>
      </svg>
    </div>
  );
}

function PhoneInPocket() {
  return (
    <div className="t-pocket-scene" aria-hidden>
      <svg viewBox="0 0 320 380" className="ps-svg">
        <g className="ps-phone">
          <rect x="92" y="20" width="136" height="260" rx="24" className="ps-body" />
          <rect x="102" y="34" width="116" height="232" rx="14" className="ps-screen" />
          <rect x="136" y="40" width="48" height="10" rx="5" className="ps-notch" />
          <TudoWordmark x={118} y={96} width={84} height={52} className="ps-mark" />
          <g transform="translate(118 168) scale(0.34)">
            <path d={POCKET} className="ps-mini a" />
          </g>
          <g transform="translate(150 168) scale(0.34)">
            <path d={POCKET} className="ps-mini b" />
          </g>
          <g transform="translate(182 168) scale(0.34)">
            <path d={POCKET} className="ps-mini c" />
          </g>
          <rect x="116" y="222" width="88" height="22" rx="11" className="ps-btn" />
        </g>
        <path d="M30 168H290V318Q290 330 278 336L168 372Q160 375 152 372L42 336Q30 330 30 318Z" className="ps-pocket" />
        <path d="M44 184H276" className="ps-stitch" />
        <path d="M44 196H276" className="ps-stitch s2" />
        <path d="M56 318 160 354 264 318" className="ps-stitch s3" />
      </svg>
    </div>
  );
}

function Rotas() {
  const m = tudo.conceito.moodboard;
  const [on, setOn] = useState<"humana" | "modular">("humana");
  return (
    <div className="t-rotas">
      <h3 className="t-h t-h-sm t-up">{m.title}</h3>
      <div className="t-rotas-grid">
        {m.rotas.map((r) => (
          <button
            key={r.key}
            type="button"
            className={`t-rota r-${r.key}${on === r.key ? " is-on" : ""}`}
            aria-pressed={on === r.key}
            onClick={() => setOn(r.key as "humana" | "modular")}
            onPointerEnter={(e) => e.pointerType === "mouse" && setOn(r.key as "humana" | "modular")}
          >
            <span className="r-art" aria-hidden>
              {r.key === "humana" ? (
                <>
                  <i className="b1" />
                  <i className="b2" />
                  <i className="b3" />
                  <span className="hand">oi, vizinho!</span>
                  <svg viewBox="0 0 120 24" className="wave">
                    <path d="M2 14Q17 2 32 14T62 14T92 14T118 14" />
                  </svg>
                </>
              ) : (
                <>
                  {Array.from({ length: 12 }, (_, k) => (
                    <i key={k} className={`m${k}`} />
                  ))}
                  <span className="r-mas">
                    <Mascot tone="azul" mood="grin" />
                  </span>
                </>
              )}
            </span>
            <span className="r-nome t-h3">{r.nome}</span>
            <span className="r-txt">{r.texto}</span>
          </button>
        ))}
      </div>
      <p className="t-p t-rotas-fim">As duas rotas se encontram no logo: letra de mão dentro de um bolso.</p>
    </div>
  );
}

export function Conceito() {
  const c = tudo.conceito;
  return (
    <section className="t-sec t-azul t-conceito">
      <div className="t-wrap">
        <InView>
          <p className="t-kicker t-up">{c.label}</p>
          <p className="t-big t-up" style={stag(1)}>
            {c.frase[0]} <em>{c.frase[1]}</em>
          </p>
        </InView>

        <InView className="t-claim-wrap" threshold={0.3}>
          <PhoneInPocket />
          <div className="t-claim-txt">
            <p className="t-claim t-up">{c.claim}</p>
            <h3 className="t-h3 t-up" style={stag(1)}>{c.tres.title}</h3>
            <ol className="t-tres">
              {c.tres.itens.map((t, i) => (
                <li key={t} className="t-up" style={stag(i + 2)}>
                  <b>{i + 1}</b>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </InView>

        <InView className="t-route-wrap" threshold={0.35}>
          <Route />
        </InView>

        <InView threshold={0.15}>
          <Rotas />
        </InView>
      </div>
    </section>
  );
}
