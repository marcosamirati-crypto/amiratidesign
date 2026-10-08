import "server-only";
import { getConfig } from "../config";
import { ElleError } from "../errors";
import { stripTags } from "../text";
import type { RawHit, SearchProvider, SearchRequest } from "./types";

interface BraveResult {
  title?: string;
  url?: string;
  description?: string;
  extra_snippets?: string[];
  page_age?: string;
  age?: string;
}

function toIso(v: string | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const brave: SearchProvider = {
  id: "brave",
  async search(req: SearchRequest, signal: AbortSignal): Promise<RawHit[]> {
    const c = getConfig();
    // A Brave não tem filtro de domínio; usamos o operador site: dentro da consulta.
    const sites = req.domains?.length ? ` (${req.domains.slice(0, 12).map((d) => `site:${d}`).join(" OR ")})` : "";
    const params = new URLSearchParams({
      q: `${req.query}${sites}`,
      count: String(Math.min(req.limit, 10)),
      country: "br",
      search_lang: "pt",
      extra_snippets: "true",
    });
    if (req.freshness === "recent") params.set("freshness", "py");

    const res = await fetch(`${c.braveBaseUrl}/res/v1/web/search?${params}`, {
      headers: { Accept: "application/json", "X-Subscription-Token": c.braveKey },
      signal,
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) throw new ElleError("unavailable", "brave auth", false);
    if (!res.ok) throw new ElleError("search_failed", `brave ${res.status}`);

    const json = (await res.json()) as { web?: { results?: BraveResult[] } };
    const out: RawHit[] = [];
    const results = json.web?.results ?? [];
    results.forEach((r, i) => {
      if (!r.url || !r.title) return;
      const snippet = [r.description, ...(r.extra_snippets ?? [])].filter(Boolean).map((s) => stripTags(s as string)).join(" ");
      out.push({
        title: stripTags(r.title),
        url: r.url,
        snippet,
        publishedAt: toIso(r.page_age),
        // A Brave não dá nota; usamos a posição como aproximação.
        score: Math.max(0.2, 1 - i * 0.08),
      });
    });
    return out;
  },
};
