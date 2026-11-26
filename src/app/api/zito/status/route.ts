import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

// Survival or Dice (/zito): a mesa depende do Supabase Realtime para os aparelhos se falarem.
// Esta rota faz um teste de ida e volta (dois clientes, um canal, um sinal) e diz se
// a retransmissão funciona. Não grava nada no banco. O resultado fica guardado por
// 60 s para a rota não virar alvo de abuso.
export const dynamic = "force-dynamic";
export const maxDuration = 20;

type Probe = { realtime: "ok" | "erro" | "sem-config"; ms?: number; etapa?: string; detalhe?: string; chave?: string };
let last: { at: number; body: Probe } | null = null;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

export async function GET(): Promise<Response> {
  if (last && Date.now() - last.at < 60_000) return json({ ...last.body, cache: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return json({ realtime: "sem-config" } satisfies Probe, 503);
  const body = await probe(url, key);
  last = { at: Date.now(), body };
  return json(body, body.realtime === "ok" ? 200 : 502);
}

function join(c: SupabaseClient, name: string, onPing?: (n: string) => void) {
  return new Promise<{ ch: RealtimeChannel; status: string; err?: string }>((res) => {
    const ch = c.channel(name, { config: { broadcast: { self: false } } });
    if (onPing) ch.on("broadcast", { event: "ping" }, ({ payload }) => onPing(String(payload?.n ?? "")));
    const t = setTimeout(() => res({ ch, status: "SEM_RESPOSTA" }), 8000);
    ch.subscribe((status, err) => {
      if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        clearTimeout(t);
        res({ ch, status, err: err?.message });
      }
    });
  });
}

async function probe(url: string, key: string): Promise<Probe> {
  const t0 = Date.now();
  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  const a = createClient(url, key, opts);
  const b = createClient(url, key, opts);
  const chave = key.startsWith("sb_publishable_") ? "publishable" : "legada";
  const name = "sod-check-" + Math.random().toString(36).slice(2, 8);
  const nonce = Math.random().toString(36).slice(2);
  let heard: (v: boolean) => void = () => {};
  const got = new Promise<boolean>((r) => (heard = r));
  try {
    const [ja, jb] = await Promise.all([join(a, name), join(b, name, (n) => n === nonce && heard(true))]);
    for (const j of [ja, jb]) {
      if (j.status !== "SUBSCRIBED") return { realtime: "erro", etapa: "entrar no canal", detalhe: [j.status, j.err].filter(Boolean).join(": "), chave };
    }
    await ja.ch.send({ type: "broadcast", event: "ping", payload: { n: nonce } });
    const ok = await Promise.race([got, new Promise<boolean>((r) => setTimeout(() => r(false), 5000))]);
    if (!ok) return { realtime: "erro", etapa: "entregar a mensagem", detalhe: "o sinal não chegou ao segundo aparelho em 5 s", chave };
    return { realtime: "ok", ms: Date.now() - t0, chave };
  } catch (e) {
    return { realtime: "erro", etapa: "conectar", detalhe: e instanceof Error ? e.message : String(e), chave };
  } finally {
    await Promise.allSettled([a.removeAllChannels(), b.removeAllChannels()]);
  }
}
