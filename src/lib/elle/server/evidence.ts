import "server-only";
import type { ContentKind, SourceTier } from "../types";
import type { PlanPassage } from "./sources/plans";
import { classifySource } from "./sources/registry";
import type { RawHit } from "./search";
import { canonicalUrl, stripTags } from "./text";

/** Uma evidência coletada. A interface mostra só parte destes campos. */
export interface Evidence {
  id: string;
  source_name: string;
  source_type: "plano_de_governo" | "oficial" | "imprensa" | "outra";
  tier: SourceTier;
  kind: ContentKind;
  title: string;
  url: string;
  published_at: string | null;
  retrieved_at: string;
  /** Pergunta de pesquisa que a trouxe. */
  claim: string;
  /** Trecho que sustenta (é o que o modelo lê). */
  evidence: string;
  /** 0–1 */
  relevance: number;
  /** 0–1, pelo nível da fonte e pelo tipo de conteúdo. */
  reliability: number;
  locator?: string;
}

const RELIABILITY: Record<SourceTier, number> = { 1: 1, 2: 0.75, 3: 0.35 };

function snippetOf(s: string, max = 700): string {
  const t = stripTags(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return stop > max * 0.5 ? cut.slice(0, stop + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** Source Normalizer: resultado bruto do buscador -> evidência com nível, tipo e confiabilidade. */
export function normalizeHit(hit: RawHit, question: string, retrievedAt: string): Evidence | null {
  const url = canonicalUrl(hit.url);
  if (!url) return null;
  const info = classifySource(url, hit.title);
  if (!info) return null;
  const snippet = snippetOf(hit.snippet);
  if (snippet.length < 40) return null; // sem texto não há evidência

  let reliability = RELIABILITY[info.tier];
  if (info.kind === "opiniao") reliability *= 0.6;
  if (info.kind === "checagem") reliability = Math.max(reliability, 0.8);

  return {
    id: "",
    source_name: info.name,
    source_type: info.tier === 1 ? "oficial" : info.tier === 2 ? "imprensa" : "outra",
    tier: info.tier,
    kind: info.kind,
    title: stripTags(hit.title).slice(0, 160),
    url,
    published_at: hit.publishedAt,
    retrieved_at: retrievedAt,
    claim: question,
    evidence: snippet,
    relevance: Math.max(0, Math.min(1, hit.score)),
    reliability,
  };
}

/** Evidência a partir de um trecho do plano de governo registrado no TSE. */
export function fromPlanPassage(p: PlanPassage, retrievedAt: string): Evidence {
  return {
    id: "",
    source_name: "TSE",
    source_type: "plano_de_governo",
    tier: 1,
    kind: "plano",
    title: p.sourceTitle,
    url: p.sourceUrl,
    published_at: null,
    retrieved_at: retrievedAt,
    claim: "plano de governo",
    evidence: p.text,
    relevance: Math.min(1, p.score / 8),
    reliability: 1,
    locator: `p. ${p.page} do PDF`,
  };
}

/**
 * Evidence Extractor: tira duplicatas, ordena por confiabilidade + relevância + data e limita
 * (poucas fontes, tokens controlados, no máximo 2 por site para não deixar um veículo dominar).
 */
export function selectEvidence(all: Evidence[], max = 12): Evidence[] {
  const now = Date.now();
  const seen = new Set<string>();
  const unique: Evidence[] = [];
  for (const e of all) {
    const key = `${e.url}|${e.locator ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(e);
  }

  const score = (e: Evidence) => {
    let s = e.reliability * 0.55 + e.relevance * 0.45;
    if (e.published_at) {
      const days = (now - new Date(e.published_at).getTime()) / 86_400_000;
      if (days >= 0 && days < 120) s += 0.08;
    }
    return s;
  };

  unique.sort((a, b) => score(b) - score(a));

  const perHost = new Map<string, number>();
  const picked: Evidence[] = [];
  for (const e of unique) {
    // Trechos de plano contam por documento (até 3 de cada candidato); o resto, por site.
    const bucket = e.kind === "plano" ? `plano|${e.url}` : new URL(e.url).hostname;
    const cap = e.kind === "plano" ? 3 : 2;
    const n = perHost.get(bucket) ?? 0;
    if (n >= cap) continue;
    perHost.set(bucket, n + 1);
    picked.push(e);
    if (picked.length >= max) break;
  }
  picked.forEach((e, i) => (e.id = `E${i + 1}`));
  return picked;
}
