import "server-only";
import type { Analysis, ElleEvent, ReplyVariants, StageId } from "../types";

// MODO DE DEMONSTRAÇÃO — só para desenvolvimento (ou ELLE_DEMO=1), sempre rotulado na interface.
// Nada aqui foi pesquisado: é um exemplo fixo para ver o desenho da resposta sem chaves de API.
// Os textos descrevem o que apareceria; não afirmam nenhum fato real sobre pessoas ou números.

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(t), reject(new Error("abort"))), { once: true });
  });

export const demoAnalysis: Analysis = {
  mode: "demo",
  transcript: "Esse governo acabou com os impostos.",
  reading: { confidence: "alta", notes: [] },
  summary: "Esse comentário afirma que houve eliminação generalizada de impostos.",
  categories: ["economia", "liberdade"],
  debate_guide:
    "Antes de responder, vale separar reduzir, criar, alterar e eliminar imposto. É a diferença entre um imposto específico e a carga tributária como um todo.",
  facts: [
    {
      text: "Exemplo: aqui entraria um dado oficial sobre a carga tributária, com o órgão que o mede ao lado.",
      status: "confirmado",
      about: "mundo",
      source_ids: ["1"],
    },
    {
      text: "Exemplo: aqui entraria o que a imprensa de alto nível relatou, marcado como provável quando falta fonte primária.",
      status: "provavel",
      about: "mundo",
      source_ids: ["2"],
    },
    {
      text: "O comentário diz que todos os impostos acabaram. Neste exemplo, nenhuma fonte confirma isso.",
      status: "nao_confirmado",
      about: "comentario",
      source_ids: [],
    },
  ],
  opinions: ["A conclusão de que determinada política é boa ou ruim depende de julgamento, não de dado."],
  counter_argument: {
    text: "Exemplo: aqui entraria o principal argumento contrário, de forma racional e sem atacar quem comentou.",
    source_ids: [],
  },
  flavio_fact: {
    text: "Exemplo: aqui entraria um fato verificável sobre Flávio, ligado ao tema do comentário e sempre com fonte.",
    source_ids: ["1"],
    other_side: { text: "Exemplo: e, quando houver, o que consta no plano de Lula sobre o mesmo tema.", source_ids: ["1"] },
  },
  sources: [
    { id: "1", name: "Fonte de exemplo", title: "Aqui apareceria o título do documento oficial", url: null, published_at: null, tier: 1, kind: "documento" },
    { id: "2", name: "Veículo de exemplo", title: "Aqui apareceria o título da reportagem", url: null, published_at: null, tier: 2, kind: "noticia" },
  ],
  responses: {
    standard:
      "Tem uma diferença entre reduzir um imposto específico e acabar com imposto em geral. Economia se mede pela série, não pela manchete: vale olhar a carga total.",
    short: "Reduzir um imposto não é acabar com imposto. Olhe a carga total, ano a ano.",
    with_source: "Reduzir um imposto não é acabar com imposto. Economia se mede pela série, não pela manchete. Fonte: Fonte de exemplo",
  },
  follow_ups: ["Exemplo de tréplica curta, só com fatos já verificados."],
  reply_advice: { recommended: true, note: "" },
  uncertainties: ["Modo de demonstração: nenhuma pesquisa foi feita e nenhum dado aqui é real."],
  searched: { searches: 0, pages: 0, plans: false },
};

export async function runDemo(emit: (e: ElleEvent) => void, signal: AbortSignal): Promise<void> {
  const stages: StageId[] = ["reading", "understood", "searching", "comparing"];
  for (const stage of stages) {
    emit({ type: "stage", stage, demo: true });
    await sleep(1100, signal);
  }
  emit({ type: "result", analysis: demoAnalysis });
}

export async function demoPersonalize(opinion: string): Promise<ReplyVariants> {
  // Texto de exemplo que deixa claro que não é uma resposta escrita pela IA.
  const quoted = opinion.replace(/\s+/g, " ").slice(0, 60);
  return {
    standard: `Exemplo de demonstração: aqui a Elle reescreveria a sua resposta a partir do que você escreveu ("${quoted}") e dos fatos verificados.`,
    short: "Exemplo de demonstração: versão curta da sua resposta.",
    with_source: null,
  };
}
