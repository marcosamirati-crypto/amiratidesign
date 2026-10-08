import "server-only";
import { createHash } from "node:crypto";
import { getConfig } from "../config";
import { ElleError } from "../errors";
import { brave } from "./brave";
import { tavily } from "./tavily";
import type { RawHit, SearchProvider, SearchRequest } from "./types";

export type { RawHit, SearchRequest } from "./types";

export function getSearchProvider(): SearchProvider {
  const c = getConfig();
  if (c.searchProvider === "brave") return brave;
  if (c.searchProvider === "tavily") return tavily;
  throw new ElleError("unavailable", "no search provider", false);
}

// Cache em memória (30 min) e junção de buscas idênticas simultâneas: não pagamos duas vezes pelo mesmo termo.
const TTL_MS = 30 * 60_000;
const MAX_ENTRIES = 300;
const cache = new Map<string, { at: number; hits: RawHit[] }>();
const pending = new Map<string, Promise<RawHit[]>>();

function keyOf(providerId: string, req: SearchRequest): string {
  const raw = JSON.stringify([providerId, req.query.trim().toLowerCase(), [...(req.domains ?? [])].sort(), req.freshness, !!req.news, req.limit]);
  return createHash("sha1").update(raw).digest("hex");
}

/** searchWeb(): uma busca na internet pelo provedor ativo, com cache e sem duplicar chamadas. */
export async function searchWeb(req: SearchRequest, signal: AbortSignal): Promise<RawHit[]> {
  const provider = getSearchProvider();
  const key = keyOf(provider.id, req);

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.hits;

  const inFlight = pending.get(key);
  if (inFlight) return inFlight;

  const p = provider
    .search(req, signal)
    .then((hits) => {
      if (cache.size >= MAX_ENTRIES) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
      cache.set(key, { at: Date.now(), hits });
      return hits;
    })
    .finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}
