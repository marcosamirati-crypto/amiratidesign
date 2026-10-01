"use client";

import { useEffect, useState } from "react";
import { sante, santeColors } from "@/content/brands/sante";
import InView from "./InView";
import { SanteWordmark } from "./SanteLogos";
import Tabs from "./Tabs";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;
const { orange: O, cream: C, teal: T } = santeColors;

/* ───────── Digital ───────── */
function Digital() {
  const { legenda, respostas } = sante.verbal.digital;
  const [line, setLine] = useState(0);
  return (
    <div className="tp-digital">
      <div className="tp-caption">
        <div className="tp-post-wrap">
          <figure className="s-post" aria-label="Exemplo de post da Santé">
            <div className="post-top">
              <span className="post-av" aria-hidden />
              <span className="s-small">santeburger</span>
            </div>
            <p className={`post-hook s-h${line === 0 ? " is-hl" : ""}`}>{legenda.exemplo[0]}</p>
            <div aria-hidden className="post-band s-checker" />
          </figure>
          <p className={`post-cap${line === 1 ? " is-l2" : ""}${line === 2 ? " is-l3" : ""}${line === 0 ? " is-l1" : ""}`}>
            <b>santeburger</b> <span className="c1">{legenda.exemplo[0]}</span> <span className="c2">{legenda.exemplo[1]}</span>{" "}
            <span className="c3">{legenda.exemplo[2]}</span>
          </p>
        </div>
        <div className="tp-anat">
          <h4 className="s-h s-q2">{legenda.title}</h4>
          <ol className="anat">
            {legenda.linhas.map((l, i) => (
              <li key={l.n}>
                <button
                  type="button"
                  className={`anat-row${line === i ? " is-on" : ""}`}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setLine(i)}
                  onFocus={() => setLine(i)}
                  onClick={() => setLine(i)}
                >
                  <i className="anat-n s-h">{i + 1}</i>
                  <span className="anat-txt">
                    <b className="s-small">{l.n}</b>
                    <span>{l.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="tp-resp">
        <h4 className="s-h s-q2">{respostas.title}</h4>
        <p className="s-p">{respostas.tom}</p>
        <ul className="chat">
          {respostas.casos.map((c, i) => (
            <li key={c.tipo} className="rise" style={stag(i)}>
              <span className="chat-tag s-small">{c.tipo}</span>
              <p className="bub bub-me">{c.fala}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ───────── Impressos: três peças desenhadas em SVG ───────── */
const Dot = ({ x, y, n }: { x: number; y: number; n: number }) => (
  <g className="mk-pin" transform={`translate(${x} ${y})`}>
    <circle r="15" className="pin-ring" />
    <circle r="15" className="pin-fill" />
    <text textAnchor="middle" y="5" className="pin-n">{n}</text>
  </g>
);

function Chk({ id, a, b }: { id: string; a: string; b: string }) {
  return (
    <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
      <rect width="28" height="28" fill={b} />
      <rect width="14" height="14" fill={a} />
      <rect x="14" y="14" width="14" height="14" fill={a} />
    </pattern>
  );
}

function Box() {
  return (
    <svg viewBox="0 0 480 400" className="mk" role="img" aria-label="Caixa de hambúrguer com a frase THE MOUTHWATERING BURGER na tampa">
      <defs>
        <Chk id="mk-chk-box" a={C} b={O} />
        <clipPath id="mk-lid"><rect x="40" y="50" width="400" height="230" rx="20" /></clipPath>
      </defs>
      <ellipse cx="240" cy="352" rx="210" ry="20" className="mk-shadow" />
      <path d="M40 270h400v50a20 20 0 0 1-20 20H60a20 20 0 0 1-20-20z" fill="#d4401f" />
      <path d="M40 270h400" stroke="#b83214" strokeWidth="4" />
      <g clipPath="url(#mk-lid)">
        <rect x="40" y="50" width="400" height="230" fill={O} />
        <rect x="40" y="50" width="400" height="38" fill="url(#mk-chk-box)" />
        <rect x="40" y="242" width="400" height="38" fill="url(#mk-chk-box)" />
      </g>
      <g className="mk-lid-txt">
        <text x="240" y="150" textAnchor="middle" className="mk-t">THE</text>
        <text x="240" y="196" textAnchor="middle" className="mk-t mk-t-b">MOUTHWATERING</text>
        <text x="240" y="232" textAnchor="middle" className="mk-t mk-t-m">BURGER</text>
      </g>
      <text x="240" y="311" textAnchor="middle" className="mk-side">Abrir devagar é opcional. Resist if you can.</text>
      <Dot x={412} y={78} n={1} />
      <Dot x={412} y={300} n={2} />
    </svg>
  );
}

function Bag() {
  return (
    <svg viewBox="0 0 480 400" className="mk" role="img" aria-label="Sacola de viagem da Santé">
      <defs>
        <Chk id="mk-chk-bag" a={O} b={C} />
        <clipPath id="mk-bag-body"><path d="M120 120h240l12 218H108z" /></clipPath>
      </defs>
      <ellipse cx="240" cy="356" rx="170" ry="16" className="mk-shadow" />
      <path d="M190 128c-6-70 14-96 50-96s56 26 50 96" fill="none" stroke="#c9a46a" strokeWidth="9" strokeLinecap="round" />
      <path d="M120 120h240l12 218H108z" fill={C} stroke={T} strokeWidth="5" strokeLinejoin="round" />
      <path d="M120 120h240l6 56H114z" fill="#efe9cf" />
      <path d="M114 176h252" stroke={T} strokeWidth="3" strokeDasharray="2 8" />
      <g clipPath="url(#mk-bag-body)">
        <rect x="100" y="296" width="280" height="42" fill="url(#mk-chk-bag)" />
      </g>
      <SanteWordmark x={186} y={196} width={108} height={43} style={{ color: T }} />
      <text x="240" y="262" textAnchor="middle" className="mk-t mk-t-s">THE MOUTHWATERING BURGER</text>
      <text x="240" y="284" textAnchor="middle" className="mk-side mk-side-t">Simples. Clássico. Santé.</text>
      <text x="240" y="154" textAnchor="middle" className="mk-side mk-side-b">Drive safe. Come back hungry.</text>
      <Dot x={352} y={226} n={1} />
      <Dot x={352} y={146} n={2} />
    </svg>
  );
}

function Cup() {
  return (
    <svg viewBox="0 0 480 400" className="mk" role="img" aria-label="Copo de refrigerante e shake da Santé">
      <defs>
        <Chk id="mk-chk-cup" a={O} b={C} />
        <clipPath id="mk-cup-body"><path d="M150 108h180l-22 240H172z" /></clipPath>
      </defs>
      <ellipse cx="240" cy="364" rx="130" ry="14" className="mk-shadow" />
      <path d="M262 108 276 28l36-12" fill="none" stroke={O} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="138" y="84" width="204" height="28" rx="14" fill={T} />
      <path d="M150 108h180l-22 240H172z" fill={C} stroke={T} strokeWidth="5" strokeLinejoin="round" />
      <g clipPath="url(#mk-cup-body)">
        <rect x="140" y="176" width="200" height="56" fill="url(#mk-chk-cup)" />
      </g>
      <SanteWordmark x={196} y={118} width={88} height={35} style={{ color: T }} />
      <text x="240" y="262" textAnchor="middle" className="mk-side mk-side-c">Cold enough.</text>
      <text x="240" y="280" textAnchor="middle" className="mk-side mk-side-c">Good enough.</text>
      <text x="240" y="298" textAnchor="middle" className="mk-side mk-side-c">That’s enough.</text>
      <Dot x={338} y={204} n={1} />
      <Dot x={318} y={282} n={2} />
    </svg>
  );
}

const MOCK = { caixa: Box, sacola: Bag, copo: Cup } as const;

function Impressos() {
  const { itens } = sante.verbal.impressos;
  const [k, setK] = useState<keyof typeof MOCK>("caixa");
  const item = itens.find((i) => i.key === k)!;
  const Mock = MOCK[k];
  return (
    <div className="tp-print">
      <div className="pieces" role="tablist" aria-label="Peça impressa">
        {itens.map((i) => (
          <button key={i.key} type="button" role="tab" aria-selected={k === i.key} className={`piece${k === i.key ? " is-on" : ""}`} onClick={() => setK(i.key as keyof typeof MOCK)}>
            <span className="s-h">{i.name}</span>
          </button>
        ))}
      </div>
      <div className="print-grid" key={k}>
        <div className="print-fig">
          <Mock />
        </div>
        <ol className="print-parts">
          {item.partes.map((p, i) => (
            <li key={p.onde} style={stag(i)}>
              <i className="pp-n s-h">{i + 1}</i>
              <div>
                <span className="s-small">{p.onde}</span>
                <p className="pp-fala">{p.fala}</p>
                {"nota" in p && p.nota ? <span className="pp-nota">{p.nota}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ───────── Ponto de venda ───────── */
function Neon({ frases }: { frases: string[] }) {
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % frases.length), 3400);
    return () => window.clearInterval(t);
  }, [auto, frases.length]);
  return (
    <div className="neon">
      <div className="neon-frame">
        <i className="neon-bolt b1" aria-hidden />
        <i className="neon-bolt b2" aria-hidden />
        <p key={i} className="neon-txt s-h" aria-live="polite">{frases[i]}</p>
      </div>
      <div className="neon-dots" role="group" aria-label="Frases dos letreiros">
        {frases.map((f, k) => (
          <button
            key={f}
            type="button"
            aria-label={f}
            aria-pressed={i === k}
            className={i === k ? "is-on" : ""}
            onClick={() => {
              setAuto(false);
              setI(k);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Pdv() {
  const { cardapio, letreiros } = sante.verbal.pdv;
  return (
    <div className="tp-pdv">
      <div className="pdv-menu">
        <h4 className="s-h s-q2">{cardapio.title}</h4>
        <p className="s-p">{cardapio.text}</p>
        <div className="menu-card">
          <div className="menu-head">
            <span className="s-small">Menu</span>
            <span aria-hidden className="menu-chk s-checker" />
          </div>
          <ol className="menu-list">
            {cardapio.nomes.map((n, i) => (
              <li key={n} style={stag(i)} className={i === 3 ? "is-night" : ""}>
                <b className="s-h">{n}</b>
                <i aria-hidden className="leader" />
                <span className="s-small">{String(i + 1).padStart(2, "0")}</span>
              </li>
            ))}
          </ol>
          <p className="menu-note s-small">{cardapio.nomesNota}</p>
          <div className="menu-ex">
            <b className="s-h">{cardapio.exemplo.nome}</b>
            <p>{cardapio.exemplo.desc}</p>
          </div>
        </div>
      </div>
      <div className="pdv-sign">
        <h4 className="s-h s-q2">{letreiros.title}</h4>
        <p className="s-p">{letreiros.text}</p>
        <Neon frases={letreiros.frases} />
        <figure className="exit">
          <div className="exit-board">
            <i className="rv rv-a" />
            <i className="rv rv-b" />
            <i className="rv rv-c" />
            <i className="rv rv-d" />
            <p className="s-h">{letreiros.saida}</p>
          </div>
          <figcaption className="s-p">{letreiros.saidaNota}</figcaption>
        </figure>
      </div>
    </div>
  );
}

type Tab = "digital" | "impressos" | "pdv";

export function Touchpoints() {
  const v = sante.verbal;
  const [tab, setTab] = useState<Tab>("digital");
  return (
    <section className="s-sec is-cream s-touch">
      <div className="s-wrap">
        <InView>
          <p className="s-small s-up">Identidade verbal</p>
          <h3 className="s-h s-mid s-up" style={stag(1)}>
            Por ponto
            <br />
            de contato
          </h3>
        </InView>
        <InView threshold={0.1}>
          <div className="s-up" style={stag(2)}>
            <Tabs<Tab>
              label="Pontos de contato"
              value={tab}
              onChange={setTab}
              items={[
                { id: "digital", label: v.digital.tab },
                { id: "impressos", label: v.impressos.tab },
                { id: "pdv", label: v.pdv.tab },
              ]}
            />
          </div>
        </InView>
        <div className="tp-panel" key={tab}>
          {tab === "digital" && <Digital />}
          {tab === "impressos" && <Impressos />}
          {tab === "pdv" && <Pdv />}
        </div>
      </div>
    </section>
  );
}
