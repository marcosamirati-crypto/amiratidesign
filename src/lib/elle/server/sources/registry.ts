import "server-only";
import type { CategoryId, ContentKind, SourceTier } from "../../types";
import { hostnameOf } from "../text";

// Catálogo editável de fontes. NÍVEL 1 = oficial/primária, NÍVEL 2 = imprensa de alto nível e checagem,
// NÍVEL 3 = todo o resto (só quando necessário). Para incluir ou tirar um veículo, edite só este arquivo.

interface Known {
  /** Domínio (sem www). Casa também com subdomínios. */
  host: string;
  name: string;
  kind?: ContentKind;
}

const TIER1: Known[] = [
  { host: "tse.jus.br", name: "TSE", kind: "documento" },
  { host: "divulgacandcontas.tse.jus.br", name: "TSE (DivulgaCand)", kind: "plano" },
  { host: "stf.jus.br", name: "STF", kind: "documento" },
  { host: "stj.jus.br", name: "STJ", kind: "documento" },
  { host: "cnj.jus.br", name: "CNJ", kind: "documento" },
  { host: "camara.leg.br", name: "Câmara dos Deputados", kind: "documento" },
  { host: "senado.leg.br", name: "Senado Federal", kind: "documento" },
  { host: "planalto.gov.br", name: "Planalto", kind: "documento" },
  { host: "ibge.gov.br", name: "IBGE", kind: "dados" },
  { host: "bcb.gov.br", name: "Banco Central", kind: "dados" },
  { host: "tesourotransparente.gov.br", name: "Tesouro Nacional", kind: "dados" },
  { host: "tesouro.gov.br", name: "Tesouro Nacional", kind: "dados" },
  { host: "portaldatransparencia.gov.br", name: "Portal da Transparência", kind: "dados" },
  { host: "receita.fazenda.gov.br", name: "Receita Federal", kind: "dados" },
  { host: "ipea.gov.br", name: "Ipea", kind: "dados" },
  { host: "tcu.gov.br", name: "TCU", kind: "documento" },
  { host: "cgu.gov.br", name: "CGU", kind: "documento" },
  { host: "mpf.mp.br", name: "Ministério Público Federal", kind: "documento" },
  { host: "agenciabrasil.ebc.com.br", name: "Agência Brasil", kind: "noticia" },
  { host: "agenciagov.ebc.com.br", name: "Agência Gov", kind: "noticia" },
  { host: "gov.br", name: "gov.br", kind: "documento" },
  // Organismos internacionais oficiais (dados comparáveis).
  { host: "imf.org", name: "FMI", kind: "dados" },
  { host: "worldbank.org", name: "Banco Mundial", kind: "dados" },
  { host: "oecd.org", name: "OCDE", kind: "dados" },
  { host: "un.org", name: "ONU", kind: "documento" },
];

const TIER2: Known[] = [
  { host: "reuters.com", name: "Reuters" },
  { host: "apnews.com", name: "AP" },
  { host: "bbc.com", name: "BBC" },
  { host: "bbc.co.uk", name: "BBC" },
  { host: "ft.com", name: "Financial Times" },
  { host: "nytimes.com", name: "The New York Times" },
  { host: "washingtonpost.com", name: "The Washington Post" },
  { host: "theguardian.com", name: "The Guardian" },
  { host: "elpais.com", name: "El País" },
  { host: "lemonde.fr", name: "Le Monde" },
  { host: "folha.uol.com.br", name: "Folha" },
  { host: "estadao.com.br", name: "Estadão" },
  { host: "oglobo.globo.com", name: "O Globo" },
  { host: "g1.globo.com", name: "g1" },
  { host: "valor.globo.com", name: "Valor Econômico" },
  { host: "cnnbrasil.com.br", name: "CNN Brasil" },
  { host: "poder360.com.br", name: "Poder360" },
  { host: "nexojornal.com.br", name: "Nexo" },
  { host: "correiobraziliense.com.br", name: "Correio Braziliense" },
  { host: "brasil.elpais.com", name: "El País Brasil" },
  { host: "aosfatos.org", name: "Aos Fatos", kind: "checagem" },
  { host: "lupa.news", name: "Agência Lupa", kind: "checagem" },
  { host: "apublica.org", name: "Agência Pública" },
  { host: "uol.com.br", name: "UOL" },
  { host: "dw.com", name: "Deutsche Welle" },
  { host: "afp.com", name: "AFP" },
  { host: "economist.com", name: "The Economist" },
  { host: "publico.pt", name: "Público" },
  { host: "projetocomprova.com.br", name: "Projeto Comprova", kind: "checagem" },
  { host: "checamos.afp.com", name: "AFP Checamos", kind: "checagem" },
];

// Sufixos oficiais: qualquer *.gov.br, *.jus.br, *.leg.br, *.mp.br, *.mil.br.
const OFFICIAL_SUFFIXES = [".gov.br", ".jus.br", ".leg.br", ".mp.br", ".mil.br"];

function matchKnown(host: string, list: Known[]): Known | undefined {
  // Prefere o domínio mais específico (mais longo) que case.
  let best: Known | undefined;
  for (const k of list) {
    if (host === k.host || host.endsWith(`.${k.host}`)) {
      if (!best || k.host.length > best.host.length) best = k;
    }
  }
  return best;
}

export interface SourceInfo {
  name: string;
  tier: SourceTier;
  kind: ContentKind;
  host: string;
}

/** Sinais de que a página é opinião/coluna/editorial, e não reportagem. */
function looksLikeOpinion(url: string, title: string): boolean {
  return /\/(opiniao|opinion|colunas?|columnistas?|blogs?|editorial|artigos?|analise-opiniao)\//i.test(url) ||
    /^(opini[aã]o|editorial|coluna)\b/i.test(title.trim());
}

function looksLikeFactCheck(url: string, title: string): boolean {
  return /(fact-?check|checagem|e-fato-ou-fake|\/fato-ou-fake\/|verificamos)/i.test(url) ||
    /^(verificamos|checagem|[eé] falso|[eé] verdade)/i.test(title.trim());
}

export function classifySource(url: string, title = ""): SourceInfo | null {
  const host = hostnameOf(url);
  if (!host) return null;

  const t1 = matchKnown(host, TIER1);
  const officialSuffix = OFFICIAL_SUFFIXES.some((s) => host.endsWith(s));
  if (t1 || officialSuffix) {
    const isPdf = /\.pdf($|\?)/i.test(url);
    return {
      name: t1?.name ?? host,
      tier: 1,
      kind: isPdf ? "documento" : (t1?.kind ?? "documento"),
      host,
    };
  }

  const t2 = matchKnown(host, TIER2);
  if (t2) {
    const kind: ContentKind =
      t2.kind === "checagem" || looksLikeFactCheck(url, title)
        ? "checagem"
        : looksLikeOpinion(url, title)
          ? "opiniao"
          : "noticia";
    return { name: t2.name, tier: 2, kind, host };
  }

  return {
    name: host,
    tier: 3,
    kind: looksLikeOpinion(url, title) ? "opiniao" : "desconhecido",
    host,
  };
}

// Onde procurar a fonte primária conforme o eixo do debate.
const PRIMARY_BY_TOPIC: Record<CategoryId | "plano" | "geral", string[]> = {
  economia: [
    "ibge.gov.br", "bcb.gov.br", "tesourotransparente.gov.br", "tesouro.gov.br", "ipea.gov.br",
    "gov.br", "camara.leg.br", "senado.leg.br", "planalto.gov.br", "tcu.gov.br", "imf.org", "worldbank.org", "oecd.org",
  ],
  corrupcao: [
    "stf.jus.br", "stj.jus.br", "tse.jus.br", "cnj.jus.br", "mpf.mp.br", "tcu.gov.br", "cgu.gov.br",
    "gov.br", "camara.leg.br", "senado.leg.br", "planalto.gov.br",
  ],
  liberdade: [
    "stf.jus.br", "stj.jus.br", "tse.jus.br", "camara.leg.br", "senado.leg.br", "planalto.gov.br", "gov.br", "ibge.gov.br",
  ],
  valores: [
    "stf.jus.br", "camara.leg.br", "senado.leg.br", "planalto.gov.br", "gov.br", "ibge.gov.br", "tse.jus.br",
  ],
  plano: ["tse.jus.br", "divulgacandcontas.tse.jus.br"],
  geral: ["gov.br", "stf.jus.br", "camara.leg.br", "senado.leg.br", "planalto.gov.br", "tse.jus.br", "ibge.gov.br", "bcb.gov.br"],
};

/** Domínios de NÍVEL 1 para procurar, juntando os eixos pedidos (sem repetição). */
export function getPrimarySources(topics: Array<CategoryId | "plano" | "geral">): string[] {
  const set = new Set<string>();
  for (const t of topics.length ? topics : (["geral"] as const)) {
    for (const d of PRIMARY_BY_TOPIC[t]) set.add(d);
  }
  return [...set];
}

/** Domínios de NÍVEL 2 (imprensa de alto nível e checagem). */
export function getNewsSources(): string[] {
  return [...new Set(TIER2.map((k) => k.host))];
}
