import "server-only";
import type { ElleEvent } from "../types";

/**
 * Resposta em fluxo (uma linha JSON por evento). A interface lê as etapas à medida que acontecem.
 * `run` recebe emit() e um sinal que aborta quando a pessoa cancela ou fecha a página.
 */
export function ndjsonResponse(
  req: Request,
  run: (emit: (e: ElleEvent) => void, signal: AbortSignal) => Promise<void>,
  onDone?: () => void,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (e: ElleEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
        } catch {
          closed = true;
        }
      };
      try {
        await run(emit, req.signal);
      } finally {
        onDone?.();
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            /* já fechado pelo cliente */
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
