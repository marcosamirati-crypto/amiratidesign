"use client";

import { useState } from "react";
import { sante } from "@/content/brands/sante";
import InView from "./InView";
import Tabs from "./Tabs";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

type Passo = {
  nome: string;
  alt?: string;
  desc: string;
  falas: { quem: string; t: string }[];
  dica?: string;
  faz?: string;
  naoFaz?: string;
};
type Mode = "presencial" | "digital";

/** Separa a frase do comentário entre parênteses no final: "Frase. (comentário.)" */
function splitNote(s: string) {
  const m = s.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  return m ? { main: m[1], note: m[2] } : { main: s, note: "" };
}

function Do({ ok, text }: { ok: boolean; text: string }) {
  const { main, note } = splitNote(text);
  return (
    <div className={`jdo ${ok ? "is-ok" : "is-no"}`}>
      <span className="jdo-tag s-h">{ok ? "Faz" : "Não faz"}</span>
      <p className="jdo-main">{main}</p>
      {note && <p className="jdo-note">{note}</p>}
    </div>
  );
}

export function Journey() {
  const j = sante.jornada;
  const [mode, setMode] = useState<Mode>("presencial");
  const [i, setI] = useState(0);
  const data: { sub: string; passos: Passo[] } = j[mode];
  const step = data.passos[i];
  const total = data.passos.length;

  const go = (n: number) => setI(Math.min(total - 1, Math.max(0, n)));

  return (
    <section className="s-sec is-orange s-jour">
      <div className="s-wrap">
        <InView>
          <p className="s-small s-up">Identidade verbal</p>
          <h3 className="s-h s-mega s-xl s-up" style={stag(1)}>{j.title}</h3>
        </InView>
        <InView threshold={0.1}>
          <div className="s-up" style={stag(2)}>
            <Tabs<Mode>
              label="Tipo de atendimento"
              value={mode}
              onChange={(m) => {
                setMode(m);
                setI(0);
              }}
              items={[
                { id: "presencial", label: j.presencial.tab },
                { id: "digital", label: j.digital.tab },
              ]}
            />
            <p className="s-p jour-sub">{data.sub}</p>
          </div>
        </InView>

        <div className="jour-grid">
          <ol className="road" aria-label="Etapas do atendimento">
            {data.passos.map((p, k) => (
              <li key={p.nome} className={k === i ? "is-on" : k < i ? "is-past" : ""}>
                <button type="button" onClick={() => go(k)} aria-current={k === i ? "step" : undefined}>
                  <i className="road-n s-h">{k + 1}</i>
                  <span className="road-name s-h">{p.nome}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="jpanel" key={`${mode}-${i}`}>
            <div className="jp-head">
              <span className="jp-count s-small">
                Etapa {i + 1} de {total}
              </span>
              <h4 className="jp-name s-h">{step.nome}</h4>
              {step.alt && <span className="jp-alt s-small">{step.alt}</span>}
            </div>
            {step.desc && <p className="jp-desc">{step.desc}</p>}

            <ul className="talk">
              {step.falas.map((f, k) => (
                <li key={k} className={`talk-li ${f.quem === "Santé" ? "me" : "you"}`} style={{ "--k": k } as React.CSSProperties}>
                  <span className="talk-who s-small">{f.quem}</span>
                  <p className="bub">{f.t}</p>
                </li>
              ))}
            </ul>

            {step.dica && (
              <aside className="jp-tip" style={{ "--k": step.falas.length } as React.CSSProperties}>
                <i aria-hidden className="tip-star">✺</i>
                <p>{step.dica}</p>
              </aside>
            )}
            {(step.faz || step.naoFaz) && (
              <div className="jdos" style={{ "--k": step.falas.length + 1 } as React.CSSProperties}>
                {step.faz && <Do ok text={step.faz} />}
                {step.naoFaz && <Do ok={false} text={step.naoFaz} />}
              </div>
            )}

            <div className="jp-nav">
              <button type="button" className="s-btn" onClick={() => go(i - 1)} disabled={i === 0}>
                ← Anterior
              </button>
              <button type="button" className="s-btn s-btn-solid" onClick={() => go(i + 1)} disabled={i === total - 1}>
                Próxima →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
