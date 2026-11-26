import { aiEnabled, allow, ask, chronicle, cleanCtx, clientKey, interpret } from "@/lib/zito/ai";

// Survival or Dice (/zito): interpretação da narração, crônica e perguntas ao códice.
// Só tarefas fixas; o navegador nunca manda um prompt livre.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export async function POST(req: Request): Promise<Response> {
  if (!aiEnabled()) return json({ ok: false, code: "unavailable" }, 503);
  if (!allow(clientKey(req))) return json({ ok: false, code: "rate_limited" }, 429);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, code: "bad_request" }, 400);
  }
  try {
    if (body.task === "interpret") {
      const text = String(body.text ?? "").slice(0, 4000);
      if (!text.trim()) return json({ ok: false, code: "bad_request" }, 400);
      return json({ ok: true, data: await interpret(text, cleanCtx(body.ctx)) });
    }
    if (body.task === "chronicle") {
      const plain = String(body.plain ?? "").slice(0, 30000);
      if (!plain.trim()) return json({ ok: false, code: "bad_request" }, 400);
      return json({ ok: true, text: await chronicle(plain) });
    }
    if (body.task === "ask") {
      const q = String(body.question ?? "").slice(0, 500);
      const notes = (Array.isArray(body.notes) ? body.notes : []).slice(-30).map((n) => String(n).slice(0, 500));
      if (!q.trim()) return json({ ok: false, code: "bad_request" }, 400);
      return json({ ok: true, text: await ask(q, notes) });
    }
    return json({ ok: false, code: "bad_request" }, 400);
  } catch (e) {
    console.warn("[zito] IA falhou:", e instanceof Error ? e.message : e);
    return json({ ok: false, code: "upstream" }, 502);
  }
}
