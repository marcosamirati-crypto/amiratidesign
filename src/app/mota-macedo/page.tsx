import DemoForm from "@/components/mota/DemoForm";
import HeroArt from "@/components/mota/HeroArt";
import { mm } from "@/content/motaMacedo";

function Confirm({ text }: { text?: string }) {
  if (!mm.preview || !text) return null;
  return <span className="mm-confirm">Confirmar: {text}</span>;
}

function Head({ label, title }: { label: string; title: string }) {
  return (
    <h2 aria-label={`${label}: ${title}`}>{title}</h2>
  );
}

const n = (i: number) => String(i + 1).padStart(2, "0");

export default function MotaMacedoPage() {
  const { hero, problem, measures, how, audience, proof, pricing, faq, final, footer } = mm;
  return (
    <div className="mm">
      {mm.preview && (
        <p className="mm-preview" role="note">
          Prévia para aprovação. Os pontos marcados com “Confirmar” dependem do cliente.
        </p>
      )}

      <header className="mm-wrap mm-nav">
        <a href="#topo" className="mm-logo" aria-label={mm.brand}>
          Mota <span>Macedo</span>
        </a>
        <a href="#demo" className="mm-btn mm-btn--sm">
          {hero.cta}
        </a>
      </header>

      <main id="topo">
        <section className="mm-hero">
          <div className="mm-wrap mm-hero-grid">
            <div className="mm-hero-in">
              <p className="mm-eyebrow">{hero.eyebrow}</p>
              <h1>{hero.title}</h1>
              <p className="mm-lead">{hero.line}</p>
              <div className="mm-cta-row">
                <a href="#demo" className="mm-btn mm-btn--gold">
                  {hero.cta}
                </a>
                <a href="#como-funciona" className="mm-btn">
                  {hero.secondary}
                </a>
              </div>
            </div>
          </div>
          <HeroArt />
        </section>

        <section className="mm-sec mm-sec--first">
          <div className="mm-wrap">
            <Head {...problem} />
            <div className="mm-grid mm-grid--3">
              {problem.items.map((it) => (
                <article key={it.title} className="mm-card">
                  <h3>{it.title}</h3>
                  <p>{it.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mm-sec">
          <div className="mm-wrap">
            <Head {...measures} />
            <div className="mm-grid mm-grid--3">
              {measures.items.map((it) => (
                <article key={it.metric} className="mm-card">
                  <h3 className="mm-metric">{it.metric}</h3>
                  <span className="mm-decision">{it.decision}</span>
                  <p>{it.text}</p>
                </article>
              ))}
            </div>
            <Confirm text={measures.confirm} />
          </div>
        </section>

        <section className="mm-sec" id="como-funciona">
          <div className="mm-wrap">
            <Head {...how} />
            <ol className="mm-grid mm-grid--3" style={{ listStyle: "none", padding: 0, marginBottom: 0 }}>
              {how.steps.map((s, i) => (
                <li key={s.title} className="mm-card">
                  <span className="mm-num">{n(i)}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <Confirm text={"confirm" in s ? s.confirm : undefined} />
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mm-sec">
          <div className="mm-wrap">
            <Head {...audience} />
            <div className="mm-grid mm-grid--3">
              {audience.items.map((it) => (
                <article key={it.title} className="mm-card">
                  <h3>{it.title}</h3>
                  <p>{it.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mm-sec">
          <div className="mm-wrap">
            <Head {...proof} />
            <div className="mm-grid mm-grid--4">
              {proof.items.map((it) => (
                <article key={it.title} className="mm-card">
                  <h3>{it.title}</h3>
                  <p>{it.text}</p>
                  <Confirm text={"confirm" in it ? it.confirm : undefined} />
                </article>
              ))}
            </div>
            <figure className="mm-founder" style={{ marginInline: 0, marginBottom: 0 }}>
              <div className="mm-photo" aria-hidden="true">
                foto
              </div>
              <div>
                <blockquote className="mm-quote" style={{ margin: 0 }}>
                  “{proof.founder.quote}”
                </blockquote>
                <figcaption className="mm-who">
                  {proof.founder.name} · {proof.founder.role}
                </figcaption>
                <Confirm text={proof.founder.confirm} />
              </div>
            </figure>
          </div>
        </section>

        <section className="mm-sec">
          <div className="mm-wrap">
            <Head {...pricing} />
            <div className="mm-grid mm-grid--2">
              {[pricing.setup, pricing.monthly].map((p) => (
                <article key={p.name} className="mm-card">
                  <h3>{p.name}</h3>
                  <p className="mm-price">
                    {mm.showPrice ? p.price : "Sob consulta"}
                    {mm.showPrice && <small>{p.note}</small>}
                  </p>
                  <p>{p.text}</p>
                </article>
              ))}
            </div>
            <Confirm text={pricing.confirm} />
          </div>
        </section>

        <section className="mm-sec">
          <div className="mm-wrap">
            <Head {...faq} />
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

        <section className="mm-sec" id="demo">
          <div className="mm-wrap mm-final">
            <div>
              <Head {...final} />
              <p className="mm-lead">{final.line}</p>
            </div>
            <DemoForm />
          </div>
        </section>
      </main>

      <footer className="mm-wrap mm-foot">
        <p>{footer.legal}</p>
        <p>
          <a href={`mailto:${mm.email}`}>{mm.email}</a>
        </p>
        <p>{footer.privacy}</p>
        <p>{footer.credit}</p>
      </footer>
    </div>
  );
}
