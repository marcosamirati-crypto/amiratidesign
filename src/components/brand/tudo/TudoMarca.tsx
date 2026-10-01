"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tudo } from "@/content/brands/tudo-aqui";
import InView from "../InView";
import { TudoWordmark } from "./TudoLogos";
import { Mascot, POCKET, type Mood, type Tone } from "./TudoMascots";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;
const STEP_MS = 2600;

/** Uma cena da história do logo. Cada uma recomeça a animação quando entra (key). */
function Scene({ id }: { id: string }) {
  switch (id) {
    case "comeco":
      return <p className="sc-t sc-small">vamos começar por aqui</p>;
    case "aqui":
      return <p className="sc-t sc-pop">aqui</p>;
    case "antes":
      return (
        <p className="sc-t sc-small">
          mas antes…
          <br />
          <b>qual a semente do negócio?</b>
        </p>
      );
    case "entregas":
      return (
        <p className="sc-t sc-stack">
          <span>entregas.</span>
          <b>entregas de tudo.</b>
        </p>
      );
    case "rota":
      return (
        <svg viewBox="0 0 400 220" className="sc-route" aria-hidden>
          <path d="M80 50c70 0 60 40 10 40S20 130 120 130s160-30 200 10" className="sr-line" pathLength={1} />
          <g transform="translate(80 50)" className="sr-pin">
            <path d="M0 0C-8-9-12-16-12-22a12 12 0 0 1 24 0c0 6-4 13-12 22z" />
          </g>
          <g transform="translate(320 140)" className="sr-flag">
            <path d="M0 0v-34M0-34h24l-5 8 5 8H0" />
          </g>
          <text x="40" y="82" className="sr-t">daqui</text>
          <text x="300" y="168" className="sr-t">até aqui</text>
        </svg>
      );
    case "aqui-letra":
      return <p className="sc-t sc-brown sc-grow">aqui</p>;
    case "tudo":
      return <TudoWordmark className="sc-mark" aria-hidden />;
    case "bolso":
      return (
        <div className="sc-pocket">
          <svg viewBox="0 0 100 100" aria-hidden>
            <path d={POCKET} className="spk-line" pathLength={1} />
          </svg>
          <span>no seu bolso</span>
        </div>
      );
    default:
      return (
        <div className="sc-badge">
          <svg viewBox="0 0 100 100" aria-hidden>
            <path d={POCKET} className="sb-fill" />
            <path d={POCKET} className="sb-line" />
          </svg>
          <TudoWordmark className="sb-mark" aria-hidden />
        </div>
      );
  }
}

/** Player da história do logo: avança sozinho quando está na tela; dá para pausar, voltar e pular. */
function Story() {
  const cenas = tudo.marca.cenas;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [seen, setSeen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false);
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const next = useCallback(() => setI((v) => (v + 1) % cenas.length), [cenas.length]);

  useEffect(() => {
    if (!playing || !seen) return;
    const t = window.setTimeout(next, STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, seen, i, next]);

  const last = cenas[i].id === "selo";
  return (
    <div className="t-story" ref={box}>
      <div className={`t-stage sg-${cenas[i].id}`} key={i} aria-live="polite" aria-label={cenas[i].texto}>
        <Scene id={cenas[i].id} />
      </div>
      <div className="t-story-bar">
        <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pausar" : "Tocar"} className="sb-play">
          {playing ? "Pausar" : "Tocar"}
        </button>
        <ol className="sb-dots" aria-label="Cenas">
          {cenas.map((c, k) => (
            <li key={c.id}>
              <button
                type="button"
                className={k === i ? "is-on" : k < i ? "is-past" : ""}
                aria-label={`Cena ${k + 1}: ${c.texto}`}
                onClick={() => {
                  setI(k);
                  setPlaying(false);
                }}
              />
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="sb-next"
          onClick={() => {
            if (last) setI(0);
            else next();
            setPlaying(false);
          }}
        >
          {last ? "Ver de novo" : "Próxima"}
        </button>
      </div>
    </div>
  );
}

/** Um bolso para cada cor: o selo do logo nas cinco cores, com um balanço ao passar o mouse. */
const SELOS: { bg: string; fg: string }[] = [
  { bg: "#118AB2", fg: "#073B4C" },
  { bg: "#073B4C", fg: "#118AB2" },
  { bg: "#06D6A0", fg: "#073B4C" },
  { bg: "#FFD166", fg: "#073B4C" },
  { bg: "#EF476F", fg: "#073B4C" },
];

function Selos() {
  return (
    <div className="t-selos">
      {SELOS.map((s, i) => (
        <div key={i} className="t-selo" style={{ "--bg": s.bg, "--fg": s.fg, "--i": i } as React.CSSProperties}>
          <svg viewBox="0 0 100 100" className="sl-pk" aria-hidden>
            <path d={POCKET} />
          </svg>
          <TudoWordmark className="sl-mark" aria-hidden />
        </div>
      ))}
    </div>
  );
}

const VIZ: { tone: Tone; mood: Mood; nome: string }[] = [
  { tone: "melancia", mood: "grin", nome: "rosa" },
  { tone: "azul", mood: "smile", nome: "azul" },
  { tone: "menta", mood: "tongue", nome: "menta" },
  { tone: "sol", mood: "oh", nome: "amarelo" },
];
const MOODS: Mood[] = ["grin", "smile", "tongue", "oh"];

/** Os vizinhos: os olhos seguem o cursor e, ao clicar, a boca troca de humor. */
function Vizinhos() {
  const p = tudo.marca.personagens;
  const [moods, setMoods] = useState<Mood[]>(VIZ.map((v) => v.mood));
  return (
    <div className="t-viz">
      <div className="t-viz-txt">
        <h3 className="t-h t-h-sm t-up">{p.title}</h3>
        <p className="t-p t-up" style={stag(1)}>{p.texto}</p>
        <p className="t-hint t-up" style={stag(2)}>Passe o mouse por perto, ou toque em um deles.</p>
      </div>
      <div className="t-viz-row">
        {VIZ.map((v, i) => (
          <button
            key={v.nome}
            type="button"
            className="t-viz-i"
            style={{ "--i": i } as React.CSSProperties}
            aria-label={`Vizinho ${v.nome}: trocar a cara`}
            onClick={() =>
              setMoods((m) => {
                const n = [...m];
                n[i] = MOODS[(MOODS.indexOf(n[i]) + 1) % MOODS.length];
                return n;
              })
            }
          >
            <Mascot tone={v.tone} mood={moods[i]} />
          </button>
        ))}
      </div>
    </div>
  );
}

const VERS = [
  { bg: "azul", fg: "#FFFFFF", n: "No azul" },
  { bg: "petroleo", fg: "#118AB2", n: "No petróleo" },
  { bg: "papel", fg: "#073B4C", n: "No papel" },
];

export function Marca() {
  const m = tudo.marca;
  return (
    <section className="t-sec t-paper t-marca">
      <div className="t-wrap">
        <InView>
          <p className="t-kicker t-up">A marca</p>
          <h2 className="t-h t-up" style={stag(1)}>{m.title}</h2>
        </InView>
        <InView className="t-story-wrap" threshold={0.2}>
          <div className="t-up" style={stag(2)}>
            <Story />
          </div>
        </InView>

        <InView className="t-selos-wrap" threshold={0.25}>
          <h3 className="t-h t-h-sm t-up">{m.selos.title}</h3>
          <div className="t-up" style={stag(1)}>
            <Selos />
          </div>
        </InView>

        <InView className="t-vers-wrap" threshold={0.25}>
          <h3 className="t-h t-h-sm t-up">{m.versoes.title}</h3>
          <ul className="t-vers">
            {VERS.map((v, i) => (
              <li key={v.n} className={`t-up bg-${v.bg}`} style={stag(i + 1)}>
                <TudoWordmark style={{ color: v.fg }} aria-hidden />
                <span>{v.n}</span>
              </li>
            ))}
          </ul>
        </InView>

        <InView className="t-viz-wrap" threshold={0.25}>
          <Vizinhos />
        </InView>
      </div>
    </section>
  );
}
