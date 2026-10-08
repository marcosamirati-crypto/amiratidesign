import "server-only";
import { getConfig } from "./config";

// Limite de uso em memória. É "melhor esforço": na Vercel cada instância conta sozinha, então serve
// para frear abuso casual e fila, não para garantir um teto exato. Para um teto real de gasto,
// defina também um limite mensal no painel da Anthropic e do buscador.

const hits = new Map<string, number[]>();
let inflight = 0;

function prune(list: number[], now: number, windowMs: number): number[] {
  const fresh = list.filter((t) => now - t < windowMs);
  return fresh;
}

export type Gate = { ok: true; release: () => void } | { ok: false; reason: "rate" | "busy" };

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  return ip.slice(0, 64);
}

/** Registra uma tentativa. Chame uma vez por análise; a trava de concorrência é liberada com release(). */
export function enter(key: string, scale = 1): Gate {
  const c = getConfig();
  const now = Date.now();
  const list = prune(hits.get(key) ?? [], now, c.rateDay.windowMs);
  const recent = list.filter((t) => now - t < c.rateShort.windowMs).length;
  // `scale` multiplica os limites (a reescrita da resposta é mais leve que uma análise).
  if (recent >= c.rateShort.max * scale || list.length >= c.rateDay.max * scale) {
    hits.set(key, list);
    return { ok: false, reason: "rate" };
  }
  if (inflight >= c.maxConcurrent) return { ok: false, reason: "busy" };

  list.push(now);
  hits.set(key, list);
  if (hits.size > 2000) {
    for (const [k, v] of hits) if (prune(v, now, c.rateDay.windowMs).length === 0) hits.delete(k);
  }
  inflight++;
  let released = false;
  return {
    ok: true,
    release: () => {
      if (!released) {
        released = true;
        inflight = Math.max(0, inflight - 1);
      }
    },
  };
}
