import "server-only";
import type { Analysis, AnalysisFact, AnalysisSource, CategoryId } from "../types";
import type { Evidence } from "./evidence";
import type { Reading, SynthRaw } from "./schemas";
import { clampText, fitChars, fold, numbersIn, withSource } from "./text";

/**
 * verifyClaims(): a trava de segurança entre o modelo e a tela.
 * O modelo escreve; este código confere. O que não passa na conferência não chega ao usuário.
 *  - Fonte só existe se saiu da coleta (nunca URL, nome ou data escritos pelo modelo).
 *  - Fato do mundo sem fonte válida é descartado.
 *  - Número citado precisa aparecer em alguma fonte citada.
 *  - "Confirmado" sem fonte primária (ou ao menos dois veículos diferentes) vira "provável".
 *  - Citação literal só fica se for mesmo um trecho da fonte.
 *  - "Fato sobre Flávio" só fica se a fonte citada realmente falar dele.
 */

interface Ctx {
  reading: Reading;
  evidence: Evidence[];
  searches: number;
  /** Páginas distintas que as buscas devolveram. */
  pagesFound: number;
  usedPlans: boolean;
  /** Avisos já sabidos pelo pipeline (ex.: "a busca na internet falhou"). */
  notes: string[];
}

const URL_RE = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;
// Para um fato apoiado só em plano de governo, o texto precisa dizer QUE o documento propõe/afirma algo.
// (\b do JavaScript não enxerga letras acentuadas, por isso as fronteiras são feitas com \p{L}.)
const PLAN_ATTRIBUTION = /(?<!\p{L})(propõe|propõem|propor|proposta|promete|prometem|prevê|preveem|defende|defendem|afirma|afirmam|diz que|dizem que|traz|inclui|cita|menciona|apresenta|compromete-se|pretende|planeja)(?!\p{L})/iu;

/** Tira links, hashtags e emojis, que a Elle nunca coloca em comentário pronto. */
function plainReply(s: string): string {
  return s
    .replace(URL_RE, "")
    .replace(/#\S+/g, "")
    .replace(/[\p{Extended_Pictographic}‍️]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function verifyClaims(raw: SynthRaw, ctx: Ctx): Analysis {
  const byId = new Map(ctx.evidence.map((e) => [e.id, e]));
  const transcriptFold = fold(`${ctx.reading.raw_text} ${ctx.reading.focus_comment}`);

  const validIds = (ids: string[]) => [...new Set(ids)].filter((id) => byId.has(id));
  const textOf = (ids: string[]) => ids.map((id) => fold(byId.get(id)?.evidence ?? "")).join(" ");
  const numbersGrounded = (text: string, ids: string[]) => {
    const pool = `${textOf(ids)} ${transcriptFold}`;
    const poolNums = new Set(numbersIn(pool));
    return numbersIn(text).every((n) => poolNums.has(n));
  };

  const cited: string[] = []; // ids de evidências citadas, na ordem do primeiro uso
  const cite = (ids: string[]) => ids.forEach((id) => !cited.includes(id) && cited.push(id));

  // ───── fatos ─────
  const facts: Array<AnalysisFact & { _ids: string[] }> = [];
  for (const f of raw.facts) {
    const text = clampText(f.text, 260);
    if (!text) continue;
    let ids = validIds(f.evidence_ids);
    let about = f.about;
    let status = f.status;

    if (about === "mundo") {
      if (!ids.length) continue; // fato do mundo sem fonte: não passa
      if (status === "nao_confirmado") about = "comentario";
      if (!numbersGrounded(text, ids)) continue; // número que a fonte não traz: não passa
    } else if (!ids.length && status !== "nao_confirmado") {
      status = "nao_confirmado";
    } else if (ids.length && !numbersGrounded(text, ids)) {
      ids = [];
      status = "nao_confirmado";
    }

    // Plano de governo é documento de campanha: só vale como "o plano propõe/afirma…", nunca como fato comprovado.
    if (about === "mundo" && ids.length && ids.every((id) => byId.get(id)?.kind === "plano") && !PLAN_ATTRIBUTION.test(text)) continue;

    // "Confirmado" exige fonte primária ou ao menos dois veículos diferentes.
    if (status === "confirmado") {
      const picked = ids.map((id) => byId.get(id)!).filter(Boolean);
      const hasPrimary = picked.some((e) => e.tier === 1);
      const outlets = new Set(picked.filter((e) => e.kind !== "opiniao").map((e) => e.source_name));
      if (!hasPrimary && outlets.size < 2) status = "provavel";
    }
    if ((status === "confirmado" || status === "provavel") && !ids.length) status = "nao_confirmado";

    // Citação literal: só se for um trecho de fato de uma fonte citada.
    let quote: string | undefined;
    const q = f.quote.trim();
    if (q.length >= 20 && q.length <= 200 && ids.length) {
      const qf = fold(q);
      if (ids.some((id) => fold(byId.get(id)?.evidence ?? "").includes(qf))) quote = q;
    }

    cite(ids);
    facts.push({ text, status, about, source_ids: ids, ...(quote ? { quote } : {}), _ids: ids });
    if (facts.length >= 4) break;
  }

  // ───── contraponto ─────
  let counter: Analysis["counter_argument"] = null;
  const counterText = clampText(raw.counter_argument.text, 380);
  if (counterText) {
    let ids = validIds(raw.counter_argument.evidence_ids);
    if (ids.length && !numbersGrounded(counterText, ids)) ids = [];
    cite(ids);
    counter = { text: counterText, source_ids: ids };
  }

  // ───── fato sobre Flávio (e o outro lado) ─────
  let flavio: Analysis["flavio_fact"] = null;
  const ff = raw.flavio_fact;
  if (ff.applicable) {
    const text = clampText(ff.text, 320);
    const ids = validIds(ff.evidence_ids);
    const talksAboutHim = ids.some((id) => /flavio/.test(fold(`${byId.get(id)?.evidence ?? ""} ${byId.get(id)?.title ?? ""}`)));
    const planAbout = ids.some((id) => byId.get(id)?.kind === "plano" && /flavio/.test(fold(byId.get(id)?.title ?? "")));
    if (text && ids.length && (talksAboutHim || planAbout) && numbersGrounded(text, ids)) {
      cite(ids);
      let other: NonNullable<Analysis["flavio_fact"]>["other_side"] = null;
      const oText = clampText(ff.other_side_text, 320);
      const oIds = validIds(ff.other_side_evidence_ids);
      const talksAboutLula = oIds.some((id) => /lula/.test(fold(`${byId.get(id)?.evidence ?? ""} ${byId.get(id)?.title ?? ""}`)));
      if (oText && oIds.length && talksAboutLula && numbersGrounded(oText, oIds)) {
        cite(oIds);
        other = { text: oText, source_ids: oIds };
      }
      flavio = { text, source_ids: ids, other_side: other };
    }
  }

  // ───── fontes: só as citadas, renumeradas 1..n, vindas da coleta ─────
  const order = [...cited].sort((a, b) => {
    const ea = byId.get(a)!;
    const eb = byId.get(b)!;
    return ea.tier - eb.tier || cited.indexOf(a) - cited.indexOf(b);
  });
  const remap = new Map(order.map((id, i) => [id, String(i + 1)]));
  const sources: AnalysisSource[] = order.map((id) => {
    const e = byId.get(id)!;
    return {
      id: remap.get(id)!,
      name: e.source_name,
      title: e.title,
      url: e.url,
      published_at: e.published_at,
      tier: e.tier,
      kind: e.kind,
      ...(e.locator ? { locator: e.locator } : {}),
    };
  });
  const rm = (ids: string[]) => ids.map((i) => remap.get(i)).filter((x): x is string => !!x);

  // ───── categorias ─────
  const categories: CategoryId[] = [];
  for (const c of [...raw.categories, ...ctx.reading.topics]) if (!categories.includes(c)) categories.push(c);
  const finalCategories = categories.slice(0, 3);

  // ───── incertezas ─────
  const uncertainties = raw.uncertainties.map((u) => clampText(u, 220)).filter(Boolean).slice(0, 3);
  for (const n of ctx.notes) if (!uncertainties.includes(n)) uncertainties.push(n);
  const verifiedWorldFacts = facts.some((f) => f.about === "mundo");
  const checkable = ctx.reading.claims.some((c) => c.checkable);
  if (checkable && !verifiedWorldFacts && !uncertainties.some((u) => /evid[eê]ncia suficiente/i.test(u))) {
    uncertainties.unshift("Não encontrei evidência suficiente para confirmar essa afirmação.");
  }

  // Respostas nos limites das redes (280 / 150) e a versão "com fonte" montada aqui, com fonte que de fato foi citada.
  const standard = fitChars(plainReply(raw.responses.standard), 280);
  const short = fitChars(plainReply(raw.responses.short) || standard, 150);
  const responses = { standard, short, with_source: withSource(standard, sources[0]?.name ?? null) };
  const followUps = raw.follow_ups.map((f) => fitChars(plainReply(f), 150)).filter(Boolean).slice(0, 2);
  const advice = {
    recommended: raw.reply_advice.recommended && ctx.reading.has_argument,
    note:
      clampText(raw.reply_advice.note, 160) ||
      (ctx.reading.has_argument ? "" : "A resposta é para quem está lendo, não para quem provoca."),
  };

  return {
    mode: "live",
    transcript: ctx.reading.focus_comment || ctx.reading.raw_text,
    reading: {
      confidence: ctx.reading.legibility === "ilegivel" ? "baixa" : (ctx.reading.legibility as "alta" | "media" | "baixa"),
      notes: ctx.reading.legibility_notes.map((n) => clampText(n, 160)).slice(0, 3),
    },
    summary: clampText(raw.summary, 280),
    categories: finalCategories,
    debate_guide: clampText(raw.debate_guide, 340),
    facts: facts.map(({ _ids, ...rest }) => ({ ...rest, source_ids: rm(_ids) })),
    opinions: raw.opinions.map((o) => clampText(o, 200)).filter(Boolean).slice(0, 3),
    counter_argument: counter ? { text: counter.text, source_ids: rm(counter.source_ids) } : null,
    flavio_fact: flavio
      ? {
          text: flavio.text,
          source_ids: rm(flavio.source_ids),
          other_side: flavio.other_side ? { text: flavio.other_side.text, source_ids: rm(flavio.other_side.source_ids) } : null,
        }
      : null,
    sources,
    responses,
    follow_ups: followUps,
    reply_advice: advice,
    uncertainties,
    searched: { searches: ctx.searches, pages: ctx.pagesFound, plans: ctx.usedPlans },
  };
}
