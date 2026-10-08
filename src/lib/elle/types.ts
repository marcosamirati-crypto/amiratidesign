// Tipos compartilhados entre servidor e navegador. Nada aqui importa código de servidor.

export const CATEGORY_IDS = ["corrupcao", "valores", "liberdade", "economia"] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

/** CONFIRMADO / PROVÁVEL / NÃO CONFIRMADO / CONTESTADO. (Opinião e interpretação vivem em listas próprias.) */
export type FactStatus = "confirmado" | "provavel" | "nao_confirmado" | "contestado";

/** 1 = fonte primária/oficial, 2 = imprensa de alto nível ou checagem, 3 = outras. */
export type SourceTier = 1 | 2 | 3;

export type ContentKind = "documento" | "dados" | "plano" | "noticia" | "opiniao" | "checagem" | "desconhecido";

export interface AnalysisSource {
  id: string;
  /** Nome curto do veículo ou órgão (ex.: "Reuters", "IBGE"). */
  name: string;
  title: string;
  /** Null só no modo de demonstração. */
  url: string | null;
  /** ISO 8601 quando a fonte informa; null quando não informa. Nunca inventada. */
  published_at: string | null;
  tier: SourceTier;
  kind: ContentKind;
  /** Ex.: "p. 23 do PDF" (planos de governo). */
  locator?: string;
}

export interface AnalysisFact {
  text: string;
  status: FactStatus;
  /** "mundo" = algo verificado nas fontes; "comentario" = o que o print afirma. */
  about: "mundo" | "comentario";
  source_ids: string[];
  /** Trecho curto, literal, de uma das fontes citadas (validado no servidor). */
  quote?: string;
}

/** A mesma resposta em três tamanhos (limites das redes: 150 TikTok, 280 X/Instagram/Facebook). */
export interface ReplyVariants {
  standard: string;
  short: string;
  /** Padrão terminando em "Fonte: Nome". Null quando não há fonte citada. */
  with_source: string | null;
}

export interface Analysis {
  /** "demo" = exemplo fixo de desenvolvimento, nada foi pesquisado. */
  mode: "live" | "demo";
  /** Texto lido do print, para a pessoa conferir a leitura. */
  transcript: string;
  reading: { confidence: "alta" | "media" | "baixa"; notes: string[] };
  summary: string;
  /** A primeira é a principal. */
  categories: CategoryId[];
  debate_guide: string;
  facts: AnalysisFact[];
  opinions: string[];
  counter_argument: { text: string; source_ids: string[] } | null;
  flavio_fact: {
    text: string;
    source_ids: string[];
    other_side: { text: string; source_ids: string[] } | null;
  } | null;
  sources: AnalysisSource[];
  responses: ReplyVariants;
  /** Até duas tréplicas curtas (150 caracteres), caso a pessoa retruque. */
  follow_ups: string[];
  /** Vale a pena responder? Baseado só no conteúdo do comentário, nunca no perfil. */
  reply_advice: { recommended: boolean; note: string };
  uncertainties: string[];
  searched: { searches: number; pages: number; plans: boolean };
}

export type StageId = "reading" | "understood" | "searching" | "plans" | "comparing" | "verifying";

export type ElleErrorCode =
  | "unreadable"
  | "low_res"
  | "unsupported"
  | "too_large"
  | "search_failed"
  | "timeout"
  | "rate_limited"
  | "network"
  | "unavailable"
  | "bad_request"
  | "unknown";

export type ElleEvent =
  | { type: "stage"; stage: StageId; detail?: string; demo?: boolean }
  | { type: "result"; analysis: Analysis }
  | { type: "error"; code: ElleErrorCode; message: string; retryable: boolean };

/** Corpo de POST /api/elle/personalize. Só o necessário para reescrever a resposta. */
export interface PersonalizeRequest {
  opinion: string;
  transcript: string;
  summary: string;
  categories: CategoryId[];
  facts: { text: string; status: FactStatus }[];
  counter_argument: string;
  standard_response: string;
  /** Nome da principal fonte citada, para a versão "com fonte". */
  source_name: string | null;
}

export interface PersonalizeResponse {
  replies: ReplyVariants;
}
