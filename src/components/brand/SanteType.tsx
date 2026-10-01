"use client";

import { useState } from "react";
import { sante } from "@/content/brands/sante";
import InView from "./InView";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const WIDTHS = [50, 75, 100, 125, 150];

/** Frase-lema: cada letra respira (largura e peso) quando a seção entra e quando o mouse passa. */
function Crackle({ text, hot }: { text: string; hot: string }) {
  let n = 0;
  return (
    <p className="s-crackle s-h" aria-label={text}>
      {text.split(" ").map((w, wi) => (
        <span key={wi} aria-hidden>
          <span className={`ck-word${w.toLowerCase().replace(/[^a-z]/g, "") === hot ? " is-hot" : ""}`}>
            {Array.from(w).map((ch, ci) => (
              <span key={ci} className="ck" style={{ "--k": n++ } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>{" "}
        </span>
      ))}
    </p>
  );
}

export function SanteType() {
  const t = sante.tipografia;
  const [wd, setWd] = useState(62);
  const [wg, setWg] = useState(900);
  const [manual, setManual] = useState(false);
  const [word, setWord] = useState("Crosta");

  const style = manual ? ({ "--wd": wd, "--wg": wg } as React.CSSProperties) : undefined;

  return (
    <section className="s-sec is-teal s-type">
      <div className="s-wrap">
        <InView>
          <p className="s-small s-up">Tipografia</p>
          <h3 className="s-h s-mega s-xl s-up" style={stag(1)}>{t.title}</h3>
          <div className="s-type-prob">
            {t.problema.map((p, i) => (
              <p key={i} className="s-p s-up" style={stag(i + 2)}>{p}</p>
            ))}
          </div>
        </InView>

        <InView className="s-play" threshold={0.25}>
          <div className={`s-play-stage s-up${manual ? " is-manual" : ""}`} style={style}>
            <div className="s-play-word" aria-label={word}>{word || "Anybody"}</div>
          </div>
          <div className="s-play-ctl s-up" style={stag(2)}>
            <label className="s-ctl">
              <span className="s-small">Largura <b>{manual ? wd : "auto"}</b></span>
              <input
                type="range"
                min={50}
                max={150}
                value={wd}
                aria-label="Largura da letra"
                onChange={(e) => {
                  setWd(+e.target.value);
                  setManual(true);
                }}
              />
            </label>
            <label className="s-ctl">
              <span className="s-small">Peso <b>{manual ? wg : "auto"}</b></span>
              <input
                type="range"
                min={100}
                max={900}
                value={wg}
                aria-label="Peso da letra"
                onChange={(e) => {
                  setWg(+e.target.value);
                  setManual(true);
                }}
              />
            </label>
            <label className="s-ctl s-ctl-word">
              <span className="s-small">Escreva</span>
              <input type="text" value={word} maxLength={12} onChange={(e) => setWord(e.target.value)} aria-label="Palavra de teste" spellCheck={false} />
            </label>
            <button type="button" className="s-btn" onClick={() => setManual(false)} disabled={!manual}>
              Voltar ao automático
            </button>
          </div>
        </InView>

        <div className="s-fams">
          <InView className="s-fam fam-a" threshold={0.3}>
            <p className="s-small s-up">{t.familias[0].name}</p>
            <p className="fam-sample s-up" style={stag(1)}>Hambúrguer smash artesanal, do jeito que o vovô fazia.</p>
            <p className="s-p s-up" style={stag(2)}>{t.familias[0].note}</p>
          </InView>
          <InView className="s-fam fam-b" threshold={0.3}>
            <p className="s-small s-up">{t.familias[1].name}</p>
            <p className="fam-sample s-h s-up" style={stag(1)}>The Original</p>
            <p className="s-p s-up" style={stag(2)}>{t.familias[1].note}</p>
          </InView>
        </div>

        <InView className="s-ladders" threshold={0.2}>
          <div className="s-ladder-w s-up">
            <p className="s-small">Do fininho ao parrudo</p>
            <ol className="lad-weights">
              {WEIGHTS.map((w) => (
                <li key={w} style={{ "--w": w } as React.CSSProperties}>
                  <span className="lad-aa">Aa</span>
                  <span className="s-small">{w}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="s-ladder-s s-up" style={stag(2)}>
            <p className="s-small">Do apertadinho ao esticado</p>
            <ol className="lad-widths">
              {WIDTHS.map((w) => (
                <li key={w} style={{ "--s": w } as React.CSSProperties}>
                  <span className="lad-word">Burger</span>
                  <span className="s-small">{w}</span>
                </li>
              ))}
            </ol>
          </div>
        </InView>

        <InView className="s-ck-wrap" threshold={0.4}>
          <Crackle text={t.frase.join(" ")} hot="crust" />
        </InView>
      </div>
    </section>
  );
}
