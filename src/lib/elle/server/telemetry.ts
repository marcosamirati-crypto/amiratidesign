import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Analysis, ElleErrorCode } from "../types";

// Estatísticas anônimas de uso do Elle (tabela elle_events, migração 0005).
// Grava só contagens e categorias: nunca o print, o texto lido, a resposta, IP ou identificador.
// Se o Supabase não estiver configurado ou falhar, a análise segue normalmente.

export type TelemetryEvent =
  | { outcome: "ok"; analysis: Analysis; durationMs: number }
  | { outcome: "error"; code: ElleErrorCode; detail?: string; durationMs: number }
  | { outcome: "cancelled"; durationMs: number };

const enabled = () =>
  process.env.ELLE_STATS !== "0" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Detalhe técnico curto e seguro (ex.: "api 400 credit"); nada do conteúdo. */
function safeDetail(detail: string | undefined): string | null {
  if (!detail) return null;
  return detail.replace(/[^\w .-]/g, "").slice(0, 40) || null;
}

export async function recordEvent(e: TelemetryEvent): Promise<void> {
  if (!enabled()) return;
  const base = { outcome: e.outcome, duration_ms: Math.max(0, Math.min(900_000, Math.round(e.durationMs))) };
  const row =
    e.outcome === "ok"
      ? {
          ...base,
          primary_category: e.analysis.categories[0] ?? null,
          categories: e.analysis.categories.slice(0, 4),
          reading: e.analysis.reading.confidence,
          reply_recommended: e.analysis.reply_advice?.recommended ?? null,
          searches: Math.min(50, e.analysis.searched.searches),
          used_plans: e.analysis.searched.plans,
        }
      : e.outcome === "error"
        ? { ...base, error_code: e.code, error_detail: safeDetail(e.detail) }
        : base;

  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { error } = await db.from("elle_events").insert(row).abortSignal(AbortSignal.timeout(2_500));
    if (error) console.warn("[elle] estatística não gravada:", error.code ?? error.message);
  } catch {
    console.warn("[elle] estatística não gravada: timeout/rede");
  }
}
