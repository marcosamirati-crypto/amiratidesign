"use client";

import { useState } from "react";
import { tudo } from "@/content/brands/tudo-aqui";
import InView from "../InView";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;
const WEIGHTS = [
  { n: "Light", w: 300 },
  { n: "Regular", w: 400 },
  { n: "Medium", w: 500 },
  { n: "SemiBold", w: 600 },
  { n: "Bold", w: 700 },
];
const CHIPS = ["Comida", "Gás", "Água", "Manutenção"];

type F = typeof tudo.tipografia.principal;

function Notes({ f }: { f: F }) {
  return (
    <dl className="t-notes">
      <div>
        <dt className="t-kicker">Por que</dt>
        <dd>{f.porque}</dd>
      </div>
      <div>
        <dt className="t-kicker">Aplicação</dt>
        <dd>{f.aplicacao}</dd>
      </div>
      <div>
        <dt className="t-kicker">Dados técnicos</dt>
        <dd>{f.dados}</dd>
      </div>
    </dl>
  );
}

export function Tipografia() {
  const t = tudo.tipografia;
  const [txt, setTxt] = useState("tudo aqui");
  return (
    <section className="t-sec t-paper t-type">
      <div className="t-wrap">
        <InView>
          <p className="t-kicker t-up">Tipografia</p>
          <h2 className="t-h t-up" style={stag(1)}>{t.title}</h2>
        </InView>

        <div className="t-type-grid">
          <InView className="t-tc t-tc-brown" threshold={0.15}>
            <p className="t-kicker t-up">Principal</p>
            <h3 className="t-brown-name t-up" style={stag(1)}>{t.principal.nome}</h3>
            <p className="t-tc-sum t-up" style={stag(2)}>{t.principal.resumo}</p>
            <label className="t-tester t-up" style={stag(3)}>
              <span className="t-kicker">Escreva aqui</span>
              <input
                type="text"
                value={txt}
                maxLength={22}
                spellCheck={false}
                onChange={(e) => setTxt(e.target.value)}
                aria-label="Texto de teste na Brown Cookies"
              />
            </label>
            <div className="t-abc t-up" style={stag(4)} aria-hidden>
              {t.alfabeto.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <Notes f={t.principal} />
          </InView>

          <InView className="t-tc t-tc-pop" threshold={0.15}>
            <p className="t-kicker t-up">Apoio</p>
            <h3 className="t-pop-name t-up" style={stag(1)}>{t.apoio.nome}</h3>
            <p className="t-tc-sum t-up" style={stag(2)}>{t.apoio.resumo}</p>
            <ul className="t-weights t-up" style={stag(3)}>
              {WEIGHTS.map((w) => (
                <li key={w.n} style={{ fontWeight: w.w }}>
                  <span>Aa</span>
                  <span>{w.n}</span>
                </li>
              ))}
            </ul>
            <Notes f={t.apoio} />
          </InView>
        </div>

        <InView className="t-pair" threshold={0.25}>
          <p className="t-kicker t-up">As duas juntas, num pedaço do app</p>
          <div className="t-app t-up" style={stag(1)}>
            <p className="t-app-h">O que você precisa hoje?</p>
            <div className="t-app-search" aria-hidden>Buscar no bairro</div>
            <ul className="t-chips">
              {CHIPS.map((c, i) => (
                <li key={c} className={`ch-${i}`}>{c}</li>
              ))}
            </ul>
            <p className="t-app-p">Escolha, peça e acompanhe. Tudo no mesmo lugar, sem caçar contato em conversa.</p>
          </div>
        </InView>
      </div>
      <div className="t-brown-bg" aria-hidden>
        <span>{txt || "aqui"}</span>
      </div>
    </section>
  );
}
