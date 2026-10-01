import type { Project } from "@/lib/types";
import InView from "./InView";

const stag = (i: number) => ({ "--d": `${i * 110}ms` }) as React.CSSProperties;

const TYPE_LABEL: Record<string, string> = {
  "identidade-visual": "Identidade visual",
  branding: "Branding",
  "social-media": "Social media",
  fotografia: "Fotografia",
};

/** Faixa de informações do projeto (resumo, cliente, ano, tipo). */
export function InfoStrip({ project }: { project: Project }) {
  return (
    <section className="s-sec is-teal s-info">
      <div className="s-wrap s-info-grid">
        <InView className="s-info-txt">
          <p className="s-small s-up">O projeto</p>
          <p className="s-info-sum s-h s-up" style={stag(1)}>
            {project.summary || "Identidade visual para uma hamburgueria com alma de diner."}
          </p>
        </InView>
        <InView className="s-info-meta">
          <dl>
            {[
              ["Cliente", "Santé Burger"],
              ["Ano", String(project.year ?? "")],
              ["Entrega", TYPE_LABEL[project.type] ?? "Identidade visual"],
              ["Por", "Amirati"],
            ]
              .filter(([, v]) => v)
              .map(([k, v], i) => (
                <div key={k} className="s-up" style={stag(i + 2)}>
                  <dt className="s-small">{k}</dt>
                  <dd className="s-h">{v}</dd>
                </div>
              ))}
          </dl>
        </InView>
      </div>
    </section>
  );
}

/** As pranchetas da identidade (vindas do admin), reveladas uma a uma. */
export function Gallery({ title, images }: { title: string; images: string[] }) {
  if (images.length === 0) return null;
  return (
    <section className="s-sec is-orange s-gal">
      <div className="s-wrap">
        <InView>
          <p className="s-small s-up">Pranchetas</p>
          <h3 className="s-h s-mega s-xl s-up" style={stag(1)}>
            A identidade
            <br />
            em uso
          </h3>
        </InView>
        <div className="gal">
          {images.map((src, i) => (
            <InView key={src + i} className="gal-fig" threshold={0.12}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${title} — prancheta ${i + 1}`} loading={i < 2 ? "eager" : "lazy"} />
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}
