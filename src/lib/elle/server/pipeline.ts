import "server-only";
import type { ElleEvent } from "../types";
import { extractClaims, pickLead, planQuery, planSearches } from "./claims";
import { getConfig } from "./config";
import { generateDebate } from "./debate";
import { ElleError } from "./errors";
import { fromPlanPassage, normalizeHit, selectEvidence, type Evidence } from "./evidence";
import { searchWeb, type RawHit } from "./search";
import { anyPlansReady, retrievePlanPassages } from "./sources/plans";
import { canonicalUrl } from "./text";
import { verifyClaims } from "./verification";
import { readScreenshot, type ImageInput } from "./vision";

export interface PipelineArgs {
  image: ImageInput;
  signal: AbortSignal;
  emit: (e: ElleEvent) => void;
}

/**
 * print -> leitura (visão) -> afirmações -> buscas + planos -> evidências -> síntese -> conferência -> resultado.
 * Cada evento "stage" é emitido quando a etapa realmente começa: a interface não inventa progresso.
 */
export async function runAnalysis({ image, signal, emit }: PipelineArgs): Promise<void> {
  const c = getConfig();
  const t0 = Date.now();
  const remaining = () => c.budget.totalMs - (Date.now() - t0);
  const within = (ms: number) => AbortSignal.any([signal, AbortSignal.timeout(Math.max(1500, Math.min(ms, remaining())))]);

  // 1) Leitura do print
  emit({ type: "stage", stage: "reading" });
  const reading = await readScreenshot(image, within(c.budget.readMs));
  const hasText = reading.raw_text.replace(/\[ileg[ií]vel\]/gi, "").trim().length >= 6;
  if (reading.legibility === "ilegivel" || !hasText || (!reading.claims.length && !reading.focus_comment)) {
    throw new ElleError("unreadable");
  }

  // 2) O que dá para checar e o que é opinião
  const { checkable } = extractClaims(reading);
  emit({
    type: "stage",
    stage: "understood",
    detail: checkable.length
      ? `${checkable.length} ${checkable.length === 1 ? "afirmação" : "afirmações"} para verificar`
      : "Parece depender mais de opinião do que de fatos",
  });

  // 3) Buscas na internet (só se houver o que verificar)
  const retrievedAt = new Date().toISOString();
  const notes: string[] = [];
  const evidenceAll: Evidence[] = [];
  const tasks = checkable.length || reading.research_questions.length ? planSearches(reading, pickLead(reading), c.maxSearches) : [];
  let searchesOk = 0;
  let searchErrors = 0;
  let authFailed = false;
  const pages = new Set<string>();

  if (tasks.length) {
    emit({ type: "stage", stage: "searching", detail: `${tasks.length} ${tasks.length === 1 ? "busca" : "buscas"}` });
    const settled = await Promise.allSettled(tasks.map((t) => searchWeb(t, within(c.budget.searchMs))));
    settled.forEach((r, i) => {
      if (r.status === "rejected") {
        searchErrors++;
        if (r.reason instanceof ElleError && r.reason.code === "unavailable") authFailed = true;
        return;
      }
      searchesOk++;
      for (const hit of r.value as RawHit[]) {
        const key = canonicalUrl(hit.url);
        if (key) pages.add(key);
        const ev = normalizeHit(hit, tasks[i].question, retrievedAt);
        if (ev) evidenceAll.push(ev);
      }
    });
  }

  // 4) Planos de governo (busca local nos documentos do TSE)
  let usedPlans = false;
  if (anyPlansReady()) {
    const passages = retrievePlanPassages(planQuery(reading));
    if (passages.length) {
      usedPlans = true;
      emit({ type: "stage", stage: "plans" });
      for (const p of passages) evidenceAll.push(fromPlanPassage(p, retrievedAt));
    }
  }

  if (tasks.length && searchesOk === 0 && !usedPlans) {
    throw new ElleError(authFailed ? "unavailable" : "search_failed");
  }
  if (tasks.length && searchesOk === 0) notes.push("A busca na internet falhou desta vez; usei só os planos de governo.");
  else if (searchErrors > 0) notes.push("Algumas buscas falharam. O levantamento pode estar incompleto.");

  const evidence = selectEvidence(evidenceAll, 12);

  // 5) Síntese sobre as evidências coletadas
  if (remaining() < 9_000) throw new ElleError("timeout");
  emit({ type: "stage", stage: "comparing" });
  const raw = await generateDebate({
    reading,
    evidence,
    signal: within(remaining() - 1_500),
    remainingMs: remaining(),
  });

  // 6) Conferência: o que não tem fonte não passa
  emit({ type: "stage", stage: "verifying" });
  const analysis = verifyClaims(raw, { reading, evidence, searches: searchesOk, pagesFound: pages.size, usedPlans, notes });
  if (!analysis.summary) throw new ElleError("unknown", "empty summary");

  emit({ type: "result", analysis });
}
