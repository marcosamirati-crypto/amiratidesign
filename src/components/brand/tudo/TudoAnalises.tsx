"use client";

import { useState } from "react";
import { tudo } from "@/content/brands/tudo-aqui";
import InView from "../InView";
import { POCKET } from "./TudoMascots";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

/* ───────── Intro ───────── */
const SHAPES = [
  { c: "melancia", d: "M35 8h30v27h27v30H65v27H35V65H8V35h27z" }, // cruz
  { c: "sol", d: "M50 10 92 86H8z" }, // triângulo
  { c: "azul", d: "M50 8a42 42 0 1 1 0 84 42 42 0 0 1 0-84z" }, // círculo
  { c: "menta", d: "M50 6 94 50 50 94 6 50z" }, // losango
  { c: "petroleo", d: "M50 6l13 30 32 3-24 22 8 32-29-17-29 17 8-32L5 39l32-3z" }, // estrela
];

export function Intro() {
  const t = tudo.intro;
  return (
    <section className="t-sec t-paper t-intro">
      <div className="t-wrap">
        <InView className="t-intro-grid" threshold={0.2}>
          <div>
            <p className="t-kicker t-up">Intro</p>
            <p className="t-lead t-up" style={stag(1)}>
              {t.linhas[0]}
              <br />
              {t.linhas[1]}
            </p>
            <p className="t-seed t-up" style={stag(2)}>
              {t.destaque}
              <svg viewBox="0 0 60 80" className="t-sprout" aria-hidden>
                <path d="M30 78V40" pathLength={1} className="sp-stem" />
                <path d="M30 46C30 28 18 20 4 22c0 16 10 26 26 24z" className="sp-leaf l1" />
                <path d="M30 36c0-18 12-26 26-24 0 16-10 26-26 24z" className="sp-leaf l2" />
              </svg>
            </p>
          </div>
          <div className="t-shapes" aria-hidden>
            {SHAPES.map((s, i) => (
              <svg key={i} viewBox="0 0 100 100" className={`t-shape sh-${i}`} style={{ "--i": i } as React.CSSProperties}>
                <path d={s.d} className={`c-${s.c}`} />
              </svg>
            ))}
          </div>
        </InView>
        <InView className="t-intro-b" threshold={0.25}>
          <p className="t-p t-up">{t.ecossistema}</p>
          <p className="t-bairro t-up" style={stag(1)}>
            {t.bairro.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </p>
        </InView>
      </div>
    </section>
  );
}

/* ───────── Mercado: a bagunça vira organização ───────── */
const CHAOS = [
  { x: 4, y: 8, r: -7 },
  { x: 52, y: 2, r: 5 },
  { x: 20, y: 30, r: 3 },
  { x: 58, y: 28, r: -5 },
  { x: 2, y: 52, r: 6 },
  { x: 40, y: 56, r: -3 },
  { x: 62, y: 62, r: 7 },
  { x: 12, y: 78, r: -5 },
  { x: 50, y: 84, r: 4 },
];
const DOTS = ["azul", "melancia", "sol", "menta", "azul", "melancia", "sol", "menta", "azul"] as const;

export function Mercado() {
  const m = tudo.mercado;
  const [tidy, setTidy] = useState(false);
  return (
    <section className="t-sec t-dark t-mercado">
      <div className="t-wrap">
        <InView>
          <p className="t-kicker t-up">{m.label}</p>
          <h2 className="t-h t-up" style={stag(1)}>{m.title}</h2>
        </InView>
        <div className="t-merc-grid">
          <InView className="t-merc-txt">
            <h3 className="t-h3 t-up">{m.diagnostico.titulo}</h3>
            <p className="t-p t-up" style={stag(1)}>{m.diagnostico.texto}</p>
            <h3 className="t-h3 t-up" style={stag(2)}>{m.caos.titulo}</h3>
            <p className="t-p t-up" style={stag(3)}>{m.caos.texto}</p>
            <div className="t-switch t-up" style={stag(4)} role="group" aria-label="Como fica o comércio local">
              <button type="button" className={!tidy ? "is-on" : ""} onClick={() => setTidy(false)}>
                Hoje
              </button>
              <button type="button" className={tidy ? "is-on" : ""} onClick={() => setTidy(true)}>
                Com o Tudo Aqui
              </button>
            </div>
          </InView>
          <InView className="t-chaos-wrap" threshold={0.2}>
            <ul className={`t-chaos${tidy ? " is-tidy" : ""}`} aria-label="Mensagens soltas viram uma lista organizada">
              {m.caos.bolhas.map((b, i) => {
                const c = CHAOS[i];
                return (
                  <li
                    key={b}
                    style={
                      {
                        "--cx": `${c.x}%`,
                        "--cy": `${c.y}%`,
                        "--cr": `${c.r}deg`,
                        "--dx": `${2 + (i % 3) * 33}%`,
                        "--dy": `${4 + Math.floor(i / 3) * 32}%`,
                        "--mx": `${2 + (i % 2) * 50}%`,
                        "--my": `${2 + Math.floor(i / 2) * 19.4}%`,
                        "--i": i,
                      } as React.CSSProperties
                    }
                  >
                    <i className={`dot c-${DOTS[i]}`} aria-hidden />
                    {b}
                  </li>
                );
              })}
            </ul>
          </InView>
        </div>

        <InView className="t-raiox" threshold={0.15}>
          <p className="t-kicker t-up">{m.raiox.titulo}</p>
          <h3 className="t-h t-h-sm t-up" style={stag(1)}>{m.raiox.sub}</h3>
          <ol className="t-cons">
            {m.raiox.itens.map((it, i) => (
              <li key={it.t} className="t-up" style={stag(i + 2)}>
                <Icon k={i} />
                <div>
                  <h4>{it.t}</h4>
                  <p>{it.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </InView>
      </div>
    </section>
  );
}

function Icon({ k }: { k: number }) {
  return (
    <svg viewBox="0 0 80 80" className="t-ico" aria-hidden>
      {k === 0 && (
        <>
          <path d="M10 34h60l-6-20H16z" />
          <path d="M16 34v36h48V34M32 70V50h16v20" />
          <path d="M6 74 74 6" className="ico-cut" />
        </>
      )}
      {k === 1 && (
        <>
          <circle cx="16" cy="18" r="5" />
          <circle cx="62" cy="14" r="5" />
          <circle cx="40" cy="42" r="5" />
          <circle cx="14" cy="64" r="5" />
          <circle cx="66" cy="62" r="5" />
          <path d="M20 22l16 16M58 18 44 38M18 60l18-14M62 58 44 46" strokeDasharray="3 5" />
        </>
      )}
      {k === 2 && (
        <>
          <path d="M6 66h20l8-14 12 0 8-14h20" />
          <path d="M6 72h68" strokeDasharray="6 6" />
          <path d="M52 20l-8 12 10 4-8 12" className="ico-cut" />
        </>
      )}
    </svg>
  );
}

/* ───────── Público ───────── */
export function Publico() {
  const p = tudo.publico;
  const cmp = p.comportamento;
  return (
    <section className="t-sec t-paper t-publico">
      <div className="t-wrap">
        <InView>
          <p className="t-kicker t-up">{p.label}</p>
          <h2 className="t-h t-up" style={stag(1)}>{p.title}</h2>
        </InView>
        <InView className="t-fichas" threshold={0.12}>
          {p.perfil.map((f, i) => (
            <article key={f.t} className={`t-ficha f-${i} t-up`} style={stag(i)}>
              <i aria-hidden className="t-tape" />
              <h3 className="t-h3">{f.t}</h3>
              <p>{f.d}</p>
            </article>
          ))}
        </InView>

        <InView>
          <h3 className="t-h t-h-sm t-sub t-up">{cmp.title}</h3>
        </InView>

        <div className="t-comp">
          <InView className="t-comp-a" threshold={0.25}>
            <h4 className="t-h3 t-up">{cmp.confianca.t}</h4>
            <p className="t-p t-up" style={stag(1)}>{cmp.confianca.d}</p>
            <ol className="t-flow t-up" style={stag(2)} aria-label="O caminho até fechar a compra">
              <li>pesquisa o preço</li>
              <li>olha a interface</li>
              <li className="fork">
                <span className="ok">parece seguro? fecha</span>
                <span className="no">parece instável? desiste na hora</span>
              </li>
            </ol>
          </InView>

          <InView className="t-comp-b" threshold={0.3}>
            <h4 className="t-h3 t-up">{cmp.mobile.t}</h4>
            <p className="t-p t-up" style={stag(1)}>{cmp.mobile.d}</p>
            <ul className="t-bars">
              {cmp.mobile.barras.map((b, i) => (
                <li key={b.l} style={{ "--v": b.v, "--i": i } as React.CSSProperties}>
                  <span className="b-l">{b.l}</span>
                  <span className="b-track">
                    <i className="b-fill" />
                  </span>
                  <b className="b-v">{b.v}%</b>
                </li>
              ))}
            </ul>
          </InView>

          <InView className="t-comp-c" threshold={0.3}>
            <h4 className="t-h3 t-up">{cmp.concorrente.t}</h4>
            <p className="t-p t-up" style={stag(1)}>{cmp.concorrente.d}</p>
            <div className="t-hundred" role="img" aria-label={`${cmp.concorrente.v} em cada 100 pessoas usam o WhatsApp como ferramenta de comércio`}>
              {Array.from({ length: 100 }, (_, k) => (
                <svg key={k} viewBox="0 0 100 100" className={k < cmp.concorrente.v ? "is-zap" : ""} style={{ "--k": k } as React.CSSProperties}>
                  <path d={POCKET} />
                </svg>
              ))}
            </div>
            <p className="t-hundred-l">
              <b>{cmp.concorrente.v}</b> de cada 100 usam o zap para vender e comprar.
            </p>
          </InView>
        </div>
      </div>
    </section>
  );
}
