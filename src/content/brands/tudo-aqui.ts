// Tudo Aqui — conteúdo da página interna (apresentação de marca, maio de 2026).
// Textos do PDF, enxugados e com a pontuação ajustada para leitura na tela. Gráficos são desenhados em código.

export const tudoColors = {
  petroleo: "#073B4C",
  azul: "#118AB2",
  menta: "#06D6A0",
  sol: "#FFD166",
  melancia: "#EF476F",
  papel: "#F5F2EA",
};

export const tudo = {
  year: "2026",
  kicker: "Apresentação de marca",
  claim: "O bairro que cabe no seu bolso.",

  autores: [
    { nome: "Marcos Amirati", papel: "Designer e fundador" },
    { nome: "Kaline Chaves", papel: "Designer e fundadora" },
  ],

  intro: {
    linhas: [
      "Antes de falar de vetor, pixel ou cor,",
      "a gente precisa entender o que está construindo:",
    ],
    destaque: "a semente do seu negócio.",
    ecossistema: "Quando criamos uma identidade para o Tudo Aqui, criamos uma proposta de ecossistema para uma comunidade inteira.",
    bairro: ["Estamos falando de colocar um bairro inteiro,", "de forma organizada e profissional,", "na palma da mão de quem mora nele."],
  },

  mercado: {
    label: "Sobre o mercado",
    title: "Onde a empresa se encontra",
    diagnostico: {
      titulo: "O diagnóstico urbano",
      texto: "O comércio da região cresce rápido, mas bate num gargalo enorme de comunicação.",
    },
    caos: {
      titulo: "O caos operacional",
      texto: "Quem empreende ali se vira como pode: grupos de WhatsApp sem vitrine, sem estrutura, sem nada centralizado.",
      bolhas: [
        "alguém tem o cardápio de hoje?",
        "vocês entregam no Smart City?",
        "manda o contato do rapaz do gás",
        "quanto tá o botijão?",
        "esse grupo é só de venda?",
        "vi um anúncio aqui em cima, qual era?",
        "quem faz conserto de geladeira?",
        "me passa o pix de novo",
        "ainda tem marmita?",
      ],
    },
    raiox: {
      titulo: "O raio-x do mercado",
      sub: "As consequências",
      itens: [
        { t: "Negócios invisíveis", d: "Quem tem um serviço ou produto de qualidade simplesmente não consegue uma presença organizada para ser visto." },
        { t: "Clientes dispersos", d: "O consumidor perde tempo caçando cardápios e contatos espalhados em conversas sem fim." },
        { t: "Falta de infraestrutura", d: "Não existe uma plataforma local dedicada a serviços. O Tudo Aqui nasce para curar essa dor." },
      ],
    },
  },

  publico: {
    label: "O público-alvo",
    title: "Quem dita as regras?",
    perfil: [
      {
        t: "Perfil demográfico",
        d: "Moradores do Smart City Aquiraz e arredores, com forte presença de adultos das classes C e D, que somam mais de 53% da renda que circula no município.",
      },
      {
        t: "A dinâmica híbrida",
        d: "A cidade tem uma população jovem-adulta acima da média do estado. O adulto toma a decisão final de compra, mas é o jovem que indica o aplicativo.",
      },
      {
        t: "A base estável",
        d: "Autônomos, servidores públicos, quem trabalha no comércio local e mais de 1.400 colaboradores do complexo Beach Park que moram na cidade, com renda e rotina consolidadas.",
      },
    ],
    comportamento: {
      title: "Como esse público consome",
      confianca: {
        t: "A barreira da confiança",
        d: "O público pesquisa muito o preço antes de fechar qualquer negócio e dá preferência a interfaces que passam segurança. Se o ambiente parecer instável, a pessoa desiste na hora.",
      },
      mobile: {
        t: "Só no celular",
        d: "O smartphone é a tela principal, às vezes a única. O consumo pelo celular aqui é de 74%, acima dos 62% das classes A e B (e vai a 76% quando olhamos só o Nordeste).",
        barras: [
          { l: "Classes C e D", v: 74 },
          { l: "Classes A e B", v: 62 },
          { l: "C e D no Nordeste", v: 76 },
        ],
      },
      concorrente: {
        t: "O grande concorrente",
        d: "Não é o iFood, é o WhatsApp. Cerca de 62% das classes C, D e E usam o zap como ferramenta direta de comércio. O Tudo Aqui chega para profissionalizar esse hábito.",
        v: 62,
      },
    },
  },

  conceito: {
    label: "O conceito criativo",
    frase: ["A base criativa da marca não é um app genérico de entrega.", "É o próprio bairro, digitalizado."],
    claim: "O bairro que cabe no seu bolso.",
    tres: {
      title: "Esse posicionamento resolve três coisas de uma vez",
      itens: [
        "Diferencia a plataforma de cara de gigantes como o iFood.",
        "Mostra a variedade de serviços (gás, água, comida, manutenção) sem precisar listar tudo no layout.",
        "Dá senso de pertencimento: o morador sente que aquilo foi desenhado para a realidade dele.",
      ],
    },
    moodboard: {
      title: "Duas rotas para a tradução visual",
      rotas: [
        {
          key: "humana",
          nome: "Humana e acolhedora",
          texto: "Linguagem leve, com ilustrações simples, gestos reais, tipografia amigável e cores vibrantes para criar proximidade logo de cara.",
        },
        {
          key: "modular",
          nome: "Modular e gráfica",
          texto: "Pegada mais memorável e tecnológica: blocos de cor bem marcados, personagens icônicos e elementos do ecossistema digital para frisar a praticidade.",
        },
      ],
    },
  },

  tipografia: {
    title: "A voz da marca, em duas letras",
    principal: {
      nome: "Brown Cookies",
      resumo: "A essência do calor humano, da proximidade e da voz da comunidade.",
      porque:
        "A escolha responde ao pilar mais importante do conceito: o sentimento de vizinhança. Por ser uma fonte display de traço orgânico, arredondado e simpático, ela quebra de cara a distância técnica das plataformas digitais convencionais.",
      aplicacao:
        "Só em títulos principais, assinaturas de campanha, frases emocionais (como “O bairro que cabe no bolso”), peças de rede social e materiais de ponto de venda, onde a marca precisa falar de um jeito descontraído e acolhedor.",
      dados: "Disponível em dafont.com",
    },
    apoio: {
      nome: "Poppins",
      resumo: "Clareza geométrica, boa leitura e precisão digital.",
      porque:
        "Para equilibrar o carisma da tipografia principal, a Poppins entrou como a base estrutural do projeto. É uma sem serifa puramente geométrica, de formas circulares e abertas, que dá uma leitura fluida, moderna e confortável.",
      aplicacao:
        "Corpo de texto, subtítulos informativos, menus do aplicativo, listas de produtos, preços, descrições de serviço e todas as áreas da interface em que leitura, organização e profissionalismo precisam ficar na frente.",
      dados: "Disponível em fonts.google.com",
    },
    alfabeto: ["ABCDEFGHIJKLM", "NOPQRSTUVWXYZ", "abcdefghijklm", "nopqrstuvwxyz", "0123456789"],
  },

  cores: {
    title: "Cinco cores, cada uma com o seu trabalho",
    paleta: [
      {
        key: "petroleo",
        nome: "Petróleo Profundo",
        hex: "#073B4C",
        rgb: "7, 59, 76",
        cmyk: "91, 22, 0, 70",
        ink: "claro",
        perfeita: "institucionalismo, estabilidade, confiança e solidez.",
        porque:
          "É a cor de maior seriedade e a base estrutural do projeto. Entra no lugar do preto tradicional, dá um refinamento moderno e a estabilidade que a pessoa precisa para se sentir segura em transações financeiras.",
        aplicacao:
          "Tons mais claros dão contraste nos layouts, já que a cor base assume sozinha a tipografia principal, o logotipo, os headers e tudo que pede alta legibilidade e solidez no digital.",
      },
      {
        key: "azul",
        nome: "Azul Oceano",
        hex: "#118AB2",
        rgb: "17, 138, 178",
        cmyk: "90, 22, 0, 30",
        ink: "claro",
        perfeita: "tecnologia, usabilidade, inovação e clareza.",
        porque:
          "Conduz a usabilidade e a clareza dentro da interface. É um tom intermediário de alta vibração, que comunica sofisticação técnica e faz a ponte entre as cores quentes e os tons mais sóbrios.",
        aplicacao:
          "Perfeito para guiar o fluxo no celular: links, barras de progresso, botões de navegação secundária e ícones de interface que pedem interação rápida e intuitiva.",
      },
      {
        key: "menta",
        nome: "Verde Menta",
        hex: "#06D6A0",
        rgb: "6, 214, 160",
        cmyk: "97, 0, 25, 16",
        ink: "escuro",
        perfeita: "vitalidade, prosperidade, crescimento e fluidez.",
        porque:
          "Carrega o sentido de renovação e o frescor de um comércio local que se digitaliza de forma próspera e sustentável. Passa equilíbrio e leveza, o que tranquiliza a navegação.",
        aplicacao:
          "Funciona muito bem em marcadores de status positivo (pedido finalizado, estabelecimento aberto), tags de categoria de serviço e grafismos secundários que lembram estabilidade e sucesso.",
      },
      {
        key: "sol",
        nome: "Amarelo Sol",
        hex: "#FFD166",
        rgb: "255, 209, 102",
        cmyk: "0, 18, 60, 0",
        ink: "escuro",
        perfeita: "otimismo, calor humano, proximidade e acolhimento.",
        porque:
          "Traz o calor e a sensação de acolhimento que definem a ideia de comunidade da marca. É uma cor receptiva, que afasta a frieza de um aplicativo tradicional e cria uma atmosfera de vizinhança.",
        aplicacao:
          "Ideal para sinalizações secundárias, selos de benefício, ícones de avaliação e áreas de interação onde a empatia e a simpatia da marca precisam falar mais alto.",
      },
      {
        key: "melancia",
        nome: "Rosa Melancia",
        hex: "#EF476F",
        rgb: "239, 71, 111",
        cmyk: "0, 70, 54, 6",
        ink: "claro",
        perfeita: "dinamismo, urgência positiva, destaque e apetite.",
        porque:
          "Injeta energia e senso de ação imediata. Por ser quente e muito saturado, aparece na hora na tela, quebra a monotonia e leva o olhar para as conversões e os pontos críticos da plataforma.",
        aplicacao:
          "Suas nuances servem para botões de compra, alertas importantes e grafismos promocionais de alto impacto, para que o ecossistema do Tudo Aqui seja ativo e pulsante.",
      },
    ],
  },

  marca: {
    title: "Como o logo nasceu",
    // Cenas da história (cada uma vira um quadro no player)
    cenas: [
      { id: "comeco", texto: "vamos começar por aqui" },
      { id: "aqui", texto: "aqui" },
      { id: "antes", texto: "mas antes… qual a semente do negócio?" },
      { id: "entregas", texto: "entregas. entregas de tudo." },
      { id: "rota", texto: "daqui até aqui" },
      { id: "aqui-letra", texto: "aqui" },
      { id: "tudo", texto: "tudo aqui" },
      { id: "bolso", texto: "no seu bolso" },
      { id: "selo", texto: "tudo aqui, no bolso" },
    ],
    selos: { title: "Um bolso para cada cor" },
    versoes: {
      title: "Claro, escuro, colorido",
      itens: [
        { n: "No azul", bg: "azul", fg: "branco" },
        { n: "No petróleo", bg: "petroleo", fg: "azul" },
        { n: "No branco", bg: "papel", fg: "petroleo" },
      ],
    },
    personagens: {
      title: "A vizinhança",
      texto: "Os bolsos ganharam olho, boca e opinião. Cada cor é um vizinho, e eles aparecem nas peças, no app e na embalagem.",
    },
  },

  usos: {
    title: "A frase na rua e no app",
    frases: [
      { id: "fome", linhas: ["Bateu a fome?", "tem tudo aqui!"], bg: "petroleo", cor: "azul" },
      { id: "sofa", linhas: ["O seu Aquiraz inteiro,", "sem precisar sair do sofá."], bg: "azul", cor: "papel" },
      { id: "palma", linhas: ["O seu bairro inteiro,", "agora na palma da mão."], bg: "melancia", cor: "papel" },
    ],
  },
};
