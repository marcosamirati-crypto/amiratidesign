import "server-only";

// Configuração da Elle lida das variáveis de ambiente (nunca vão para o navegador).
// Tudo é lido na hora do uso, não no build, para a Vercel poder trocar as chaves sem novo deploy.

export type ElleMode = "live" | "demo" | "off";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function getConfig() {
  const env = process.env;
  const anthropicKey = (env.ANTHROPIC_API_KEY ?? "").trim();
  const tavilyKey = (env.TAVILY_API_KEY ?? "").trim();
  const braveKey = (env.BRAVE_SEARCH_API_KEY ?? "").trim();

  // Troca de buscador sem mexer em código: ELLE_SEARCH_PROVIDER=tavily|brave (padrão: o que tiver chave).
  const wanted = (env.ELLE_SEARCH_PROVIDER ?? "").trim().toLowerCase();
  let searchProvider: "tavily" | "brave" | null = null;
  if (wanted === "brave" && braveKey) searchProvider = "brave";
  else if (wanted === "tavily" && tavilyKey) searchProvider = "tavily";
  else if (tavilyKey) searchProvider = "tavily";
  else if (braveKey) searchProvider = "brave";

  return {
    anthropicKey,
    tavilyKey,
    braveKey,
    searchProvider,
    tavilyBaseUrl: (env.TAVILY_BASE_URL ?? "https://api.tavily.com").replace(/\/+$/, ""),
    braveBaseUrl: (env.BRAVE_BASE_URL ?? "https://api.search.brave.com").replace(/\/+$/, ""),
    // Modelos por etapa, escolhidos pelo custo. Ler o print é tarefa simples (Haiku); a análise pede mais (Sonnet);
    // reescrever a resposta com a opinião da pessoa é curto (Haiku). Para voltar ao mais caro: claude-opus-5-5.
    modelRead: (env.ELLE_MODEL_READ ?? "claude-haiku-5-5").trim(),
    modelWrite: (env.ELLE_MODEL_WRITE ?? "claude-sonnet-5-5").trim(),
    modelPersonalize: (env.ELLE_MODEL_PERSONALIZE ?? "claude-haiku-5-5").trim(),
    // Teto de buscas na internet por análise (cada busca gasta crédito do buscador). Antes: 7.
    maxSearches: Math.min(num(env.ELLE_MAX_SEARCHES, 4), 7),
    enabled: env.ELLE_ENABLED !== "0",
    forceDemo: env.ELLE_DEMO === "1",
    // Limites de uso por pessoa (IP). Melhor esforço: cada instância da Vercel conta sozinha.
    rateShort: { max: num(env.ELLE_RATE_PER_10MIN, 6), windowMs: 10 * 60_000 },
    rateDay: { max: num(env.ELLE_RATE_PER_DAY, 30), windowMs: 24 * 60 * 60_000 },
    maxConcurrent: num(env.ELLE_MAX_CONCURRENT, 6),
    maxImageBytes: 4 * 1024 * 1024,
    // A rota tem maxDuration = 120 s; fica folga para responder o erro com educação e gravar a estatística.
    // Ajustável sem deploy: ELLE_BUDGET_MS (ex.: 54000 para voltar ao limite antigo de 60 s).
    budget: {
      totalMs: Math.min(num(env.ELLE_BUDGET_MS, 110_000), 115_000),
      readMs: 35_000,
      searchMs: 15_000,
      minWriteMs: 14_000,
    },
  };
}

/** live = chave da IA + buscador configurados. demo = só em desenvolvimento (ou ELLE_DEMO=1), sempre rotulado. */
export function getMode(): ElleMode {
  const c = getConfig();
  if (!c.enabled) return "off";
  if (c.forceDemo) return "demo";
  if (c.anthropicKey && c.searchProvider) return "live";
  return process.env.NODE_ENV === "production" ? "off" : "demo";
}

/** Nomes (nunca valores) das variáveis que faltam, para o log do servidor. */
export function missingEnv(): string[] {
  const c = getConfig();
  const out: string[] = [];
  if (!c.anthropicKey) out.push("ANTHROPIC_API_KEY");
  if (!c.searchProvider) out.push("TAVILY_API_KEY (ou BRAVE_SEARCH_API_KEY)");
  return out;
}

/**
 * Contexto eleitoral fornecido pela operação (não vem da memória do modelo).
 * Editar aqui quando o 2º turno acabar ou o cenário mudar.
 */
export const electionContext = {
  label: "Eleição presidencial de 2026, 2º turno (25/10/2026)",
  candidates: [
    {
      id: "flavio",
      name: "Flávio Bolsonaro",
      short: "Flávio",
      party: "PL",
      number: 22,
    },
    {
      id: "lula",
      name: "Luiz Inácio Lula da Silva",
      short: "Lula",
      party: "PT",
      number: 13,
    },
  ],
} as const;
