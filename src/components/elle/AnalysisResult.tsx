"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { categoryCopy, elleCopy, umbrellaArguments } from "@/content/elle/copy";
import type { OrbState } from "@/lib/elle/orb-engine";
import type { Analysis } from "@/lib/elle/types";
import CategoryBadge from "./CategoryBadge";
import CounterArgument from "./CounterArgument";
import ElleOrb from "./ElleOrb";
import EvidenceBlock from "./EvidenceBlock";
import FlavioFact from "./FlavioFact";
import SourceList from "./SourceList";
import SuggestedResponse from "./SuggestedResponse";
import UserOpinion from "./UserOpinion";

/**
 * Cada bloco "entra em foco" (desfoque → nítido) quando chega à tela, como o orbe.
 * Os primeiros entram em sequência; os demais, ao rolar. Se a aba estiver escondida, aparece tudo de uma vez.
 */
function Block({ id, title, delay = 0, children, className = "" }: { id: string; title?: string; delay?: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.visibilityState === "hidden" || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id={id} className={`elle-block ${className}`.trim()} data-in={seen ? "" : undefined} style={{ ["--d" as string]: `${delay}ms` }} aria-labelledby={title ? `${id}-t` : undefined}>
      {title && (
        <h2 id={`${id}-t`} className="elle-label">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export default function AnalysisResult({ analysis, onReset, onRetry }: { analysis: Analysis; onReset: () => void; onRetry: () => void }) {
  const t = elleCopy.result;
  const s = t.sections;
  const [orb, setOrb] = useState<OrbState>("found");
  const demo = analysis.mode === "demo";
  const primary = analysis.categories[0];
  const hasWorldFacts = analysis.facts.some((f) => f.about === "mundo");

  return (
    <article className="elle-result">
      <header className="elle-result__head">
        <ElleOrb state={orb} label="Elle" className="elle-orb--mini" />
        <div className="elle-result__text">
          <h1 className="elle-result__title">{t.title}</h1>
          <p className="elle-result__stats">
            {t.searched(analysis.searched)}
            {analysis.searched.plans ? " Também consultei os planos de governo do TSE." : ""}
          </p>
        </div>
        <button type="button" className="elle-btn elle-btn--text elle-result__new" onClick={onReset}>
          {t.newAnalysis}
        </button>
      </header>

      {demo && (
        <p className="elle-demo-banner" role="note">
          {t.demoBanner}
        </p>
      )}
      {analysis.reading.confidence === "baixa" && (
        <p className="elle-notice" role="note">
          {t.readingLow} {analysis.reading.notes.join(" ")}
        </p>
      )}

      <Block id="dito" title={s.said} delay={0}>
        <p className="elle-lead">{analysis.summary}</p>
        {analysis.transcript && (
          <details className="elle-transcript">
            <summary>{t.transcriptToggle}</summary>
            <blockquote>{analysis.transcript}</blockquote>
          </details>
        )}
      </Block>

      <Block id="debater" title={s.howTo} delay={120}>
        <p>{analysis.debate_guide}</p>
        {primary && (
          <p className="elle-broad">
            <span>{s.broad ?? "Argumento amplo do eixo"}</span>
            {umbrellaArguments[primary]}
          </p>
        )}
      </Block>

      {analysis.categories.length > 0 && (
        <Block id="categoria" title={s.category} delay={200}>
          <p className="elle-badges">
            {analysis.categories.map((c, i) => (
              <CategoryBadge key={c} id={c} primary={i === 0} />
            ))}
          </p>
          <p className="elle-quiet">{categoryCopy[primary ?? analysis.categories[0]].text}</p>
        </Block>
      )}

      <Block id="fatos" title={s.facts}>
        <EvidenceBlock facts={analysis.facts} sources={analysis.sources} />
        {!hasWorldFacts && analysis.searched.searches > 0 && !demo && (
          <p className="elle-retry">
            <span>{t.noEvidence}</span>
            <button type="button" className="elle-btn elle-btn--text" onClick={onRetry}>
              {t.retrySearch}
            </button>
          </p>
        )}
        {analysis.uncertainties.length > 0 && (
          <ul className="elle-uncertain">
            {analysis.uncertainties.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        )}
      </Block>

      {analysis.opinions.length > 0 && (
        <Block id="opiniao" title={s.opinions}>
          <ul className="elle-plain">
            {analysis.opinions.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </Block>
      )}

      {analysis.counter_argument && (
        <Block id="contraponto" title={s.counter}>
          <CounterArgument text={analysis.counter_argument.text} sourceIds={analysis.counter_argument.source_ids} sources={analysis.sources} />
        </Block>
      )}

      {analysis.flavio_fact && (
        <Block id="flavio" title={s.flavio} className="elle-block--flavio">
          <FlavioFact fact={analysis.flavio_fact} sources={analysis.sources} />
        </Block>
      )}

      {analysis.sources.length > 0 && (
        <Block id="fontes" title={s.sources}>
          <SourceList sources={analysis.sources} />
        </Block>
      )}

      {analysis.responses.standard && (
        <Block id="resposta" title={s.suggested}>
          {!analysis.reply_advice.recommended && (
            <p className="elle-notice" role="note">
              <b>{t.skipReply}.</b> {analysis.reply_advice.note}
            </p>
          )}
          <SuggestedResponse replies={analysis.responses} label={s.suggested} />
          {analysis.follow_ups.length > 0 && (
            <details className="elle-followups">
              <summary>{s.followUps}</summary>
              <ul>
                {analysis.follow_ups.map((f, i) => (
                  <li key={i}>
                    <p>{f}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <p className="elle-note">{t.reviewNote}</p>
        </Block>
      )}

      <Block id="voce" title={s.opinion}>
        <UserOpinion analysis={analysis} onOrb={setOrb} />
      </Block>
    </article>
  );
}
