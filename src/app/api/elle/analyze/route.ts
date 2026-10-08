import { elleCopy } from "@/content/elle/copy";
import type { ElleErrorCode, ElleEvent } from "@/lib/elle/types";
import { getConfig, getMode, missingEnv } from "@/lib/elle/server/config";
import { runDemo } from "@/lib/elle/server/demo";
import { toElleError } from "@/lib/elle/server/errors";
import { ndjsonResponse } from "@/lib/elle/server/ndjson";
import { runAnalysis } from "@/lib/elle/server/pipeline";
import { clientKey, enter } from "@/lib/elle/server/ratelimit";
import type { ImageInput } from "@/lib/elle/server/vision";

// Recebe o print, devolve as etapas reais da pesquisa em fluxo (NDJSON) e, no fim, o resultado.
// A chave da IA e a do buscador só existem aqui, no servidor. O print não é gravado em lugar nenhum.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const messageFor = (code: ElleErrorCode): string => {
  const e = elleCopy.errors[code];
  return typeof e === "string" ? e : e.title;
};

function failure(code: ElleErrorCode, status: number, retryable = true): Response {
  const event: ElleEvent = { type: "error", code, message: messageFor(code), retryable };
  return new Response(`${JSON.stringify(event)}\n`, {
    status,
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Descobre o tipo pelos primeiros bytes; não confia no que o navegador diz. */
function sniff(buf: Uint8Array): ImageInput["mediaType"] | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
    return "image/webp";
  }
  return null;
}

export async function POST(req: Request): Promise<Response> {
  const mode = getMode();
  if (mode === "off") {
    console.warn("[elle] desligada ou sem chaves:", missingEnv().join(", ") || "ELLE_ENABLED=0");
    return failure("unavailable", 503, false);
  }

  const gate = enter(clientKey(req));
  if (!gate.ok) return failure("rate_limited", 429);

  let image: ImageInput;
  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) throw new Error("sem arquivo");
    if (file.size > getConfig().maxImageBytes) {
      gate.release();
      return failure("too_large", 413, false);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mediaType = sniff(bytes);
    if (!mediaType) {
      gate.release();
      return failure("unsupported", 415, false);
    }
    image = { mediaType, base64: Buffer.from(bytes).toString("base64") };
  } catch {
    gate.release();
    return failure("bad_request", 400);
  }

  return ndjsonResponse(
    req,
    async (emit, signal) => {
      try {
        if (mode === "demo") await runDemo(emit, signal);
        else await runAnalysis({ image, signal, emit });
      } catch (e) {
        const err = toElleError(e);
        // Log só do tipo do erro: nunca do conteúdo do print.
        console.error("[elle] falha:", err.code, err.message);
        if (!signal.aborted) emit({ type: "error", code: err.code, message: messageFor(err.code), retryable: err.retryable });
      }
    },
    gate.release,
  );
}
