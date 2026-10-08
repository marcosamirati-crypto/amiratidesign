// Fala com o servidor da Elle. Nenhuma chave passa por aqui: só o print vai e o resultado volta.

import type { ElleErrorCode, ElleEvent, PersonalizeRequest, PersonalizeResponse, ReplyVariants } from "./types";

/**
 * Envia o print e entrega cada evento (etapa, resultado ou erro) assim que o servidor o emite.
 * Resolve quando o fluxo termina. Sempre termina com um "result" ou um "error".
 */
export async function analyzeImage(blob: Blob, onEvent: (e: ElleEvent) => void, signal: AbortSignal): Promise<void> {
  const body = new FormData();
  body.append("image", blob, "print.jpg");

  let finished = false;
  const emit = (e: ElleEvent) => {
    if (e.type !== "stage") finished = true;
    onEvent(e);
  };

  let res: Response;
  try {
    res = await fetch("/api/elle/analyze", { method: "POST", body, signal });
  } catch (err) {
    if (signal.aborted) return;
    emit({ type: "error", code: "network", message: "network", retryable: true });
    return;
  }

  if (!res.body) {
    emit({ type: "error", code: "unknown", message: "sem corpo", retryable: true });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try {
          emit(JSON.parse(line) as ElleEvent);
        } catch {
          /* linha quebrada: ignora */
        }
      }
    }
  } catch {
    if (signal.aborted) return;
    emit({ type: "error", code: "network", message: "stream", retryable: true });
    return;
  }
  if (!finished && !signal.aborted) {
    // O servidor fechou sem resultado nem erro (ex.: função encerrada pelo limite de tempo).
    emit({ type: "error", code: res.ok ? "timeout" : "unavailable", message: "fim inesperado", retryable: true });
  }
}

export class PersonalizeError extends Error {
  constructor(public code: ElleErrorCode) {
    super(code);
  }
}

export async function personalize(req: PersonalizeRequest, signal: AbortSignal): Promise<ReplyVariants> {
  let res: Response;
  try {
    res = await fetch("/api/elle/personalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal,
    });
  } catch {
    throw new PersonalizeError("network");
  }
  if (!res.ok) {
    const code: ElleErrorCode = res.status === 429 ? "rate_limited" : res.status === 504 ? "timeout" : res.status === 503 ? "unavailable" : "unknown";
    throw new PersonalizeError(code);
  }
  const json = (await res.json()) as PersonalizeResponse;
  return json.replies;
}
