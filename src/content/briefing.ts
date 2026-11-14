// Briefing padrão (rota /briefing). Edite as perguntas aqui sem mexer nos componentes.
// Tipos: "text" (resposta curta), "long" (resposta longa), "choice" (uma opção + detalhe opcional),
// "multi" (várias opções + detalhe opcional).

export type BriefingQuestion = {
  id: string;
  kind: "text" | "long" | "choice" | "multi";
  title: string;
  hint: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

export const briefingIntro = {
  label: "/ Briefing",
  title: "Vamos começar pelo que importa.",
  line: "12 perguntas, cerca de 10 minutos. Responda com as suas palavras: frases curtas valem mais que textos perfeitos.",
};

export const briefingQuestions: BriefingQuestion[] = [
  {
    id: "negocio",
    kind: "long",
    title: "O que a sua empresa faz, em uma frase?",
    hint: "Como você explicaria para alguém que nunca ouviu falar dela.",
    placeholder: "Ex.: Fabricamos kits de nanossatélite para escolas e universidades.",
    required: true,
  },
  {
    id: "foco",
    kind: "long",
    title: "Qual produto ou serviço é o foco deste projeto?",
    hint: "Se puder, diga o preço ou a faixa de preço.",
    required: true,
  },
  {
    id: "cliente",
    kind: "long",
    title: "Quem é o seu cliente ideal?",
    hint: "Quem usa, quem decide e quem paga. Às vezes são pessoas diferentes.",
    required: true,
  },
  {
    id: "problema",
    kind: "long",
    title: "Que problema você resolve para esse cliente?",
    hint: "O que acontece com ele se não tiver você.",
  },
  {
    id: "diferencial",
    kind: "long",
    title: "Por que escolhem você e não outra opção?",
    hint: "O que você faz melhor, mais rápido, mais perto ou de um jeito que ninguém faz.",
  },
  {
    id: "concorrentes",
    kind: "long",
    title: "Quem são seus concorrentes ou as alternativas do seu cliente?",
    hint: "Nomes, sites ou perfis. Vale também \"o cliente faz sozinho\".",
  },
  {
    id: "objetivo",
    kind: "choice",
    title: "Qual é o objetivo principal deste projeto?",
    hint: "Escolha o mais importante agora.",
    options: ["Lançar algo novo", "Vender mais", "Reposicionar a marca", "Profissionalizar a imagem", "Outro"],
    required: true,
  },
  {
    id: "sucesso",
    kind: "long",
    title: "Se este projeto der certo, o que muda no seu negócio em 6 meses?",
    hint: "Pense em números, clientes, sensação ou rotina.",
    required: true,
  },
  {
    id: "palavras",
    kind: "text",
    title: "Que três palavras devem descrever a sua marca?",
    hint: "Como você quer ser percebido por quem compra.",
    placeholder: "Ex.: confiável, ousada, próxima",
  },
  {
    id: "referencias",
    kind: "long",
    title: "Que marcas você admira, de qualquer setor, e por quê?",
    hint: "Também vale dizer o que você não quer de jeito nenhum.",
  },
  {
    id: "existente",
    kind: "multi",
    title: "O que já existe hoje?",
    hint: "Marque tudo o que já tem. Se tiver links, cole no campo abaixo.",
    options: ["Logo", "Site", "Instagram", "Apresentação comercial", "Embalagem ou material impresso", "Nada ainda"],
  },
  {
    id: "prazo",
    kind: "choice",
    title: "Qual é o prazo e a faixa de investimento?",
    hint: "Escolha a faixa e diga até quando precisa.",
    options: ["Até R$ 1.500", "R$ 1.500 a R$ 3.000", "R$ 3.000 a R$ 6.000", "Acima de R$ 6.000", "Prefiro conversar"],
    required: true,
  },
];
