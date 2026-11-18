import Image from "next/image";
import DemoForm from "@/components/mota/DemoForm";
import Earth from "@/components/mota/Earth";
import Header from "@/components/mota/Header";
import Logo from "@/components/mota/Logo";
import Motion from "@/components/mota/Motion";
import Starfield from "@/components/mota/Starfield";
import { ClimateChart, Cubesat, Field, Gauge, HowStage, ProblemArt, Reservoir } from "@/components/mota/Visuals";
import { mm } from "@/content/motaMacedo";

function Confirm({ text }: { text?: string }) {
  if (!mm.preview || !text) return null;
  return <span className="mm-confirm">Confirmar: {text}</span>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mm-label" data-reveal>
      {children}
    </p>
  );
}

/** Título em linhas; cada linha sobe com um pequeno atraso. */
function Lines({ lines, as: Tag = "h2", className }: { lines: string[] | string; as?: "h1" | "h2"; className?: string }) {
  const arr = Array.isArray(lines) ? lines : [lines];
  return (
    <Tag className={`mm-lines ${className ?? ""}`} data-reveal>
      {arr.map((l, i) => (
        <span key={l} className="mm-line" style={{ "--d": i } as React.CSSProperties}>
          <span>{l}</span>
        </span>
      ))}
    </Tag>
  );
}

const n = (i: number) => String(i + 1).padStart(2, "0");

export default function MotaMacedoPage() {
  const { statement, hero, problem, measures, how, satellite, proof, audience, pricing, faq, final, footer } = mm;
  const words = statement.text.split(" ");
  const instruments = [Gauge, ClimateChart, Reservoir];

  return (
    <div className="mm">
      <Motion />
      <Header />
      {mm.preview && (
        <p className="mm-preview" role="note">
          Prévia · os pontos “Confirmar” dependem do cliente
        </p>
      )}

      <main id="topo">
        {/* 00 · Abertura: só o céu, a Terra e o logotipo */}
        <section className="mm-open" aria-label={`${mm.product}, ${mm.descriptor}`}>
          <Starfield className="mm-stars" />
          {mm.openingImage ? (
            <Image src={mm.openingImage} alt="" fill preload sizes="100vw" quality={85} className="mm-open-img" />
          ) : (
            <Earth />
          )}
          <h1 className="mm-open-logo">
            <Logo variant="mono" title={`${mm.product} · ${mm.brand}`} />
          </h1>
          <a href="#ideia" className="mm-cue" aria-label="Rolar para o conteúdo">
            <span />
          </a>
        </section>

        {/* 01 · Frase: palavra a palavra, conforme a rolagem */}
        <section id="ideia" className="mm-statement" data-scene style={{ "--n": words.length } as React.CSSProperties}>
          <div className="mm-sticky">
            <Starfield className="mm-stars mm-stars--dim" seed={4} density={0.5} />
            <p className="mm-statement-text">
              {words.map((w, i) => (
                <span key={i} className={w.replace(/[.,]/g, "") === statement.accent ? "is-accent" : undefined} style={{ "--i": i } as React.CSSProperties}>
                  {w}{" "}
                </span>
              ))}
            </p>
          </div>
        </section>

        {/* 02 · Apresentação: do espaço para a superfície */}
        <section className="mm-intro">
          <div className="mm-wrap">
            <Label>{hero.eyebrow}</Label>
            <Lines lines={hero.title} as="h2" className="mm-display" />
            <p className="mm-lead" data-reveal>
              {hero.line}
            </p>
            <p data-reveal>
              <a href="#demo" className="mm-link">
                {hero.cta}
              </a>
            </p>
          </div>
          <figure className="mm-window" data-view>
            <div className="mm-window-in">
              <Field />
            </div>
            <figcaption>{hero.caption}</figcaption>
          </figure>
        </section>

        {/* 03 · Problema */}
        <section className="mm-sec mm-problem">
          <div className="mm-wrap">
            <Label>{problem.label}</Label>
            <Lines lines={problem.title} className="mm-h2" />
            <ol className="mm-probs">
              {problem.items.map((it, i) => (
                <li key={it.title} className="mm-prob" data-reveal>
                  <span className="mm-idx">{n(i)}</span>
                  <h3>{it.title}</h3>
                  <p>{it.text}</p>
                  <ProblemArt i={i} />
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 04 · Três medidas */}
        <section id="tecnologia" className="mm-sec mm-measures">
          <div className="mm-wrap">
            <div className="mm-center">
              <Label>{measures.label}</Label>
              <Lines lines={measures.title} className="mm-display" />
            </div>
            <div className="mm-features">
              {measures.items.map((it, i) => {
                const Inst = instruments[i];
                return (
                  <article key={it.metric} className="mm-feature" data-reveal>
                    <div className="mm-feature-copy">
                      <span className="mm-idx">{n(i)}</span>
                      <h3>{it.metric}</h3>
                      <p className="mm-decision">{it.decision}</p>
                      <p>{it.text}</p>
                    </div>
                    <div className="mm-panel">
                      <Inst />
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="mm-fine">{measures.note}</p>
            <Confirm text={measures.confirm} />
          </div>
        </section>

        {/* 05 · Como funciona */}
        <section id="como-funciona" className="mm-sec mm-how">
          <div className="mm-wrap">
            <Label>{how.label}</Label>
            <Lines lines={how.title} className="mm-h2" />
            <div className="mm-how-grid">
              <ol className="mm-steps">
                {how.steps.map((s, i) => (
                  <li key={s.title} className={`mm-step${i === 0 ? " is-active" : ""}`} data-step={i}>
                    <span className="mm-idx">{n(i)}</span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                    <Confirm text={"confirm" in s ? s.confirm : undefined} />
                  </li>
                ))}
              </ol>
              <div className="mm-stage" data-stage data-active="0">
                <HowStage />
              </div>
            </div>
          </div>
        </section>

        {/* 06 · O nanossatélite */}
        <section className="mm-sat" aria-label={satellite.name}>
          <div className="mm-wrap mm-center">
            <Label>{satellite.label}</Label>
            <Lines lines={satellite.name} className="mm-display" />
            <p className="mm-lead mm-lead--center" data-reveal>
              {satellite.line}
            </p>
          </div>
          {satellite.photos.length > 0 ? (
            <div className="mm-sat-photos">
              {satellite.photos.map((p) => (
                <figure key={p.src} data-reveal>
                  <Image src={p.src} alt={p.alt} width={p.width} height={p.height} sizes="(min-width: 900px) 50vw, 100vw" />
                </figure>
              ))}
            </div>
          ) : (
            <figure className="mm-sat-stage" data-reveal>
              <Cubesat />
              <figcaption>{satellite.schematic}</figcaption>
            </figure>
          )}
          <div className="mm-wrap mm-center">
            <p className="mm-sat-text" data-reveal>
              {satellite.text}
            </p>
            <Confirm text={satellite.confirm} />
          </div>
        </section>

        {/* 07 · Credibilidade */}
        <section id="sobre" className="mm-sec mm-proof">
          <div className="mm-wrap">
            <Label>{proof.label}</Label>
            <Lines lines={proof.title} className="mm-h2" />
            <dl className="mm-facts">
              {proof.items.map((it) => (
                <div key={it.title} className="mm-fact" data-reveal>
                  <dt>{it.title}</dt>
                  <dd>
                    {it.text}
                    <Confirm text={"confirm" in it ? it.confirm : undefined} />
                  </dd>
                </div>
              ))}
            </dl>
            <figure className="mm-quote" data-reveal>
              <blockquote>“{proof.founder.quote}”</blockquote>
              <figcaption>
                {proof.founder.name}, {proof.founder.role.toLowerCase()}
              </figcaption>
              <Confirm text={proof.founder.confirm} />
            </figure>
          </div>
        </section>

        {/* 08 · Para quem */}
        <section className="mm-sec mm-audience">
          <div className="mm-wrap">
            <Label>{audience.label}</Label>
            <Lines lines={audience.title} className="mm-h2" />
            <ul className="mm-aud">
              {audience.items.map((it, i) => (
                <li key={it.title} data-reveal style={{ "--d": i } as React.CSSProperties}>
                  <h3>{it.title}</h3>
                  <p>{it.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 09 · Investimento */}
        <section className="mm-sec mm-pricing">
          <div className="mm-wrap">
            <Label>{pricing.label}</Label>
            <Lines lines={pricing.title} className="mm-h2" />
            <div className="mm-prices">
              {[pricing.setup, pricing.monthly].map((p) => (
                <article key={p.name} className="mm-price" data-reveal>
                  <h3>{p.name}</h3>
                  <p className="mm-amount">{mm.showPrice ? p.price : "Sob consulta"}</p>
                  {mm.showPrice && <p className="mm-per">{p.note}</p>}
                  <p>{p.text}</p>
                </article>
              ))}
            </div>
            <Confirm text={pricing.confirm} />
          </div>
        </section>

        {/* 10 · Perguntas */}
        <section className="mm-sec mm-faqsec">
          <div className="mm-wrap mm-faq-grid">
            <div>
              <Label>{faq.label}</Label>
              <Lines lines={faq.title} className="mm-h2" />
            </div>
            <div className="mm-faq">
              {faq.items.map((it) => (
                <details key={it.q}>
                  <summary>{it.q}</summary>
                  <div className="mm-a">
                    <p>{it.a}</p>
                    <Confirm text={"confirm" in it ? it.confirm : undefined} />
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 11 · Demonstração */}
        <section id="demo" className="mm-demo">
          <Starfield className="mm-stars mm-stars--dim" seed={31} density={0.6} />
          <div className="mm-wrap mm-demo-grid">
            <div>
              <Label>{final.label}</Label>
              <Lines lines={final.title} className="mm-display mm-display--sm" />
              <p className="mm-lead" data-reveal>
                {final.line}
              </p>
            </div>
            <DemoForm />
          </div>
        </section>
      </main>

      <footer className="mm-foot">
        <div className="mm-wrap mm-foot-grid">
          <Logo variant="neg" className="mm-foot-logo" />
          <div>
            <p>{footer.group}</p>
            <p>{footer.legal}</p>
          </div>
          <div>
            <p>
              <a href={`mailto:${mm.email}`}>{mm.email}</a>
            </p>
            <p>{footer.privacy}</p>
          </div>
          <p className="mm-credit">{footer.credit}</p>
        </div>
      </footer>
    </div>
  );
}
