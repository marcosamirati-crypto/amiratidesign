import { CATEGORY_IDS, type CategoryId, type FactStatus, type PersonalizeRequest, type PersonalizeResponse } from "@/lib/elle/types";
import { getMode } from "@/lib/elle/server/config";
import { demoPersonalize } from "@/lib/elle/server/demo";
import { personalizeReply } from "@/lib/elle/server/debate";
import { toElleError } from "@/lib/elle/server/errors";
import { clientKey, enter } from "@/lib/elle/server/ratelimit";

// Reescreve a resposta sugerida com a opinião que a pessoa digitou. Sem busca nova: usa só a análise já feita.
export const maxDuration = 45;
export const dynamic = "force-dynamic";

const STATUSES: FactStatus[] = ["confirmado", "provavel", "nao_confirmado", "contestado"];
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function parseBody(v: unknown): PersonalizeRequest | null {
  if (typeof v !== "object" || v === null) return null;
  const o = v as Record<string, unknown>;
  const opinion = str(o.opinion, 1200).trim();
  if (opinion.length < 3) return null;
  const facts = (Array.isArray(o.facts) ? o.facts : [])
    .slice(0, 6)
    .map((f) => {
      const x = (f ?? {}) as Record<string, unknown>;
      return { text: str(x.text, 300), status: STATUSES.includes(x.status as FactStatus) ? (x.status as FactStatus) : "nao_confirmado" };
    })
    .filter((f) => f.text);
  const categories = (Array.isArray(o.categories) ? o.categories : [])
    .filter((c): c is CategoryId => (CATEGORY_IDS as readonly string[]).includes(c as string))
    .slice(0, 3);
  return {
    opinion,
    transcript: str(o.transcript, 1500),
    summary: str(o.summary, 400),
    categories,
    facts,
    counter_argument: str(o.counter_argument, 500),
    standard_response: str(o.standard_response, 400),
    source_name: str(o.source_name, 60).trim() || null,
  };
}

export async function POST(req: Request): Promise<Response> {
  const mode = getMode();
  if (mode === "off") return Response.json({ error: "unavailable" }, { status: 503 });

  const gate = enter(`${clientKey(req)}:p`, 4);
  if (!gate.ok) return Response.json({ error: "rate_limited" }, { status: 429 });

  try {
    const body = parseBody(await req.json().catch(() => null));
    if (!body) return Response.json({ error: "bad_request" }, { status: 400 });

    if (mode === "demo") {
      const res: PersonalizeResponse = { replies: await demoPersonalize(body.opinion) };
      return Response.json(res, { headers: { "Cache-Control": "no-store" } });
    }

    const replies = await personalizeReply(body, AbortSignal.any([req.signal, AbortSignal.timeout(38_000)]));
    const res: PersonalizeResponse = { replies };
    return Response.json(res, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const err = toElleError(e);
    console.error("[elle] personalizar falhou:", err.code, err.message);
    const status = err.code === "timeout" ? 504 : err.code === "unavailable" ? 503 : 500;
    return Response.json({ error: err.code }, { status });
  } finally {
    gate.release();
  }
}
