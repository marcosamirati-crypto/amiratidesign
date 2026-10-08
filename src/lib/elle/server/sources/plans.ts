import "server-only";
import flavioFile from "@/content/elle/plans/flavio-bolsonaro.json";
import lulaFile from "@/content/elle/plans/lula.json";
import { fold } from "../text";

// Planos de governo oficiais (TSE), lidos de arquivos locais gerados por `npm run elle:plans`.
// O TSE bloqueia download automático, então os PDFs entram pela pasta src/content/elle/plans/pdf/.
// Sem os arquivos, a Elle simplesmente não usa planos (e diz isso), em vez de inventar propostas.

export type CandidateId = "flavio" | "lula";

export interface PlanFile {
  candidate: { id: CandidateId; name: string; short: string; party: string; number: number };
  status: "pending" | "ready";
  source: { title: string; page_url: string; pdf_url: string; extracted_at: string | null; sha256: string | null; pages: number };
  passages: { page: number; text: string }[];
}

export interface PlanPassage {
  candidateId: CandidateId;
  candidateName: string;
  party: string;
  page: number;
  text: string;
  score: number;
  sourceTitle: string;
  sourceUrl: string;
  extractedAt: string | null;
}

const FILES: PlanFile[] = [flavioFile as PlanFile, lulaFile as PlanFile];

const STOP = new Set(
  ("a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre entre ate apos que se e ou mas como mais menos muito muita " +
    "ja foi ser sao era vai vao tem ter tinha isso esse essa esses essas este esta estes estas aquele aquela eu voce ele ela eles elas nosso nossa seu sua " +
    "ao aos pelo pela pelos pelas quando onde qual quais porque pois tambem so ainda todo toda todos todas cada outro outra governo plano propostas proposta").split(" "),
);

/** Troncamento simples (prefixo de 6 letras) para casar singular/plural/derivações em português. */
function stem(w: string): string {
  return w.length > 7 ? w.slice(0, 6) : w.replace(/s$/, "");
}

function tokens(s: string): string[] {
  return fold(s)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map(stem);
}

interface Indexed {
  file: PlanFile;
  page: number;
  text: string;
  tf: Map<string, number>;
  len: number;
}

/** Semelhança (0–1) entre dois trechos pelo conjunto de palavras. Os planos repetem parágrafos inteiros. */
function overlap(a: Map<string, number>, b: Map<string, number>): number {
  let inter = 0;
  for (const k of a.keys()) if (b.has(k)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

let index: { docs: Indexed[]; idf: Map<string, number>; avg: number } | null = null;
let indexKey = "";

function build() {
  const key = FILES.map((f) => `${f.status}:${f.passages.length}:${f.source.sha256 ?? ""}`).join("|");
  if (index && key === indexKey) return index;
  const docs: Indexed[] = [];
  for (const file of FILES) {
    if (file.status !== "ready") continue;
    for (const p of file.passages) {
      const tf = new Map<string, number>();
      const ts = tokens(p.text);
      for (const t of ts) tf.set(t, (tf.get(t) ?? 0) + 1);
      docs.push({ file, page: p.page, text: p.text, tf, len: ts.length || 1 });
    }
  }
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = new Map<string, number>();
  for (const [t, n] of df) idf.set(t, Math.log(1 + (docs.length - n + 0.5) / (n + 0.5)));
  const avg = docs.reduce((a, d) => a + d.len, 0) / (docs.length || 1);
  index = { docs, idf, avg };
  indexKey = key;
  return index;
}

export function plansReady(): Record<CandidateId, boolean> {
  return {
    flavio: (FILES[0]?.status === "ready" && FILES[0].passages.length > 0),
    lula: (FILES[1]?.status === "ready" && FILES[1].passages.length > 0),
  };
}

export function anyPlansReady(): boolean {
  const r = plansReady();
  return r.flavio || r.lula;
}

/** Trecho curto, cortado em fim de frase, para caber no prompt. */
function excerpt(text: string, max = 650): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return stop > max * 0.5 ? cut.slice(0, stop + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/**
 * Trechos dos planos mais relevantes para a consulta (BM25 simplificado).
 * Só devolve o que passa de um piso de relevância: sem trecho relevante, devolve vazio.
 */
export function retrievePlanPassages(query: string, opts: { perCandidate?: number } = {}): PlanPassage[] {
  const { docs, idf, avg } = build();
  if (!docs.length) return [];
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];

  const k1 = 1.4;
  const b = 0.75;
  const scored = docs.map((d) => {
    let score = 0;
    let matched = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      matched++;
      score += (idf.get(t) ?? 0) * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avg)));
    }
    return { d, score, matched };
  });

  const per = opts.perCandidate ?? 3;
  const out: PlanPassage[] = [];
  for (const id of ["flavio", "lula"] as const) {
    const ranked = scored
      .filter((x) => x.d.file.candidate.id === id && x.matched >= Math.min(2, q.length) && x.score > 1.2)
      .sort((a, z) => z.score - a.score);
    // Sem quase-duplicatas: se um trecho é parecido demais com outro já escolhido, fica só o melhor.
    const best: typeof ranked = [];
    for (const x of ranked) {
      if (best.some((b) => overlap(b.d.tf, x.d.tf) > 0.5)) continue;
      best.push(x);
      if (best.length >= per) break;
    }
    for (const x of best) {
      out.push({
        candidateId: id,
        candidateName: x.d.file.candidate.name,
        party: x.d.file.candidate.party,
        page: x.d.page,
        text: excerpt(x.d.text),
        score: x.score,
        sourceTitle: x.d.file.source.title,
        sourceUrl: x.d.file.source.page_url,
        extractedAt: x.d.file.source.extracted_at,
      });
    }
  }
  return out;
}
