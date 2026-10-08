// Toda a copy da Elle fica aqui — edite sem mexer nos componentes.
// Voz: calma, curiosa, objetiva; nunca arrogante, nunca partidária.

import type { CategoryId, ElleErrorCode, FactStatus, StageId } from "@/lib/elle/types";

export const elleCopy = {
  brand: "ELLE",
  tagline: "Assistente de debates online",
  home: {
    line1: "Envie um print.",
    line2: "A Elle pesquisa o contexto.",
    action: "Enviar um print",
    hintDesktop: "Ou arraste a imagem para cá, ou cole com Ctrl+V.",
    hintTouch: "Ou cole a imagem aqui.",
    camera: "Usar a câmera",
    privacy: "Seu print é usado apenas para realizar a análise.",
    privacyDetail:
      "Ele é enviado ao serviço de IA que o lê e a Elle não guarda a imagem.",
    drop: "Solte o print aqui",
    orbLabel: "Conhecer a Elle",
  },
  preview: {
    title: "Esse é o print?",
    alt: "Prévia do print enviado",
    swap: "Trocar imagem",
    cancel: "Cancelar",
    go: "Investigar com a Elle",
  },
  thinking: {
    title: "A Elle está investigando…",
    cancel: "Cancelar",
    demo: "Modo de demonstração: nada está sendo pesquisado.",
  },
  stages: {
    reading: "Lendo o comentário…",
    understood: "Separando opinião de afirmação…",
    searching: "Procurando fontes…",
    plans: "Consultando propostas…",
    comparing: "Comparando informações…",
    verifying: "Verificando contexto…",
  } satisfies Record<StageId, string>,
  result: {
    title: "Encontrei algumas coisas importantes.",
    newAnalysis: "Nova análise",
    demoBanner: "Modo de demonstração: este é um exemplo fixo. Nenhuma pesquisa foi feita.",
    readingLow: "Não consegui ler tudo com segurança. Confira a leitura abaixo.",
    transcriptToggle: "O que li no print",
    noEvidence: "Não encontrei fontes suficientes para verificar isso.",
    retrySearch: "Tentar de novo",
    searched: (s: { searches: number; pages: number }) =>
      s.searches > 0
        ? `Fiz ${s.searches} ${s.searches === 1 ? "busca" : "buscas"} e encontrei ${s.pages} ${s.pages === 1 ? "página" : "páginas"}.`
        : "Desta vez não fiz buscas na internet.",
    sections: {
      said: "O que está sendo dito",
      howTo: "Como debater",
      category: "Categoria",
      facts: "O que é fato",
      opinions: "O que é opinião",
      counter: "Contraponto",
      flavio: "Fato sobre Flávio",
      flavioOther: "Do outro lado, no plano de Lula",
      sources: "Fontes consultadas",
      suggested: "Resposta sugerida",
      followUps: "Se a pessoa retrucar",
      broad: "Argumento amplo do eixo",
      opinion: "Agora deixe a Elle entender você",
      yours: "Sua resposta",
    },
    noFacts: "Não encontrei fatos verificáveis aqui. Esse ponto depende mais de opinião do que de dados.",
    opinionLabel: "Qual é a sua opinião sobre isso?",
    opinionHint: "Escreva do seu jeito. A Elle usa só o que você digitar aqui.",
    opinionPlaceholder: "Eu acho que…",
    opinionAction: "Escrever com a minha opinião",
    opinionWorking: "Escrevendo…",
    myOpinion: "Minha opinião",
    redo: "Escrever de novo",
    reviewNote:
      "Rascunho feito com ajuda de IA. Leia, abra uma fonte e ajuste antes de publicar. Se for propaganda eleitoral, o TSE pede que se avise o uso de IA.",
    variants: { standard: "Padrão", short: "Curta", with_source: "Com fonte" },
    variantHelp: { standard: "Até 280 caracteres: X, Instagram, Facebook", short: "Até 150 caracteres: TikTok", with_source: "Termina com o nome da fonte" },
    skipReply: "Talvez não valha responder",
  },
  copy: { idle: "Copiar resposta", done: "Copiado.", fail: "Não deu para copiar. Selecione o texto." },
  status: {
    confirmado: "Confirmado",
    provavel: "Provável",
    nao_confirmado: "Não confirmado",
    contestado: "Contestado",
  } satisfies Record<FactStatus, string>,
  statusHelp: {
    confirmado: "As fontes consultadas confirmam.",
    provavel: "As fontes apontam nessa direção, sem fechar a questão.",
    nao_confirmado: "Não encontrei evidência suficiente nas fontes consultadas.",
    contestado: "As fontes divergem entre si.",
  } satisfies Record<FactStatus, string>,
  errors: {
    unreadable: {
      title: "Não consegui ler esse print direito.",
      body: "Tente um print mais nítido, com o comentário inteiro à mostra.",
    },
    low_res: {
      title: "Essa imagem está com resolução muito baixa.",
      body: "Envie o print original, sem zoom e sem compressão de aplicativo.",
    },
    unsupported: {
      title: "Esse formato de imagem não abre aqui.",
      body: "Use JPG, PNG ou WEBP. Se for HEIC, tire um print da foto ou exporte como JPG.",
    },
    too_large: {
      title: "Essa imagem é pesada demais.",
      body: "Tente um print menor ou recorte só o comentário.",
    },
    search_failed: {
      title: "Não consegui encontrar fontes suficientes para verificar isso.",
      body: "A pesquisa falhou desta vez. Vale tentar de novo daqui a pouco.",
    },
    timeout: {
      title: "A pesquisa demorou mais do que o esperado.",
      body: "Nada foi perdido. Tente de novo.",
    },
    network: {
      title: "Não consegui falar com a Elle.",
      body: "Parece que a conexão caiu. Confira a internet e tente de novo.",
    },
    rate_limited: {
      title: "Muita gente chamando a Elle agora.",
      body: "Espere alguns minutos e tente de novo.",
    },
    unavailable: {
      title: "A Elle não está disponível agora.",
      body: "Ainda não está conectada ou está fora do ar. Tente mais tarde.",
    },
    bad_request: {
      title: "Algo deu errado com essa imagem.",
      body: "Escolha o print de novo.",
    },
    unknown: {
      title: "Algo deu errado do meu lado.",
      body: "Tente de novo. Se continuar, escolha outro print.",
    },
    retry: "Tentar novamente",
    other: "Escolher outro print",
  } satisfies Record<ElleErrorCode | "retry" | "other", string | { title: string; body: string }>,
  about: {
    title: "Oi. Eu sou a Elle.",
    subtitle: "Seu assistente de debates online.",
    body: "A Elle lê comentários a partir de prints, pesquisa o contexto na internet, compara argumentos com fontes confiáveis e ajuda você a construir respostas mais informadas.",
    close: "Fechar",
    categoriesTitle: "Quatro eixos para debater",
    credit1: "Criado por",
    credit2: "Designer criador",
    instagramHandle: "@marcosamirati",
    instagramUrl: "https://www.instagram.com/marcosamirati/",
  },
} as const;

/** Argumentos amplos por eixo: texto fixo do guia "Como debater política nos comentários". */
export const umbrellaArguments: Record<CategoryId, string> = {
  corrupcao: "A régua tem que ser a mesma para os dois lados: investigação, defesa e julgamento. Quem cobra de um precisa cobrar do outro.",
  economia: "Economia se mede pela série, não pela manchete: o mesmo indicador, em vários anos, com o que vai bem e o que vai mal.",
  valores: "Discordar sobre costumes é legítimo; inventar o que o outro vai fazer não é. Está no plano de governo? Tem fonte?",
  liberdade: "Democracia e segurança se medem por atos e por plano concreto, não por slogan. Quem respeitou as urnas? Qual é a proposta?",
};

export const categoryCopy: Record<CategoryId, { name: string; text: string }> = {
  corrupcao: {
    name: "Corrupção",
    text: "Como discutir acusações, investigações, decisões judiciais, uso de recursos públicos, integridade institucional e alegações de corrupção separando fato, investigação, acusação e condenação.",
  },
  valores: {
    name: "Valores",
    text: "Como discutir costumes, família, religião, segurança, comportamento, moralidade, responsabilidade individual e temas sociais sem transformar opinião em fato.",
  },
  liberdade: {
    name: "Liberdade",
    text: "Como discutir liberdade de expressão, direitos individuais, segurança, propriedade, Estado, regulação, democracia e limites institucionais.",
  },
  economia: {
    name: "Economia",
    text: "Como discutir impostos, emprego, salário, inflação, gastos públicos, dívida, juros, empresas estatais, privatizações, investimento e crescimento.",
  },
};
