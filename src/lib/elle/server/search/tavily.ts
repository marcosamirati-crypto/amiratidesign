import "server-only";
import { getConfig } from "../config";
import { ElleError } from "../errors";
import type { RawHit, SearchProvider, SearchRequest } from "./types";

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  published_date?: string;
}

function toIso(v: string | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const tavily: SearchProvider = {
  id: "tavily",
  async search(req: SearchRequest, signal: AbortSignal): Promise<RawHit[]> {
    const c = getConfig();
    const body: Record<string, unknown> = {
      query: req.query,
      search_depth: "basic",
      topic: req.news ? "news" : "general",
      max_results: Math.min(req.limit, 8),
      include_answer: false,
      include_raw_content: false,
    };
    if (req.domains?.length) body.include_domains = req.domains;
    if (req.news) body.days = req.freshness === "recent" ? 90 : 1095;
    else if (req.freshness === "recent") body.time_range = "year";

    const res = await fetch(`${c.tavilyBaseUrl}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.tavilyKey}` },
      body: JSON.stringify(body),
      signal,
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) throw new ElleError("unavailable", "tavily auth", false);
    if (!res.ok) throw new ElleError("search_failed", `tavily ${res.status}`);

    const json = (await res.json()) as { results?: TavilyResult[] };
    const out: RawHit[] = [];
    for (const r of json.results ?? []) {
      if (!r.url || !r.title) continue;
      out.push({
        title: r.title,
        url: r.url,
        snippet: r.content ?? "",
        publishedAt: toIso(r.published_date),
        score: typeof r.score === "number" ? r.score : 0.5,
      });
    }
    return out;
  },
};
