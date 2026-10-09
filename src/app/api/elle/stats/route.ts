import { createClient } from "@supabase/supabase-js";

// Números agregados do Elle para o painel: totais, eixos, erros e análises por hora.
// Só contagens (função elle_stats, migração 0005): nenhuma análise individual sai daqui.
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });

export async function GET(req: Request): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return json({ error: "stats_not_configured" }, 503);

  const raw = Number(new URL(req.url).searchParams.get("hours"));
  const hours = Number.isFinite(raw) && raw >= 1 ? Math.min(Math.round(raw), 24 * 60) : 24;

  try {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.rpc("elle_stats", { since_hours: hours }).abortSignal(AbortSignal.timeout(5_000));
    if (error) return json({ error: "stats_unavailable", code: error.code ?? null }, 502);
    return json(data);
  } catch {
    return json({ error: "stats_unavailable" }, 502);
  }
}
