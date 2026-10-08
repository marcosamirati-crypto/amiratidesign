import "server-only";

// Contrato do buscador. Para trocar de provedor, crie um adaptador que implemente SearchProvider
// e registre em search/index.ts. Nada fora desta pasta conhece Tavily ou Brave.

export interface SearchRequest {
  query: string;
  /** Restringe a estes domínios (cobre subdomínios). */
  domains?: string[];
  /** "recent" = últimos meses (fatos atuais); "any" = sem limite (fatos históricos). */
  freshness: "recent" | "any";
  /** Busca em notícias (traz data de publicação com mais frequência). */
  news?: boolean;
  limit: number;
}

export interface RawHit {
  title: string;
  url: string;
  snippet: string;
  /** ISO 8601 quando o provedor informa; null caso contrário. */
  publishedAt: string | null;
  /** 0–1, relevância dada pelo provedor. */
  score: number;
}

export interface SearchProvider {
  id: "tavily" | "brave";
  search(req: SearchRequest, signal: AbortSignal): Promise<RawHit[]>;
}
