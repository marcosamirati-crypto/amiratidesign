import "server-only";
import { flavioLeads } from "@/content/elle/leads";
import type { CategoryId } from "../types";
import type { Reading } from "./schemas";
import { getNewsSources, getPrimarySources } from "./sources/registry";
import type { SearchRequest } from "./search";
import { fold } from "./text";

/** extractClaims(): separa o que dá para checar do que é opinião/interpretação. */
export function extractClaims(reading: Reading) {
  const isCheckable = (c: Reading["claims"][number]) => c.checkable && (c.type === "factual" || c.type === "acusacao");
  const checkable = reading.claims.filter(isCheckable);
  const judgement = reading.claims.filter((c) => !isCheckable(c));
  return { checkable, judgement };
}

export interface SearchTask extends SearchRequest {
  /** Pergunta de pesquisa que originou esta busca. */
  question: string;
  label: "primaria" | "imprensa";
}

/**
 * Do conjunto de perguntas à lista de buscas: para cada pergunta, uma busca em fontes de NÍVEL 1
 * (oficiais) e uma em NÍVEL 2 (imprensa de alto nível e checagem). O teto vem de ELLE_MAX_SEARCHES (padrão 4).
 * As perguntas do modelo vêm em ordem de importância, então cortar no fim preserva as mais relevantes.
 */
export function planSearches(reading: Reading, lead?: string | null, max = 4): SearchTask[] {
  const topics: Array<CategoryId | "geral"> = reading.topics.length ? reading.topics : ["geral"];
  const tasks: SearchTask[] = [];
  // Com pista do eixo, ficam 2 perguntas do modelo + 1 pista: no máximo 3 perguntas, 6 buscas.
  const questions = reading.research_questions.slice(0, lead ? 2 : 3).map((q) => ({ ...q }));
  // Pista do eixo (ex.: situação jurídica de um candidato no tema). Entra como mais uma pergunta, no mesmo funil.
  if (lead) questions.push({ query: lead, kind: "noticia", freshness: "any" });
  for (const q of questions) {
    const primary = q.kind === "plano" ? getPrimarySources(["plano"]) : getPrimarySources(topics);
    tasks.push({ question: q.query, query: q.query, domains: primary, freshness: q.freshness, news: false, limit: 5, label: "primaria" });
    if (q.kind !== "plano") {
      tasks.push({ question: q.query, query: q.query, domains: getNewsSources(), freshness: q.freshness, news: true, limit: 5, label: "imprensa" });
    }
  }
  return tasks.slice(0, Math.max(1, Math.min(max, 7)));
}

/** Escolhe, entre as pistas do eixo principal, a que mais combina com o que o comentário diz. */
export function pickLead(reading: Reading): string | null {
  const topic = reading.topics[0];
  if (!topic) return null;
  const leads = flavioLeads[topic];
  if (!leads?.length) return null;
  const words = new Set(
    fold(`${reading.focus_comment} ${reading.claims.map((c) => c.text).join(" ")}`)
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
  let best = leads[0];
  let bestScore = -1;
  for (const l of leads) {
    const score = fold(l).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && words.has(w)).length;
    if (score > bestScore) {
      best = l;
      bestScore = score;
    }
  }
  // Em economia os planos de governo já cobrem o tema: a pista só entra se tiver ligação real com o comentário.
  // Nos eixos de histórico e conduta (corrupção, valores, liberdade), entra a mais próxima.
  if (topic === "economia" && bestScore < 1) return null;
  return best;
}

/** Texto usado para procurar trechos relevantes nos planos de governo (busca local). */
export function planQuery(reading: Reading): string {
  const parts = [
    ...reading.claims.filter((c) => c.checkable).map((c) => c.text),
    ...reading.research_questions.map((q) => q.query),
    ...reading.entities,
  ];
  return parts.join(" ").slice(0, 500);
}
