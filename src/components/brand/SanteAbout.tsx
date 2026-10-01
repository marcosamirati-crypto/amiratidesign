import { sante, santeColors } from "@/content/brands/sante";
import InView from "./InView";
import { SanteWordmark } from "./SanteLogos";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

/** Faixa de xadrez, o tecido visual da marca (ligeiramente torta, nunca engessada). */
export function CheckerBand({ tone = "orange" }: { tone?: "orange" | "teal" }) {
  return <div aria-hidden className={`s-band s-checker band-${tone}`} />;
}

export function Triade() {
  return (
    <section className="s-sec is-cream" id="sobre-a-sante">
      <div className="s-wrap">
        <InView className="s-intro">
          <p className="s-small s-up">Apresentação de marca</p>
          <h2 className="s-h s-mega s-up" style={stag(1)}>
            Sobre
            <br />a Santé
          </h2>
        </InView>
        <InView className="s-triade" threshold={0.15}>
          {sante.triade.map((t, i) => (
            <article key={t.q} className="s-card s-up" style={stag(i)}>
              <div aria-hidden className="s-card-strip s-checker" />
              <h3 className="s-h s-q">
                {t.q} <small>faz?</small>
              </h3>
              <p className="s-p">{t.text}</p>
            </article>
          ))}
        </InView>
      </div>
    </section>
  );
}

function Wave() {
  return (
    <svg aria-hidden viewBox="0 0 400 16" className="s-wave" preserveAspectRatio="none">
      <path d="M2 8 Q22 0 42 8 T82 8 T122 8 T162 8 T202 8 T242 8 T282 8 T322 8 T362 8 T398 8" pathLength={1} />
    </svg>
  );
}

export function MissionVision() {
  const { missao, visao } = sante;
  return (
    <section className="s-mv">
      <InView className="s-mv-a is-orange">
        <p className="s-small s-up">{missao.label}</p>
        <h3 className="s-h s-big s-wipe" style={stag(1)}>
          Fritar a<br />
          mesmice.
        </h3>
        <Wave />
        <p className="s-p s-up" style={stag(3)}>{missao.text}</p>
      </InView>
      <InView className="s-mv-b is-teal">
        <p className="s-small s-up">{visao.label}</p>
        <h3 className="s-h s-big s-wipe" style={stag(1)}>
          Virar o point,
          <br />
          não só o pedido.
        </h3>
        <p className="s-p s-up" style={stag(3)}>{visao.text}</p>
      </InView>
    </section>
  );
}

export function Values() {
  return (
    <section className="s-sec is-cream">
      <div className="s-wrap">
        <InView>
          <p className="s-small s-up">Valores</p>
          <h3 className="s-h s-mid s-up" style={stag(1)}>São 3 principais:</h3>
          <ul className="s-vals">
            {sante.valores.map((v, i) => (
              <li key={v.title} className="s-val s-up" style={stag(i + 2)}>
                <i aria-hidden className="s-sq" />
                <h4 className="s-h">{v.title}</h4>
                <p className="s-p">{v.text}</p>
              </li>
            ))}
          </ul>
        </InView>
      </div>
    </section>
  );
}

// ───────── Roda dos 12 arquétipos ─────────
const C = 400;
const pt = (deg: number, r: number) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];
const wedge = (a1: number, a2: number, r: number) => {
  const [x1, y1] = pt(a1, r);
  const [x2, y2] = pt(a2, r);
  return `M${C} ${C} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
};

function Wheel() {
  const rings = [70, 125, 180, 235, 290];
  return (
    <svg viewBox="-140 -10 1080 820" className="s-wheel" role="img" aria-label="Roda dos 12 arquétipos de marca, com o Bobo da Corte e o Cara Comum em destaque">
      {rings.map((r, i) => (
        <circle key={r} cx={C} cy={C} r={r} className="w-ring" style={{ "--i": i } as React.CSSProperties} />
      ))}
      {sante.wheel.map((_, i) => {
        const a = -90 + i * 30 + 15;
        const [x, y] = pt(a, 295);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} className="w-spoke" />;
      })}
      {/* os dois territórios da Santé: se sobrepõem na fronteira */}
      <g className="w-lobes">
        <path d={wedge(98, 142, 262)} fill={santeColors.orange} className="w-lobe lobe-a" />
        <path d={wedge(128, 172, 262)} fill={santeColors.blue} className="w-lobe lobe-b" />
        <path d={wedge(128, 142, 262)} fill={santeColors.cream} className="w-lobe lobe-x" />
      </g>
      {sante.wheel.map((name, i) => {
        const a = -90 + i * 30;
        const [x, y] = pt(a, 338);
        const hot = name === "Bobo da Corte" || name === "Cara Comum";
        const cos = Math.cos((a * Math.PI) / 180);
        return (
          <text
            key={name}
            x={x}
            y={y}
            textAnchor={cos < -0.35 ? "end" : cos > 0.35 ? "start" : "middle"}
            dominantBaseline="middle"
            className={`w-label${hot ? " is-hot" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            {name}
          </text>
        );
      })}
      <circle cx={C} cy={C} r={60} fill={santeColors.cream} className="w-core" />
      <SanteWordmark x={C - 40} y={C - 16} width={80} height={32} style={{ color: santeColors.teal }} className="w-mark" />
    </svg>
  );
}

export function Archetype() {
  const a = sante.arquetipo;
  return (
    <section className="s-sec is-teal">
      <div className="s-wrap s-arch">
        <InView className="s-arch-fig">
          <Wheel />
        </InView>
        <InView className="s-arch-txt">
          <p className="s-small s-up">Arquétipo de marca</p>
          <h3 className="s-h s-mid s-up" style={stag(1)}>{a.title}</h3>
          <p className="s-p s-up" style={stag(2)}>{a.text}</p>
          <div className="s-why s-up" style={stag(3)}>
            <p className="s-small">Por que essa combinação funciona</p>
            {a.porque.map((t) => (
              <p key={t} className="s-p">{t}</p>
            ))}
          </div>
          <blockquote className="s-quote s-up" style={stag(4)}>{a.closing}</blockquote>
        </InView>
      </div>
    </section>
  );
}

export function Persona() {
  const p = sante.persona;
  return (
    <section className="s-sec is-cream">
      <div className="s-wrap s-persona">
        <InView className="s-persona-tag">
          <div className="s-tag" aria-hidden>
            <i className="s-tag-hole" />
            <div className="s-tag-top">Oi, eu sou a</div>
            <div className="s-tag-body">
              <SanteWordmark style={{ color: santeColors.teal, width: "78%", height: "auto" }} />
            </div>
            <div className="s-tag-foot s-checker" />
          </div>
        </InView>
        <InView className="s-persona-txt">
          <p className="s-small s-up">{p.label}</p>
          <h3 className="s-h s-mid s-up" style={stag(1)}>{p.title}</h3>
          {p.paragraphs.map((t, i) => (
            <p key={i} className="s-p s-up" style={stag(i + 2)}>{t}</p>
          ))}
          <ul className="s-traits">
            {p.traits.map((t, i) => (
              <li key={t} className="s-up" style={stag(i + 4)}>{t}</li>
            ))}
          </ul>
        </InView>
      </div>
    </section>
  );
}
