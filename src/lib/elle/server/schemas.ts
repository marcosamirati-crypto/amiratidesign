import "server-only";
import { CATEGORY_IDS, type CategoryId } from "../types";

// Esquemas JSON (o que pedimos ao modelo) e validadores (o que aceitamos de volta).
// O modelo devolve JSON; a interface é que desenha. Nunca pedimos HTML.

const str = { type: "string" } as const;
const strList = { type: "array", items: str } as const;
const idList = { type: "array", items: str } as const;
const category = { type: "string", enum: [...CATEGORY_IDS] } as const;

// ───────── 1) Leitura do print (visão + claims + perguntas de pesquisa) ─────────

export type ClaimType = "factual" | "acusacao" | "opiniao" | "interpretacao" | "previsao" | "ironia" | "pergunta_retorica";
const CLAIM_TYPES = ["factual", "acusacao", "opiniao", "interpretacao", "previsao", "ironia", "pergunta_retorica"] as const;

export interface Reading {
  legibility: "alta" | "media" | "baixa" | "ilegivel";
  legibility_notes: string[];
  raw_text: string;
  focus_comment: string;
  platform: string;
  visible_context: string;
  claims: { text: string; type: ClaimType; checkable: boolean }[];
  entities: string[];
  topics: CategoryId[];
  mentions: ("flavio" | "lula")[];
  /** O comentário traz algum argumento ou afirmação, ou é só ofensa/provocação? */
  has_argument: boolean;
  numbers_and_dates: string[];
  research_questions: { query: string; kind: "oficial" | "dados" | "noticia" | "plano"; freshness: "recent" | "any" }[];
  is_political: boolean;
}

export const READING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "legibility", "legibility_notes", "raw_text", "focus_comment", "platform", "visible_context",
    "claims", "entities", "topics", "mentions", "has_argument", "numbers_and_dates", "research_questions", "is_political",
  ],
  properties: {
    legibility: { type: "string", enum: ["alta", "media", "baixa", "ilegivel"] },
    legibility_notes: strList,
    raw_text: str,
    focus_comment: str,
    platform: { type: "string", enum: ["instagram", "x", "facebook", "whatsapp", "youtube", "tiktok", "threads", "outra", "desconhecida"] },
    visible_context: str,
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "type", "checkable"],
        properties: {
          text: str,
          type: { type: "string", enum: [...CLAIM_TYPES] },
          checkable: { type: "boolean" },
        },
      },
    },
    entities: strList,
    topics: { type: "array", items: category },
    mentions: { type: "array", items: { type: "string", enum: ["flavio", "lula"] } },
    has_argument: { type: "boolean" },
    numbers_and_dates: strList,
    research_questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["query", "kind", "freshness"],
        properties: {
          query: str,
          kind: { type: "string", enum: ["oficial", "dados", "noticia", "plano"] },
          freshness: { type: "string", enum: ["recent", "any"] },
        },
      },
    },
    is_political: { type: "boolean" },
  },
} as const;

// ───────── 2) Síntese (resposta estruturada que a interface renderiza) ─────────

export interface SynthRaw {
  summary: string;
  categories: CategoryId[];
  debate_guide: string;
  facts: { text: string; about: "mundo" | "comentario"; status: "confirmado" | "provavel" | "nao_confirmado" | "contestado"; evidence_ids: string[]; quote: string }[];
  opinions: string[];
  counter_argument: { text: string; evidence_ids: string[] };
  flavio_fact: { applicable: boolean; text: string; evidence_ids: string[]; other_side_text: string; other_side_evidence_ids: string[] };
  responses: { standard: string; short: string };
  follow_ups: string[];
  reply_advice: { recommended: boolean; note: string };
  uncertainties: string[];
}

export const SYNTH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "categories", "debate_guide", "facts", "opinions", "counter_argument", "flavio_fact", "responses", "follow_ups", "reply_advice", "uncertainties"],
  properties: {
    summary: str,
    categories: { type: "array", items: category },
    debate_guide: str,
    facts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "about", "status", "evidence_ids", "quote"],
        properties: {
          text: str,
          about: { type: "string", enum: ["mundo", "comentario"] },
          status: { type: "string", enum: ["confirmado", "provavel", "nao_confirmado", "contestado"] },
          evidence_ids: idList,
          quote: str,
        },
      },
    },
    opinions: strList,
    counter_argument: {
      type: "object",
      additionalProperties: false,
      required: ["text", "evidence_ids"],
      properties: { text: str, evidence_ids: idList },
    },
    flavio_fact: {
      type: "object",
      additionalProperties: false,
      required: ["applicable", "text", "evidence_ids", "other_side_text", "other_side_evidence_ids"],
      properties: {
        applicable: { type: "boolean" },
        text: str,
        evidence_ids: idList,
        other_side_text: str,
        other_side_evidence_ids: idList,
      },
    },
    responses: {
      type: "object",
      additionalProperties: false,
      required: ["standard", "short"],
      properties: { standard: str, short: str },
    },
    follow_ups: strList,
    reply_advice: {
      type: "object",
      additionalProperties: false,
      required: ["recommended", "note"],
      properties: { recommended: { type: "boolean" }, note: str },
    },
    uncertainties: strList,
  },
} as const;

// ───────── 3) Resposta personalizada ─────────

export const PERSONALIZE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["standard", "short"],
  properties: { standard: str, short: str },
} as const;

// ───────── Validadores (aceitam só o formato esperado) ─────────

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function s(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function sl(v: unknown, max = 20): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, max) : [];
}
function en<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}
function cats(v: unknown): CategoryId[] {
  const out: CategoryId[] = [];
  for (const x of sl(v, 8)) {
    if ((CATEGORY_IDS as readonly string[]).includes(x) && !out.includes(x as CategoryId)) out.push(x as CategoryId);
  }
  return out;
}

export function parseReading(raw: unknown): Reading {
  if (!isObj(raw)) throw new Error("reading: não é objeto");
  const claims = (Array.isArray(raw.claims) ? raw.claims : [])
    .filter(isObj)
    .map((c) => ({
      text: s(c.text).trim(),
      type: en(c.type, CLAIM_TYPES, "opiniao"),
      checkable: c.checkable === true,
    }))
    .filter((c) => c.text)
    .slice(0, 8);
  const questions = (Array.isArray(raw.research_questions) ? raw.research_questions : [])
    .filter(isObj)
    .map((q) => ({
      query: s(q.query).trim().slice(0, 140),
      kind: en(q.kind, ["oficial", "dados", "noticia", "plano"] as const, "noticia"),
      freshness: en(q.freshness, ["recent", "any"] as const, "recent"),
    }))
    .filter((q) => q.query)
    .slice(0, 4);
  return {
    legibility: en(raw.legibility, ["alta", "media", "baixa", "ilegivel"] as const, "baixa"),
    legibility_notes: sl(raw.legibility_notes, 4),
    raw_text: s(raw.raw_text).trim().slice(0, 4000),
    focus_comment: s(raw.focus_comment).trim().slice(0, 1500),
    platform: s(raw.platform) || "desconhecida",
    visible_context: s(raw.visible_context).trim().slice(0, 600),
    claims,
    entities: sl(raw.entities, 12),
    topics: cats(raw.topics),
    mentions: sl(raw.mentions, 2).filter((m): m is "flavio" | "lula" => m === "flavio" || m === "lula"),
    has_argument: raw.has_argument !== false,
    numbers_and_dates: sl(raw.numbers_and_dates, 12),
    research_questions: questions,
    is_political: raw.is_political === true,
  };
}

export function parseSynth(raw: unknown): SynthRaw {
  if (!isObj(raw)) throw new Error("synth: não é objeto");
  const facts = (Array.isArray(raw.facts) ? raw.facts : [])
    .filter(isObj)
    .map((f) => ({
      text: s(f.text).trim(),
      about: en(f.about, ["mundo", "comentario"] as const, "comentario"),
      status: en(f.status, ["confirmado", "provavel", "nao_confirmado", "contestado"] as const, "nao_confirmado"),
      evidence_ids: sl(f.evidence_ids, 6),
      quote: s(f.quote).trim(),
    }))
    .filter((f) => f.text);
  const ca = isObj(raw.counter_argument) ? raw.counter_argument : {};
  const ff = isObj(raw.flavio_fact) ? raw.flavio_fact : {};
  const rs = isObj(raw.responses) ? raw.responses : {};
  const ra = isObj(raw.reply_advice) ? raw.reply_advice : {};
  return {
    summary: s(raw.summary).trim(),
    categories: cats(raw.categories),
    debate_guide: s(raw.debate_guide).trim(),
    facts,
    opinions: sl(raw.opinions, 5),
    counter_argument: { text: s(ca.text).trim(), evidence_ids: sl(ca.evidence_ids, 6) },
    flavio_fact: {
      applicable: ff.applicable === true,
      text: s(ff.text).trim(),
      evidence_ids: sl(ff.evidence_ids, 6),
      other_side_text: s(ff.other_side_text).trim(),
      other_side_evidence_ids: sl(ff.other_side_evidence_ids, 6),
    },
    responses: { standard: s(rs.standard).trim(), short: s(rs.short).trim() },
    follow_ups: sl(raw.follow_ups, 3),
    reply_advice: { recommended: ra.recommended !== false, note: s(ra.note).trim() },
    uncertainties: sl(raw.uncertainties, 6),
  };
}

export function parsePersonalize(raw: unknown): { standard: string; short: string } {
  if (!isObj(raw)) throw new Error("personalize: não é objeto");
  return { standard: s(raw.standard).trim(), short: s(raw.short).trim() };
}
