import type { Project } from "@/lib/types";
import { tudo } from "@/content/brands/tudo-aqui";
import InView from "../InView";
import { TudoWordmark } from "./TudoLogos";
import { Mascot } from "./TudoMascots";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

const TYPE_LABEL: Record<string, string> = {
  "identidade-visual": "Identidade visual",
  branding: "Branding",
  "social-media": "Social media",
  fotografia: "Fotografia",
};

/** Faixa logo abaixo da abertura: resumo do projeto e ficha. */
export function Ficha({ project }: { project: Project }) {
  return (
    <section className="t-sec t-azul t-ficha-sec">
      <div className="t-wrap t-ficha-grid">
        <InView className="t-ficha-txt">
          <p className="t-kicker t-up">O projeto</p>
          <p className="t-ficha-sum t-up" style={stag(1)}>
            {project.summary || "Identidade visual de uma plataforma de serviços e entregas para o bairro."}
          </p>
        </InView>
        <InView className="t-ficha-meta">
          <dl>
            {[
              ["Cliente", "Tudo Aqui"],
              ["Ano", String(project.year ?? tudo.year)],
              ["Entrega", TYPE_LABEL[project.type] ?? "Identidade visual"],
              ["Feito com", tudo.autores[1].nome],
            ].map(([k, v], i) => (
              <div key={k} className="t-up" style={stag(i + 2)}>
                <dt className="t-kicker">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </InView>
      </div>
    </section>
  );
}

/** As frases da marca viradas em cartazes. */
export function Frases() {
  const u = tudo.usos;
  return (
    <section className="t-sec t-paper t-frases">
      <div className="t-wrap">
        <InView>
          <p className="t-kicker t-up">Em uso</p>
          <h2 className="t-h t-up" style={stag(1)}>{u.title}</h2>
        </InView>
        <InView className="t-posters" threshold={0.15}>
          <article className="t-poster p-fome t-up" style={stag(1)}>
            <p className="po-a">{u.frases[0].linhas[0]}</p>
            <p className="po-b">tem</p>
            <TudoWordmark className="po-mark" aria-hidden />
            <span className="po-bang" aria-hidden>!</span>
            <span className="po-mas" aria-hidden>
              <Mascot tone="melancia" mood="grin" />
            </span>
          </article>
          <article className="t-poster p-sofa t-up" style={stag(2)}>
            <p>
              {u.frases[1].linhas[0]}
              <br />
              <b>{u.frases[1].linhas[1]}</b>
            </p>
            <span className="po-mas" aria-hidden>
              <Mascot tone="sol" mood="smile" />
            </span>
          </article>
          <article className="t-poster p-palma t-up" style={stag(3)}>
            <p>
              {u.frases[2].linhas[0]}
              <br />
              <b>{u.frases[2].linhas[1]}</b>
            </p>
            <span className="po-mas" aria-hidden>
              <Mascot tone="menta" mood="tongue" />
            </span>
          </article>
        </InView>
      </div>
    </section>
  );
}

/** As peças da identidade em uso (imagens do admin). Troque no admin quando quiser. */
export function Pecas({ title, images }: { title: string; images: string[] }) {
  if (images.length === 0) return null;
  return (
    <section className="t-sec t-dark t-pecas">
      <div className="t-wrap">
        <InView>
          <p className="t-kicker t-up">Peças</p>
          <h2 className="t-h t-up" style={stag(1)}>A identidade em uso</h2>
        </InView>
        <div className="t-gal">
          {images.map((src, i) => (
            <InView key={src + i} className="t-gal-fig" threshold={0.12}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${title}, peça ${i + 1}`} loading={i < 2 ? "eager" : "lazy"} />
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Faixa final: uma fileira de bolsos coloridos. */
export function BolsosBand() {
  const cores = ["#118AB2", "#06D6A0", "#FFD166", "#EF476F", "#073B4C"];
  return (
    <div className="t-band" aria-hidden>
      <div className="t-band-track">
        {Array.from({ length: 2 }, (_, k) =>
          Array.from({ length: 14 }, (_, j) => (
            <svg key={`${k}-${j}`} viewBox="0 0 100 100" style={{ "--c": cores[j % cores.length], "--r": `${((j * 7) % 5) - 2}deg` } as React.CSSProperties}>
              <path d="M14 4H86Q96 4 96 14V58Q96 64 91 67L55 95Q50 98 45 95L9 67Q4 64 4 58V14Q4 4 14 4Z" />
            </svg>
          )),
        )}
      </div>
    </div>
  );
}
