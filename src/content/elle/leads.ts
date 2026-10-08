import type { CategoryId } from "@/lib/elle/types";

// Pistas de pesquisa sobre Flávio Bolsonaro por eixo, tiradas do guia "Como debater política nos
// comentários" (@Amirati, 08/10/2026). O guia pede: "confirme antes de usar".
//
// IMPORTANTE: isto são SÓ perguntas de busca, não afirmações. A Elle pesquisa, e só entra na resposta
// o que fontes reais encontradas confirmarem (e só se for pertinente ao tema do comentário).
// Nenhuma frase daqui é mostrada como fato. Edite à vontade: troque, acrescente ou apague.

export const flavioLeads: Record<CategoryId, string[]> = {
  corrupcao: [
    "Flávio Bolsonaro inquérito STF Vorcaro filme Dark Horse",
    "Flávio Bolsonaro caso rachadinhas Alerj arquivamento",
  ],
  economia: [
    "Flávio Bolsonaro presença votações nominais Senado 2026",
    "Flávio Bolsonaro projetos de lei apresentados e aprovados Senado",
  ],
  valores: [
    "TSE ordem Flávio Bolsonaro apagar publicações Lula igrejas 2022",
    "TSE multa Flávio Bolsonaro vídeo Lula 2023",
  ],
  liberdade: [
    "Flávio Bolsonaro Medalha Tiradentes Adriano da Nóbrega",
    "Flávio Bolsonaro declaração Jair Bolsonaro condenação trama golpista",
  ],
};
