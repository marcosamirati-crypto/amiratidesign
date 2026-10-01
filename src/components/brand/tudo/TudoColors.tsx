"use client";

import { useRef, useState } from "react";
import { tudo } from "@/content/brands/tudo-aqui";
import InView from "../InView";
import { POCKET } from "./TudoMascots";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

function mix(hex: string, to: [number, number, number], t: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v, i) => Math.round(v + (to[i] - v) * t));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}
const tints = (hex: string) => [mix(hex, [255, 255, 255], 0.55), mix(hex, [255, 255, 255], 0.25), hex, mix(hex, [0, 0, 0], 0.22), mix(hex, [0, 0, 0], 0.42)];

export function Cores() {
  const pal = tudo.cores.paleta;
  const [i, setI] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const c = pal[i];

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      /* sem acesso à área de transferência: só mostra o aviso */
    }
    setCopied(hex);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <section className="t-sec t-dark t-cores">
      <div className="t-wrap">
        <InView>
          <p className="t-kicker t-up">Cores</p>
          <h2 className="t-h t-up" style={stag(1)}>{tudo.cores.title}</h2>
        </InView>

        <InView className="t-swatches" threshold={0.2}>
          {pal.map((p, k) => (
            <button
              key={p.key}
              type="button"
              className={`t-sw${k === i ? " is-on" : ""}`}
              style={{ "--c": p.hex, "--i": k } as React.CSSProperties}
              onClick={() => setI(k)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setI(k)}
              aria-pressed={k === i}
              aria-label={p.nome}
            >
              <svg viewBox="0 0 100 100" aria-hidden>
                <path d={POCKET} />
              </svg>
              <span className="sw-n">{p.nome}</span>
            </button>
          ))}
        </InView>

        <div className="t-cdet" key={c.key} style={{ "--c": c.hex } as React.CSSProperties}>
          <div className={`t-cdet-card ink-${c.ink}`}>
            <h3 className="t-cdet-n">{c.nome}</h3>
            <p className="t-cdet-pf">
              Cor perfeita para <b>{c.perfeita}</b>
            </p>
            <div className="t-cdet-cols">
              <div>
                <p className="t-kicker">Por que</p>
                <p>{c.porque}</p>
              </div>
              <div>
                <p className="t-kicker">Aplicação</p>
                <p>{c.aplicacao}</p>
              </div>
            </div>
            <dl className="t-specs">
              {[
                ["HEX", c.hex],
                ["RGB", c.rgb],
                ["CMYK", c.cmyk],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="t-kicker">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <button type="button" className="t-copy" onClick={() => copy(c.hex)}>
              {copied === c.hex ? "Copiado!" : `Copiar ${c.hex}`}
            </button>
          </div>
          <ul className="t-tints" aria-label={`Tons de ${c.nome}`}>
            {tints(c.hex).map((h, k) => (
              <li key={h} style={{ background: h, "--k": k } as React.CSSProperties}>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
