import "server-only";
import type { PersonalizeRequest, ReplyVariants } from "../types";
import { getConfig } from "./config";
import type { Evidence } from "./evidence";
import { ElleError } from "./errors";
import { generateJson } from "./llm";
import { PERSONALIZE_SYSTEM, WRITE_SYSTEM } from "./prompts";
import {
  PERSONALIZE_SCHEMA, SYNTH_SCHEMA, parsePersonalize, parseSynth, type Reading, type SynthRaw,
} from "./schemas";
import { fitChars, fold, numbersIn, withSource } from "./text";

/** Tira < e > para o texto coletado da internet não conseguir "fechar" as tags do prompt. */
const safe = (s: string) => s.replace(/[<>]/g, " ").replace(/\s+/g, " ").trim();

function today(): string {
  return new Date().toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza", day: "2-digit", month: "long", year: "numeric" });
}

function buildWriteInput(reading: Reading, evidence: Evidence[]): string {
  const claims = reading.claims
    .map((c) => `- (${c.checkable ? "checável" : "não checável"}, ${c.type}) ${safe(c.text)}`)
    .join("\n");
  const ev = evidence.length
    ? evidence
        .map((e) => {
          const attrs = [
            `id="${e.id}"`,
            `nivel="${e.tier}"`,
            `fonte="${safe(e.source_name)}"`,
            `tipo="${e.kind}"`,
            `titulo="${safe(e.title).replace(/"/g, "'")}"`,
            e.published_at ? `data="${e.published_at.slice(0, 10)}"` : `data="desconhecida"`,
            e.locator ? `local="${e.locator}"` : "",
          ]
            .filter(Boolean)
            .join(" ");
          return `<e ${attrs}>${safe(e.evidence)}</e>`;
        })
        .join("\n")
    : "(nenhuma evidência coletada)";

  return [
    `Hoje é ${today()}.`,
    "<print>",
    `Plataforma: ${safe(reading.platform)}`,
    `Comentário principal: ${safe(reading.focus_comment || reading.raw_text)}`,
    reading.visible_context ? `Contexto visível: ${safe(reading.visible_context)}` : "",
    `Eixos prováveis: ${reading.topics.join(", ") || "nenhum claro"}`,
    `Citados: ${reading.mentions.join(", ") || "ninguém em especial"}`,
    `has_argument: ${reading.has_argument}`,
    `Afirmações:\n${claims || "- (nenhuma)"}`,
    "</print>",
    "<evidencias>",
    ev,
    "</evidencias>",
    "Produza a análise no formato pedido.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** generateDebate(): síntese do LLM sobre evidências já coletadas. A conferência vem depois, em verifyClaims(). */
export async function generateDebate(args: {
  reading: Reading;
  evidence: Evidence[];
  signal: AbortSignal;
  remainingMs: number;
}): Promise<SynthRaw> {
  const c = getConfig();
  const call = () =>
    generateJson<SynthRaw>({
      model: c.modelWrite,
      system: WRITE_SYSTEM,
      content: buildWriteInput(args.reading, args.evidence),
      schema: SYNTH_SCHEMA as unknown as Record<string, unknown>,
      effort: args.remainingMs < 26_000 ? "low" : "medium",
      maxTokens: 12000, // o pensamento do modelo também conta aqui
      signal: args.signal,
      parse: parseSynth,
    });
  try {
    return await call();
  } catch (e) {
    // Uma segunda tentativa só para JSON malformado e só se ainda houver tempo.
    if (e instanceof ElleError && e.code === "unknown" && !args.signal.aborted && args.remainingMs > 30_000) return call();
    throw e;
  }
}

/** Frases com números que não existem no material fornecido são descartadas. */
function dropUngroundedSentences(reply: string, pool: string): string {
  const poolNums = new Set(numbersIn(fold(pool)));
  const sentences = reply.match(/[^.!?]+[.!?]*\s*/g) ?? [reply];
  return sentences
    .filter((s) => numbersIn(fold(s)).every((n) => poolNums.has(n)))
    .join("")
    .trim();
}

/** Sem links, hashtags e emojis, e nos limites das redes. */
function finishReply(text: string, pool: string, max: number): string {
  const plain = text
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/gi, "")
    .replace(/#\S+/g, "")
    .replace(/[\p{Extended_Pictographic}‍️]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return fitChars(dropUngroundedSentences(plain, pool), max);
}

export async function personalizeReply(req: PersonalizeRequest, signal: AbortSignal): Promise<ReplyVariants> {
  const c = getConfig();
  const facts = req.facts.map((f) => `- (${f.status}) ${safe(f.text)}`).join("\n") || "- (nenhum fato verificado)";
  const content = [
    "<analise>",
    `Comentário original: ${safe(req.transcript)}`,
    `Resumo: ${safe(req.summary)}`,
    `Eixos: ${req.categories.join(", ") || "—"}`,
    `Fatos:\n${facts}`,
    req.counter_argument ? `Contraponto: ${safe(req.counter_argument)}` : "",
    `Resposta sugerida (base): ${safe(req.standard_response)}`,
    "</analise>",
    "<opiniao>",
    safe(req.opinion),
    "</opiniao>",
    "Escreva a resposta.",
  ]
    .filter(Boolean)
    .join("\n");

  const out = await generateJson({
    model: c.modelWrite,
    system: PERSONALIZE_SYSTEM,
    content,
    schema: PERSONALIZE_SCHEMA as unknown as Record<string, unknown>,
    effort: "low",
    maxTokens: 4000,
    signal,
    parse: parsePersonalize,
  });

  const pool = [req.summary, req.transcript, req.opinion, req.counter_argument, req.standard_response, ...req.facts.map((f) => f.text)].join(" ");
  const standard = finishReply(out.standard, pool, 280);
  if (!standard) throw new ElleError("unknown", "empty reply");
  const short = finishReply(out.short, pool, 150) || fitChars(standard, 150);
  return { standard, short, with_source: withSource(standard, req.source_name) };
}
