#!/usr/bin/env node
// SERVIDOR DE TESTE da Elle — só para desenvolvimento. Nunca vai para produção e nada aqui é dado real.
//
// Imita a API da Anthropic (POST /v1/messages) e a do Tavily (POST /search) para exercitar o código REAL
// da Elle (leitura, buscas, planos, conferência, tela) sem gastar créditos nem precisar de chaves.
// As respostas "do modelo" trazem erros de propósito (fonte inventada, número que não existe nas fontes,
// citação falsa, link/emoji na resposta) para provar que a trava de conferência os barra.
//
// Uso:
//   node scripts/elle-fake-apis.mjs            (porta 4010)
//   e, em outro terminal, o site com:
//   ANTHROPIC_API_KEY=teste ANTHROPIC_BASE_URL=http://localhost:4010 TAVILY_API_KEY=teste TAVILY_BASE_URL=http://localhost:4010 npm run dev
//
// Controles: POST /__mode {"anthropic":"ok|429|500|slow|bad-json","tavily":"ok|401|500|empty","flavio":"plan|bad"}
//            GET  /__log  -> últimas requisições recebidas (para conferir o que a Elle enviou)

import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 4010);
const mode = { anthropic: "ok", tavily: "ok", flavio: "plan", nonce: "", delay: 0 }; // nonce: muda o termo da busca e fura o cache da Elle
const log = [];

const read = (req) =>
  new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => resolve(b));
  });

const json = (res, status, obj) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
};

const message = (obj) => ({
  id: "msg_fake",
  type: "message",
  role: "assistant",
  model: "fake",
  content: [{ type: "text", text: JSON.stringify(obj) }],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 10, output_tokens: 10 },
});

// ───────── "Leitura do print" ─────────
const READING = {
  legibility: "alta",
  legibility_notes: [],
  raw_text: "usuario_teste Esse governo acabou com os impostos. Agora ninguém mais paga nada neste país, só quem trabalha continua sendo roubado.",
  focus_comment: "Esse governo acabou com os impostos. Agora ninguém mais paga nada neste país, só quem trabalha continua sendo roubado.",
  platform: "instagram",
  visible_context: "",
  claims: [
    { text: "Esse governo acabou com os impostos", type: "factual", checkable: true },
    { text: "Só quem trabalha continua sendo roubado", type: "opiniao", checkable: false },
  ],
  entities: ["governo", "impostos"],
  topics: ["economia"],
  mentions: [],
  has_argument: true,
  numbers_and_dates: [],
  research_questions: [
    { query: "carga tributária Brasil série histórica", kind: "dados", freshness: "recent" },
    { query: "governo eliminou impostos reforma tributária", kind: "noticia", freshness: "recent" },
  ],
  is_political: true,
};

// ───────── Resultados de busca (fixtures) ─────────
function searchResults(body) {
  const q = String(body.query ?? "");
  const domains = body.include_domains ?? [];
  const wantsOfficial = domains.some((d) => /gov\.br|jus\.br/.test(d));
  const FIX = "[TESTE FIXTURE]";
  if (wantsOfficial) {
    return [
      { title: `${FIX} Carga tributária bruta, série anual`, url: "https://www.gov.br/tesouronacional/pt-br/teste-elle-1?utm_source=x", content: `A carga tributária bruta ficou em 31,2% do PIB no ano de referência, segundo a série oficial usada neste teste, acima do ano anterior. Consulta: ${q}.`, score: 0.92 },
      { title: `${FIX} Estatísticas do IBGE`, url: "https://www.ibge.gov.br/teste-elle-2", content: "O IBGE informa que o IPCA acumulado em doze meses ficou em 4,5% neste texto de teste, dentro do intervalo da meta definido pelo Conselho Monetário Nacional.", score: 0.81 },
      { title: `${FIX} Duplicada da primeira`, url: "https://gov.br/tesouronacional/pt-br/teste-elle-1", content: "A carga tributária bruta ficou em 31,2% do PIB no ano de referência (mesma página, outro endereço).", score: 0.5 },
    ];
  }
  return [
    { title: `${FIX} Governo mudou impostos, mas não acabou com eles`, url: "https://www.reuters.com/world/americas/teste-elle-3", content: "A reportagem de teste descreve que a reforma alterou regras de tributos sobre o consumo, sem eliminar impostos, e que a arrecadação seguiu em alta no período analisado.", score: 0.88 },
    { title: `${FIX} Coluna: opinião sobre impostos`, url: "https://www1.folha.uol.com.br/opiniao/2026/10/teste-elle-4.shtml", content: "Esta coluna de opinião de teste defende que a carga é excessiva e que o debate deveria ser outro, sem apresentar números verificáveis.", score: 0.7 },
    { title: `${FIX} Postagem em blog sem fonte`, url: "https://blog-qualquer.com.br/post-teste-elle-5", content: "Um blog qualquer de teste afirma que a carga tributária é a maior da história, sem citar a fonte dos dados nem a data.", score: 0.6 },
  ];
}

// ───────── "Síntese do modelo": com erros de propósito ─────────
function synth(userText) {
  const tags = [...userText.matchAll(/<e id="(E\d+)" nivel="(\d)" fonte="([^"]*)" tipo="([^"]*)" titulo="([^"]*)"[^>]*>([^<]*)<\/e>/g)].map((m) => ({
    id: m[1], tier: Number(m[2]), source: m[3], kind: m[4], title: m[5], text: m[6].trim(),
  }));
  const t1 = tags.find((t) => t.tier === 1 && t.kind !== "plano");
  const t2 = tags.find((t) => t.tier === 2);
  const t3 = tags.find((t) => t.tier === 3);
  const planFlavio = tags.find((t) => t.kind === "plano" && /fl[aá]vio/i.test(t.title));
  const anyPlan = tags.find((t) => t.kind === "plano");
  const num = (t) => (t?.text.match(/\d+[,.]\d+/)?.[0]) ?? null;
  const facts = [];

  if (t1) {
    facts.push({ text: `Pela série oficial consultada, a carga tributária bruta foi de ${num(t1) ?? "n/d"}% do PIB.`, about: "mundo", status: "confirmado", evidence_ids: [t1.id], quote: t1.text.slice(0, 70) });
    facts.push({ text: "Fato com citação inventada (a citação deve ser removida, o fato fica).", about: "mundo", status: "confirmado", evidence_ids: [t1.id], quote: "esta frase não existe em nenhuma fonte de teste de verdade" });
  }
  facts.push({ text: "Fato com fonte inventada (deve ser descartado).", about: "mundo", status: "confirmado", evidence_ids: ["E99"], quote: "" });
  if (t2) facts.push({ text: "Fato com número que as fontes não trazem: 7,9% (deve ser descartado).", about: "mundo", status: "confirmado", evidence_ids: [t2.id], quote: "" });
  if (t3) facts.push({ text: "Fato citando só blog (confirmado deve virar provável).", about: "mundo", status: "confirmado", evidence_ids: [t3.id], quote: "" });
  if (anyPlan) facts.push({ text: "A economia vai crescer muito (afirmação solta, sem atribuir ao documento: deve ser descartada).", about: "mundo", status: "confirmado", evidence_ids: [anyPlan.id], quote: "" });
  facts.push({ text: "O comentário diz que todos os impostos acabaram. As fontes não confirmam isso.", about: "comentario", status: "nao_confirmado", evidence_ids: [], quote: "" });

  let flavio;
  if (mode.flavio === "plan" && planFlavio) {
    flavio = { applicable: true, text: "O plano de governo registrado no TSE traz propostas sobre este tema (teste).", evidence_ids: [planFlavio.id], other_side_text: "", other_side_evidence_ids: [] };
  } else {
    // Cita uma fonte que NÃO fala dele: a trava deve remover o bloco.
    flavio = { applicable: true, text: "Fato sobre Flávio citando fonte que não o menciona (deve ser removido).", evidence_ids: t1 ? [t1.id] : [], other_side_text: "", other_side_evidence_ids: [] };
  }

  return {
    summary: "Esse comentário afirma que houve eliminação generalizada de impostos.",
    categories: ["economia", "liberdade", "economia"],
    debate_guide: "Vale separar reduzir, criar, alterar e eliminar imposto. O comentário erra ao falar em eliminação geral.",
    facts,
    opinions: ["A ideia de que a carga é injusta é um julgamento, não um dado."],
    counter_argument: { text: "Quem concorda pode dizer que a carga continua alta mesmo sem eliminação de impostos.", evidence_ids: t1 ? [t1.id] : [] },
    flavio_fact: flavio,
    responses: {
      standard: "Reduzir um imposto não é acabar com imposto 😀 Veja https://exemplo.com/fonte #impostos. Economia se mede pela série, não pela manchete: a carga tributária bruta ficou em mais de 31% do PIB no período e o debate precisa olhar o conjunto, ano a ano, antes de falar em eliminação de impostos, porque tem diferença grande.",
      short: "Reduzir um imposto não é acabar com imposto. Olhe a carga total, ano a ano, antes de concluir qualquer coisa sobre o tema, por favor.",
    },
    follow_ups: ["Tréplica um curta.", "Tréplica dois curta.", "Tréplica três que deve ser cortada por passar do limite de duas."],
    reply_advice: { recommended: true, note: "" },
    uncertainties: ["Só consegui fontes parciais para o período mais recente."],
  };
}

const personalize = (userText) => ({
  standard: "Concordo que a discussão tem que olhar a carga total. Reduzir um imposto não é acabar com imposto, e o número de 99% inventado deve sair. Fonte: teste.",
  short: "Olhe a carga total, ano a ano.",
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const raw = await read(req);

  if (url.pathname === "/__mode" && req.method === "POST") {
    Object.assign(mode, JSON.parse(raw || "{}"));
    return json(res, 200, mode);
  }
  if (url.pathname === "/__log") return json(res, 200, { mode, log: log.slice(-12) });

  if (url.pathname === "/v1/messages" && req.method === "POST") {
    const body = JSON.parse(raw);
    const system = typeof body.system === "string" ? body.system : JSON.stringify(body.system);
    const content = body.messages?.[0]?.content;
    const userText = Array.isArray(content) ? content.filter((b) => b.type === "text").map((b) => b.text).join("\n") : String(content ?? "");
    const kind = system.includes("módulo de leitura") ? "read" : system.includes("companheira de pesquisa") ? "write" : "personalize";
    log.push({ at: new Date().toISOString(), api: "anthropic", kind, model: body.model, hasImage: Array.isArray(content) && content.some((b) => b.type === "image"), effort: body.output_config?.effort, user: userText.slice(0, 6000) });

    if (mode.delay) await new Promise((r) => setTimeout(r, mode.delay)); // simula a demora de uma IA de verdade
    if (mode.anthropic === "429") return json(res, 429, { type: "error", error: { type: "rate_limit_error", message: "slow down" } });
    if (mode.anthropic === "500") return json(res, 500, { type: "error", error: { type: "api_error", message: "boom" } });
    if (mode.anthropic === "slow") await new Promise((r) => setTimeout(r, 70_000));
    if (mode.anthropic === "bad-json") return json(res, 200, { ...message({}), content: [{ type: "text", text: "isto nao e json" }] });

    if (kind === "read") {
      const r = { ...READING, research_questions: READING.research_questions.map((q) => ({ ...q, query: `${q.query} ${mode.nonce}`.trim() })) };
      return json(res, 200, message(r));
    }
    if (kind === "write") return json(res, 200, message(synth(userText)));
    return json(res, 200, message(personalize(userText)));
  }

  if (url.pathname === "/search" && req.method === "POST") {
    const body = JSON.parse(raw);
    log.push({ at: new Date().toISOString(), api: "tavily", query: body.query, topic: body.topic, domains: (body.include_domains ?? []).length, auth: req.headers.authorization ? "sim" : "não" });
    if (mode.delay) await new Promise((r) => setTimeout(r, mode.delay));
    if (mode.tavily === "401") return json(res, 401, { detail: "unauthorized" });
    if (mode.tavily === "500") return json(res, 500, { detail: "boom" });
    if (mode.tavily === "empty") return json(res, 200, { results: [] });
    return json(res, 200, { results: searchResults(body) });
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => console.log(`[elle-fake-apis] ouvindo em http://localhost:${PORT} (somente teste)`));
