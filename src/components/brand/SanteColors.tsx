"use client";

import { useRef, useState } from "react";
import { sante, santeColors } from "@/content/brands/sante";
import InView from "./InView";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

/** Anel que se preenche enquanto o número sobe (contador por CSS, sem JS). */
function Stat({ value, label, tone }: { value: number; label: string; tone: "orange" | "teal" }) {
  return (
    <div className={`s-stat s-up tone-${tone}`} style={{ "--v": value } as React.CSSProperties} role="img" aria-label={`${value}% ${label}`}>
      <svg viewBox="0 0 220 220" className="s-ring" aria-hidden>
        <circle cx="110" cy="110" r="92" className="ring-bg" />
        <circle cx="110" cy="110" r="92" className="ring-fg" pathLength={100} />
      </svg>
      <div className="s-stat-n" aria-hidden>
        <b className="s-h" />
        <span className="s-h">%</span>
      </div>
      <p className="s-stat-l" aria-hidden>{label}</p>
    </div>
  );
}

export function ColorStats() {
  const c = sante.cores;
  return (
    <section className="s-sec is-blue">
      <div className="s-wrap">
        <InView>
          <p className="s-small s-up">Cores</p>
          <h3 className="s-h s-mega s-xl s-up" style={stag(1)}>
            A cor decide
            <br />
            antes do paladar
          </h3>
        </InView>
        <div className="s-stats-grid">
          <InView className="s-stats-txt">
            {c.intro.map((t, i) => (
              <p key={i} className="s-p s-up" style={stag(i + 2)}>{t}</p>
            ))}
          </InView>
          <InView className="s-stats" threshold={0.3}>
            {c.stats.map((s) => (
              <Stat key={s.value} value={s.value} label={s.label} tone={s.color as "orange" | "teal"} />
            ))}
          </InView>
        </div>
      </div>
    </section>
  );
}

/** O oceano de vermelhos: uma bolinha da Santé aparece no meio e vira a única que você reconhece. */
const REDS = ["#e63946", "#d62828", "#e5383b", "#c1121f", "#ef233c", "#dc2f2f", "#cf1f2e"];
const COLS = 12;
const ROWS = 6;

export function RedOcean() {
  const p = sante.cores.problema;
  const hot = { c: 5, r: 2 };
  const cx = hot.c * 80 + 40;
  const cy = hot.r * 80 + 40;
  return (
    <section className="s-sec is-cream s-ocean">
      <div className="s-wrap">
        <InView className="s-ocean-fig" threshold={0.3}>
          <svg viewBox={`0 0 ${COLS * 80} ${ROWS * 80}`} className="s-dots" role="img" aria-label="Um mar de bolinhas vermelhas iguais, e uma única bolinha com as cores da Santé">
            {Array.from({ length: COLS * ROWS }, (_, k) => {
              const c = k % COLS;
              const r = Math.floor(k / COLS);
              if (c === hot.c && r === hot.r) return null;
              return (
                <circle
                  key={k}
                  cx={c * 80 + 40}
                  cy={r * 80 + 40}
                  r={28}
                  fill={REDS[(c * 3 + r * 5) % REDS.length]}
                  className="dot"
                  style={{ "--i": (c + r * 2) % 13 } as React.CSSProperties}
                />
              );
            })}
            <g className="dot-hot" style={{ transformOrigin: `${cx}px ${cy}px` }}>
              <circle cx={cx} cy={cy} r={28} fill={REDS[0]} className="hot-red" />
              <g className="hot-brand">
                <circle cx={cx} cy={cy} r={50} className="hot-halo" />
                <path d={`M${cx} ${cy}V${cy - 44}A44 44 0 0 1 ${cx + 44} ${cy}Z`} fill={santeColors.orange} />
                <path d={`M${cx} ${cy}H${cx + 44}A44 44 0 0 1 ${cx} ${cy + 44}Z`} fill={santeColors.teal} />
                <path d={`M${cx} ${cy}V${cy + 44}A44 44 0 0 1 ${cx - 44} ${cy}Z`} fill={santeColors.blue} />
                <path d={`M${cx} ${cy}H${cx - 44}A44 44 0 0 1 ${cx} ${cy - 44}Z`} fill={santeColors.cream} />
                <circle cx={cx} cy={cy} r={44} fill="none" stroke={santeColors.teal} strokeWidth={5} />
              </g>
            </g>
          </svg>
        </InView>
        <InView className="s-ocean-txt">
          <p className="s-small s-up">{p.label}</p>
          <h3 className="s-h s-big s-up" style={stag(1)}>{p.title}</h3>
          {p.text.map((t, i) => (
            <p key={i} className="s-p s-up" style={stag(i + 2)}>{t}</p>
          ))}
        </InView>
      </div>
    </section>
  );
}

/** Paleta: faixas que se abrem. Clique no HEX para copiar. */
export function Palette() {
  const pal = sante.cores.paleta;
  const [open, setOpen] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      /* sem permissão de área de transferência: só mostra o aviso */
    }
    setCopied(hex);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <section className="s-pal-sec" aria-label="Paleta de cores">
      <InView className="s-pal" threshold={0.15}>
        {pal.map((c, i) => {
          const isOpen = open === i;
          const specs = [
            ["HEX", c.hex],
            ["RGB", c.rgb],
            ["CMYK", c.cmyk],
            ["Pantone", c.pantone],
          ].filter(([, v]) => v);
          return (
            <article
              key={c.key}
              className={`pal ink-${c.ink}${isOpen ? " is-open" : ""}`}
              style={{ "--bg": c.hex, "--i": i } as React.CSSProperties}
              onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(i)}
            >
              <button type="button" className="pal-head" aria-expanded={isOpen} onClick={() => setOpen(i)}>
                <span className="pal-vname s-h">{c.name}</span>
                <span className="pal-vhex s-small">{c.hex}</span>
              </button>
              <div className="pal-body">
                <div className="pal-inner">
                  <h4 className="pal-name s-h">{c.name}</h4>
                  <p className="pal-lead">{c.lead}</p>
                  <p className="pal-text">{c.text}</p>
                  <dl className="pal-specs">
                    {specs.map(([k, v]) => (
                      <div key={k}>
                        <dt className="s-small">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <button type="button" className="pal-copy" onClick={() => copy(c.hex)} tabIndex={isOpen ? 0 : -1}>
                    {copied === c.hex ? "Copiado!" : `Copiar ${c.hex}`}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </InView>
    </section>
  );
}
