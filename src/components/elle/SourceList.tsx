import type { AnalysisSource, ContentKind } from "@/lib/elle/types";

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function dateOf(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : fmt.format(d);
}

const KIND: Record<ContentKind, string> = {
  documento: "Documento oficial",
  dados: "Dados oficiais",
  plano: "Plano de governo",
  noticia: "Reportagem",
  opiniao: "Opinião",
  checagem: "Checagem",
  desconhecido: "Outra fonte",
};

function SourceInner({ s }: { s: AnalysisSource }) {
  const date = dateOf(s.published_at);
  return (
    <>
      <span className="elle-src__n" aria-hidden="true">
        {s.id}
      </span>
      <span className="elle-src__main">
        <span className="elle-src__name">{s.name}</span>
        <span className="elle-src__title">{s.title}</span>
        <span className="elle-src__meta">
          {KIND[s.kind]}
          {date ? `, ${date}` : ""}
          {s.locator ? `, ${s.locator}` : ""}
        </span>
      </span>
    </>
  );
}

/** Nome do veículo, título resumido e data. Cada fonte é um link; nunca uma URL gigante na tela. */
export default function SourceList({ sources }: { sources: AnalysisSource[] }) {
  if (!sources.length) return null;
  return (
    <ol className="elle-sources">
      {sources.map((s) => (
        <li key={s.id} id={`elle-src-${s.id}`} className="elle-src" data-tier={s.tier}>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              <SourceInner s={s} />
              <svg className="elle-src__out" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M5 3h6v6M11 3L3.5 10.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="elle-sr"> (abre em nova aba)</span>
            </a>
          ) : (
            <div className="elle-src__static">
              <SourceInner s={s} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
