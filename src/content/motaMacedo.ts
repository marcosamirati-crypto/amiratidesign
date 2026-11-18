// Conteúdo da one-page da Mota Macedo / MotaSat (rota /mota-macedo). Edite os textos aqui, sem mexer nos componentes.
// `confirm` = ponto que o cliente ainda precisa confirmar; só aparece enquanto `preview` for true.

export const mm = {
  /** true = selo "Prévia" + etiquetas "Confirmar" visíveis. Troque para false ao publicar. */
  preview: true,
  /** false = esconde os valores e mostra "Sob consulta". */
  showPrice: true,
  brand: "Mota Macedo",
  /** Marca do produto, mostrada no logotipo. */
  product: "MotaSat",
  descriptor: "Tecnologia espacial para o agro",
  /** WhatsApp que recebe os pedidos de demonstração (só dígitos, com 55). */
  whatsapp: "5585985191683",
  email: "grupomotamacedo@gmail.com",

  /**
   * Foto de abertura (curvatura da Terra). Coloque o arquivo em /public/mota/ e escreva o caminho aqui,
   * por exemplo "/mota/terra.avif". Vazio = a abertura usa a Terra desenhada em código.
   */
  openingImage: "",

  nav: [
    { label: "Tecnologia", href: "#tecnologia" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Sobre", href: "#sobre" },
    { label: "Contato", href: "#demo" },
  ],

  /** Frase de transição entre a abertura e a apresentação. A palavra em `accent` ganha a cor da marca. */
  statement: { text: "O céu responde a uma pergunta da terra.", accent: "pergunta" },

  hero: {
    eyebrow: "Monitoramento agroclimático por nanossatélite",
    title: ["Sua lavoura vista do espaço.", "Suas decisões com dados."],
    line: "Umidade, clima e nível de água da sua área, acompanhados por uma empresa cearense de tecnologia espacial.",
    cta: "Pedir demonstração",
    caption: "Ilustração: vista de cima de uma área irrigada.",
  },

  problem: {
    label: "O problema",
    title: "No campo, decidir sem dado custa caro.",
    items: [
      { title: "Irrigar no escuro", text: "Água e energia gastas onde o solo ainda estava úmido, e falta onde ele já secou." },
      { title: "Chuva fora de hora", text: "Plantio e colheita marcados pelo calendário, não pelo clima real da sua área." },
      { title: "Água que acaba sem aviso", text: "Açude e reservatório baixando sem que ninguém acompanhe o ritmo." },
    ],
  },

  measures: {
    label: "O que medimos",
    title: ["Três medidas.", "Três decisões melhores."],
    note: "Gráficos ilustrativos. Não representam dados reais.",
    confirm: "Como cada medida é obtida (do espaço ou por sensores no campo) e com que precisão.",
    items: [
      { metric: "Umidade", decision: "Quando e quanto irrigar.", text: "Acompanhe a umidade da sua área e irrigue somente o necessário." },
      { metric: "Clima", decision: "Quando plantar e colher.", text: "Leitura do clima da sua região para planejar as janelas de trabalho." },
      { metric: "Nível de água", decision: "Quanto de água você tem.", text: "Evolução dos seus reservatórios para planejar a safra com segurança." },
    ],
  },

  how: {
    label: "Como funciona",
    title: ["Do contrato ao primeiro relatório.", "Em três passos."],
    steps: [
      { title: "Montagem", text: "Mapeamos a sua área e configuramos o monitoramento para a sua realidade." },
      { title: "Monitoramento", text: "O nanossatélite acompanha a sua área e nossa equipe trata os dados." },
      { title: "Relatório", text: "Você recebe a leitura da sua área e as recomendações, todo mês.", confirm: "Formato e frequência das entregas (relatório, painel, alertas)." },
    ],
  },

  satellite: {
    label: "O nanossatélite",
    name: "MotaSat-1 Araripe",
    line: "Nanossatélite no padrão CubeSat 4U, com protótipo concluído.",
    text: "Quatro unidades do padrão CubeSat, empilhadas num só corpo. O nome vem da Chapada do Araripe, no Ceará.",
    /** Fotos reais do protótipo. Coloque os arquivos em /public/mota/ e liste aqui. Vazio = desenho esquemático. */
    photos: [] as { src: string; alt: string; width: number; height: number }[],
    schematic: "Representação esquemática do padrão 4U. Fotos do protótipo em breve.",
    confirm: "Fotos reais do protótipo.",
  },

  proof: {
    label: "Por que confiar",
    title: "Tecnologia cearense, com lastro.",
    items: [
      { title: "Catálogo da AEB", text: "Empresa cadastrada no Catálogo de Empresas Espaciais da Agência Espacial Brasileira, nível prata." },
      { title: "Universidade Federal do Ceará", text: "Contrato com a UFC.", confirm: "Tipo de contrato e autorização da UFC para ser citada." },
      { title: "Protótipo pronto", text: "Nanossatélite MotaSat-1 Araripe, padrão CubeSat 4U, com protótipo concluído.", confirm: "Foto real do protótipo." },
      { title: "Feito em Fortaleza", text: "Equipe e operação no Ceará, perto de quem produz no Nordeste." },
    ],
    founder: { name: "Matheus Mota", role: "Fundador", quote: "Um pequeno satélite com um grande propósito: conectar o campo ao futuro.", confirm: "Foto e frase do fundador." },
  },

  audience: {
    label: "Para quem",
    title: "Feito para quem vive da terra e da água.",
    items: [
      { title: "Fazendas médias e grandes", text: "Mais controle sobre irrigação, plantio e colheita." },
      { title: "Cooperativas e associações", text: "Uma leitura comum para orientar todos os cooperados." },
      { title: "Perímetros irrigados e gestores de água", text: "Acompanhamento de reservatórios e do uso da água." },
    ],
  },

  pricing: {
    label: "Investimento",
    title: ["Simples de entender.", "Sem letra miúda."],
    confirm: "Se os valores aparecem na página e o que está incluso em cada um.",
    setup: { name: "Montagem", price: "R$ 5.000", note: "Pagamento único.", text: "Mapeamento da área e configuração do monitoramento." },
    monthly: { name: "Acompanhamento", price: "R$ 2.000", note: "Por mês.", text: "Monitoramento contínuo, tratamento dos dados e relatório mensal." },
  },

  faq: {
    label: "Perguntas frequentes",
    title: "O que todo produtor pergunta.",
    items: [
      { q: "Quais regiões vocês atendem?", a: "Nosso foco inicial é o Ceará e o Nordeste.", confirm: "Área de cobertura." },
      { q: "Com que frequência recebo os dados?", a: "Você recebe um relatório mensal da sua área.", confirm: "Frequência de passagem do satélite e de atualização dos dados." },
      { q: "Preciso instalar algum equipamento na fazenda?", a: "A montagem inclui tudo o que for necessário para o monitoramento da sua área.", confirm: "Se há sensores ou equipamentos no campo." },
      { q: "Como funciona o contrato?", a: "Uma taxa de montagem no início e uma mensalidade de acompanhamento.", confirm: "Prazo mínimo e forma de pagamento." },
      { q: "Tenho suporte para entender os relatórios?", a: "Sim. Nossa equipe acompanha você na leitura dos dados e nas recomendações." },
      { q: "Posso cancelar?", a: "Sim.", confirm: "Regras de cancelamento." },
    ],
  },

  final: {
    label: "Demonstração",
    title: "Veja como ficaria na sua área.",
    line: "Preencha e fale diretamente com nossa equipe pelo WhatsApp. Sem compromisso.",
    button: "Pedir demonstração",
  },

  footer: {
    group: "MotaSat é uma empresa do Grupo Mota Macedo.",
    legal: "MOTA MACEDO INOVA SIMPLES (I.S.) · CNPJ 68.525.181/0001-03 · Fortaleza, CE",
    privacy: "Privacidade: os dados do formulário seguem direto pelo seu WhatsApp. Esta página não os armazena.",
    credit: "Página por Amirati",
  },
};
