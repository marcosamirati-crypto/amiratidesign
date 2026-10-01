import { sante, santeColors } from "@/content/brands/sante";
import InView from "./InView";
import { SanteWordmark } from "./SanteLogos";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

/** Tom de voz: 5 réguas. O marcador (um quadradinho do xadrez) desliza até o ponto onde a Santé fala. */
export function ToneSliders() {
  const v = sante.voz;
  return (
    <section className="s-sec is-cream">
      <div className="s-wrap">
        <InView>
          <p className="s-small s-up">Identidade verbal</p>
          <h3 className="s-h s-mid s-up" style={stag(1)}>{v.title}</h3>
          <p className="s-p s-up" style={stag(2)}>{v.sub}</p>
        </InView>
        <InView className="s-sliders" threshold={0.2}>
          {v.pontos.map((p, i) => (
            <div key={p.trait} className="s-slider" style={{ "--p": p.pos, "--d": `${i * 130}ms` } as React.CSSProperties}>
              <span className="sl-top s-h">{p.trait}</span>
              <div className="sl-track" aria-hidden>
                <i className="sl-marker" />
              </div>
              <span className="sl-bot s-h">{p.opposite}</span>
              <p className="sl-txt">
                <strong>{p.title}</strong> {p.text}
              </p>
            </div>
          ))}
        </InView>
        <p className="s-note">{v.note}</p>
      </div>
    </section>
  );
}

/** As camadas da marca: arquétipos, valores e voz em anéis concentricos que giram devagar. */
function ringPath(id: string, r: number) {
  return <path id={id} d={`M${450 - r} 450a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0`} fill="none" />;
}
const circ = (r: number) => Math.round(2 * Math.PI * r - 8);

export function Layers() {
  const arq = "BOBO DA CORTE  ✺  CARA COMUM  ✺  ";
  const val = sante.valores.map((x) => x.title.toUpperCase()).join("  ✺  ") + "  ✺  ";
  const voz = sante.voz.pontos.map((x) => x.title.replace(/\.$/, "").toUpperCase()).join("  ✺  ") + "  ✺  ";
  return (
    <section className="s-sec is-blue">
      <div className="s-wrap s-layers">
        <InView className="s-layers-fig">
          <svg viewBox="0 0 900 900" className="s-orbits" role="img" aria-label="Camadas da marca: no centro a Santé; depois os arquétipos, os valores e o tom de voz">
            <defs>
              {ringPath("o1", 140)}
              {ringPath("o2", 252)}
              {ringPath("o3", 352)}
            </defs>
            <g className="orb orb-3">
              <circle cx="450" cy="450" r="430" className="orb-band band-3" />
              <circle cx="450" cy="450" r="410" className="orb-line" />
              <text className="orb-text t3">
                <textPath href="#o3" textLength={circ(352)} lengthAdjust="spacing">{voz}</textPath>
              </text>
            </g>
            <g className="orb orb-2">
              <circle cx="450" cy="450" r="324" className="orb-band band-2" />
              <text className="orb-text t2">
                <textPath href="#o2" textLength={circ(252)} lengthAdjust="spacing">{val}</textPath>
              </text>
            </g>
            <g className="orb orb-1">
              <circle cx="450" cy="450" r="214" className="orb-band band-1" />
              <text className="orb-text t1">
                <textPath href="#o1" textLength={circ(140)} lengthAdjust="spacing">{arq}</textPath>
              </text>
            </g>
            <circle cx="450" cy="450" r="112" fill={santeColors.cream} className="orb-core" />
            <SanteWordmark x={450 - 74} y={450 - 30} width={148} height={59} style={{ color: santeColors.teal }} className="orb-mark" />
          </svg>
        </InView>
        <InView className="s-layers-txt">
          <p className="s-small s-up">Camadas da marca</p>
          <h3 className="s-h s-mid s-up" style={stag(1)}>
            Do centro
            <br />
            para fora
          </h3>
          <ol className="s-lay-list">
            <li className="s-up" style={stag(2)}><b>Arquétipos</b> O Bobo da Corte e O Cara Comum, o jeito de ser.</li>
            <li className="s-up" style={stag(3)}><b>Valores</b> Crosta antes de discurso, nostalgia sem naftalina e atendimento como tempero.</li>
            <li className="s-up" style={stag(4)}><b>Tom de voz</b> Confiante, curta, engraçada com intenção, inclusiva e quente.</li>
          </ol>
        </InView>
      </div>
    </section>
  );
}

/** Mantras: uma frase-lema em movimento e dois letreiros de estrada. */
export function Mantras() {
  const g = sante.genial;
  const row = `${g.quote}  ✺  `;
  return (
    <section className="s-sec is-orange s-mantras">
      <div className="s-wrap">
        <p className="s-small">{g.label}</p>
      </div>
      <div className="s-marquee" aria-label={g.quote}>
        <div className="mq mq-a" aria-hidden>
          {[0, 1].map((k) => (
            <span key={k} className="s-h">{row.repeat(2)}</span>
          ))}
        </div>
        <div className="mq mq-b" aria-hidden>
          {[0, 1].map((k) => (
            <span key={k} className="s-h">{row.repeat(2)}</span>
          ))}
        </div>
      </div>
      <div className="s-wrap">
        <InView className="s-signs" threshold={0.2}>
          {g.mantras.map((m, i) => (
            <figure key={m.line[0]} className="s-sign s-up" style={stag(i)}>
              <div className="s-sign-board">
                <i className="rv rv-a" />
                <i className="rv rv-b" />
                <i className="rv rv-c" />
                <i className="rv rv-d" />
                <p className="s-h">
                  {m.line[0]}
                  <br />
                  {m.line[1]}
                </p>
              </div>
              <figcaption className="s-p">{m.note}</figcaption>
            </figure>
          ))}
        </InView>
      </div>
    </section>
  );
}
