// Santé Burger — conteúdo da página interna (apresentação de marca, páginas 23 a 66 do PDF).
// Textos transcritos do PDF; erros de extração corrigidos. Gráficos são desenhados em código.

export const santeColors = {
  orange: "#FE4F2D",
  cream: "#FDFBEE",
  teal: "#015551",
  blue: "#57B4BA",
};

export const sante = {
  year: "2026",
  kicker: "Apresentação de marca",

  triade: [
    {
      q: "O que",
      text: "Hambúrgueres smash artesanais, servidos numa estética de diner americana, onde cada detalhe, da chapa ao papel xadrez, foi pensado pra ser lembrado.",
    },
    {
      q: "Como",
      text: "Sem atalho na receita, sem ruído na marca. Ingredientes simples, executados com obsessão. Identidade visual que mistura nostalgia dos anos 50 com a fluência visual de quem nasceu no feed.",
    },
    {
      q: "Por que",
      text: "Porque toda geração merece um lugar onde o tempo desacelera e o sabor conta uma história. A Santé engarrafa nostalgia e a serve com batatas fritas.",
    },
  ],

  missao: {
    label: "Missão",
    title: "Fritar a mesmice.",
    text: "Servir experiências que parecem familiares da primeira vez, onde cada detalhe, do papel xadrez ao sorriso do atendente, reforça a certeza de que você chegou ao lugar certo.",
  },
  visao: {
    label: "Visão",
    title: "Virar o point, não só o pedido.",
    text: "Tornar-se a referência de hospitalidade genuína no mercado de hamburguerias premium, provando que simplicidade bem executada é o luxo definitivo.",
  },

  valores: [
    { title: "Crosta antes de discurso", text: "A gente prova que é bom antes de falar que é bom. Qualidade não precisa de legenda." },
    { title: "Nostalgia sem naftalina", text: "A gente referencia o passado pra ser relevante agora, nunca o contrário. Anos 50 na estética, 2026 na atitude." },
    { title: "Atendimento é o tempero secreto", text: "Hospitalidade não é etapa do processo. É ingrediente. Sem ela, a receita não fecha." },
  ],

  arquetipo: {
    title: "O Bobo da Corte encontra O Cara Comum",
    text: "A Santé equilibra dois territórios raros de ocupar ao mesmo tempo: o humor inteligente de quem não se leva a sério demais (O Bobo da Corte) com a acessibilidade de quem não exclui ninguém (O Cara Comum).",
    porque: [
      "Marcas premium tendem a intimidar. Marcas engraçadas tendem a não ser levadas a sério.",
      "A Santé escapa dos dois extremos: é boa o suficiente pra ser respeitada, leve o suficiente pra ser amada. O cliente ri com a gente, nunca de longe.",
      "Essa fórmula gera o gatilho psicológico mais valioso do setor de alimentação: pertencimento sem julgamento.",
    ],
    closing: "Você não precisa “merecer” estar na Santé. Você só precisa estar com fome.",
  },
  // Roda dos 12 arquétipos (ordem clássica). Os dois da Santé ficam destacados.
  wheel: [
    "Inocente", "Sábio", "Explorador", "Fora da lei", "Mago", "Herói",
    "Amante", "Bobo da Corte", "Cara Comum", "Cuidador", "Criador", "Governante",
  ],

  persona: {
    label: "Persona da marca",
    title: "Se a Santé fosse gente",
    paragraphs: [
      "Ela teria uns 32 anos. Cresceu ouvindo as histórias do avô sobre a lanchonete de beira de estrada onde ele namorou a avó, e decidiu que quer recriar aquele clima, só que com Wi-Fi.",
      "Trabalha com o avental sujo de gordura boa e o celular cheio de referência de design. Sabe a receita de cor, mas também sabe editar um Reels. Cumprimenta cliente novo como se fosse antigo. Faz piada na hora certa, nunca na hora errada.",
    ],
    traits: ["Confiante sem ser arrogante.", "Engraçada sem ser boba.", "Old school no jeito de tratar, novíssima no jeito de se comunicar."],
  },

  voz: {
    title: "As regras do tom de voz",
    sub: "Afinal de contas, como a Santé fala? Em 5 pontos.",
    note: "As posições dos marcadores são ilustrativas.",
    pontos: [
      { trait: "Confiante", opposite: "Arrogante", pos: 22, title: "Confiante sem ser arrogante.", text: "A gente sabe que o produto é bom. Não precisamos gritar isso." },
      { trait: "Curta e direta", opposite: "Prolixa", pos: 8, title: "Curta e direta.", text: "Frases que cabem num cartaz. Se precisar de fôlego pra ler, é grande demais." },
      { trait: "Engraçada", opposite: "Boba", pos: 26, title: "Engraçada com intenção.", text: "Trocadilho aqui tem função: prender atenção e gerar memória. Nunca é piada pela piada." },
      { trait: "Inclusiva", opposite: "Fechada", pos: 10, title: "Inclusiva, sempre.", text: "Ninguém fica de fora de uma boa piada de hambúrguer. A linguagem da Santé é point de bairro, não clube fechado." },
      { trait: "Quente", opposite: "Forçada", pos: 20, title: "Quente, nunca forçada.", text: "A gente é simpático que nem vizinho de bairro antigo, não vendedor de loja de shopping." },
    ],
  },

  genial: {
    label: "A genialidade na prática",
    quote: "Trocadilho bom é aquele que você repete pro amigo",
    mantras: [
      {
        line: ["More fries,", "less drama."],
        note: "Nosso mantra de cardápio. Resume a filosofia inteira da marca numa rima: aqui a vida fica mais simples e mais saborosa.",
      },
      {
        line: ["Drive carefully.", "Come back hungry."],
        note: "A despedida que vira convite. Inspirada nos letreiros de saída das diners de beira de estrada, ela fecha o ciclo de hospitalidade com a promessa de um próximo encontro.",
      },
    ],
  },

  cores: {
    title: "A cor decide antes do paladar",
    intro: [
      "Estudos de comportamento do consumidor mostram que a cor influencia até 85% da decisão de compra, e isso acontece antes mesmo do primeiro garfo, da primeira mordida, do primeiro “vou querer esse aqui”.",
      "A cor também é responsável por até 80% do reconhecimento de marca num relance de menos de um segundo.",
    ],
    stats: [
      { value: 85, label: "da decisão de compra", color: "orange" },
      { value: 80, label: "do reconhecimento de marca, num relance de menos de um segundo", color: "teal" },
    ],
    problema: {
      label: "O problema da concorrência",
      title: "A maioria ainda tá na fase “vermelho porque todo mundo usa”.",
      text: [
        "O resultado é óbvio: marcas que ninguém reconhece de longe, e que ninguém vai reconhecer de perto, também.",
        "A Santé não tá disposta a ser mais um vermelho no oceano de vermelhos. A nossa paleta foi construída pra ter consistência, hierarquia e propósito em cada aplicação, do letreiro ao story do Instagram.",
      ],
    },
    paleta: [
      {
        key: "creme",
        name: "Creme",
        hex: "#FDFBEE",
        rgb: "253, 251, 238",
        cmyk: "0, 1, 6, 1",
        pantone: "9181 C",
        ink: "teal",
        lead: "A cor da espuma do milkshake antes de ser servido.",
        text: "Funciona como respiro visual da marca: o branco quebrado que segura o peso do vermelho sem disputar atenção com ele. É a cor do guardanapo de pano, da fachada pintada à mão, do papel onde a história é contada. Em qualquer aplicação, ela existe para dar silêncio ao design.",
      },
      {
        key: "laranja",
        name: "Laranja Avermelhado",
        hex: "#FE4F2D",
        rgb: "254, 79, 45",
        cmyk: "0, 69, 82, 0",
        pantone: "172 C",
        ink: "cream",
        lead: "A cor do letreiro neon visto de longe, na beira da estrada.",
        text: "Energia, apetite e velocidade. Esse laranja-coral carrega o calor do vermelho principal da marca, mas numa frequência mais quente e amigável. Ideal para destacar promoções, chamadas de cardápio e qualquer ponto que precise gritar “olha pra cá” sem perder a vibe acolhedora da casa.",
      },
      {
        key: "verde",
        name: "Verde Fundo",
        hex: "#015551",
        rgb: "1, 85, 81",
        cmyk: "",
        pantone: "",
        ink: "cream",
        lead: "A cor do banco de couro sintético dos diners clássicos.",
        text: "Profundo, sério, com peso institucional. Esse petróleo equilibra o tom brincalhão do laranja com uma camada de credibilidade. Funciona como cor de apoio em textos longos, fundos escuros e qualquer aplicação que precise comunicar solidez sem perder o ar nostálgico da marca.",
      },
      {
        key: "azul",
        name: "Azul",
        hex: "#57B4BA",
        rgb: "87, 180, 186",
        cmyk: "53, 3, 0, 27",
        pantone: "7458 C",
        ink: "teal",
        lead: "A cor do refrigerante gelado borbulhando no copo de vidro.",
        text: "Refrescante e leve, com um toque retrô-futurista que ecoa a estética Googie dos anos 50. É a cor de transição da paleta, usada em detalhes, ícones e elementos digitais que precisam de leveza sem cair no clichê do azul corporativo.",
      },
    ],
  },

  tipografia: {
    title: "A textura da voz",
    problema: [
      "A maioria das marcas do setor escolhe tipografia pela praticidade, não pela intenção.",
      "O resultado são fontes genéricas, sem peso, sem ritmo: letras que comunicam preço, mas nunca caráter.",
      "Tipografia não é só “qual fonte fica bonita”. É a textura da voz da marca antes mesmo de alguém ler a primeira palavra.",
    ],
    familias: [
      { name: "Anybody", note: "Para falar com o corpo inteiro: títulos, destaques e textos corridos." },
      { name: "Anybody Condensed", note: "Para caber no cartaz: chamadas, nomes de lanche e frases de impacto." },
    ],
    frase: ["You hear the crust before", "you taste it."],
  },

  verbal: {
    title: "Identidade verbal por ponto de contato",
    digital: {
      tab: "Digital",
      legenda: {
        title: "Estrutura de legenda",
        linhas: [
          { n: "Linha 1", text: "Gancho tipográfico (1-2 palavras ou frase-impacto em maiúsculas)." },
          { n: "Linha 2", text: "Contexto curto com personalidade." },
          { n: "Linha 3", text: "CTA disfarçado de convite." },
        ],
        exemplo: ["A CROSTA FALOU.", "Aquela selagem que você ouve antes de provar. Hoje no balcão.", "Chega antes que a fila decida por você."],
      },
      respostas: {
        title: "Padrão de resposta a clientes",
        tom: "Tom: próximo, rápido, nunca robotizado. Validar antes de informar. Usar o nome do cliente quando disponível.",
        casos: [
          { tipo: "Elogio", fala: "Isso aqui foi feito com você em mente. Volta logo." },
          { tipo: "Reclamação", fala: "Anotado, obrigado por falar. Isso não é a Santé que queremos ser. Bora corrigir." },
          { tipo: "Dúvida", fala: "Boa pergunta. [Resposta direta]. Qualquer coisa, a gente tá aqui." },
        ],
      },
    },
    impressos: {
      tab: "Impressos",
      itens: [
        {
          key: "caixa",
          name: "Caixa de hambúrguer",
          partes: [
            { onde: "Tampa", fala: "THE MOUTHWATERING BURGER", nota: "ancoragem do produto" },
            { onde: "Lateral", fala: "Abrir devagar é opcional. Resist if you can.", nota: "frase lúdica rotativa" },
          ],
        },
        {
          key: "sacola",
          name: "Sacola de viagem (take away)",
          partes: [
            { onde: "Frente", fala: "THE MOUTHWATERING BURGER + Simples. Clássico. Santé." },
            { onde: "Verso / dobra", fala: "Drive safe. Come back hungry. / Volte com fome. A gente tá aqui.", nota: "mensagem de saída" },
          ],
        },
        {
          key: "copo",
          name: "Copo de refrigerante / shake",
          partes: [
            { onde: "Principal", fala: "Logo Santé em script. Faixa xadrez como elemento estrutural de identidade." },
            { onde: "Frase inferior", fala: "Cold enough. Good enough. That’s enough. / Gelado como deve ser." },
          ],
        },
      ],
    },
    pdv: {
      tab: "Ponto de venda",
      cardapio: {
        title: "Nomenclatura no cardápio",
        text: "Nomes curtos com caráter. Descrição: no máximo uma linha, foco na textura e no ritual, nunca lista de ingredientes bruta.",
        nomes: ["The Original", "The Double Down", "The Classic Stack", "The Night Shift"],
        nomesNota: "The Night Shift é o late night.",
        exemplo: { nome: "The Original", desc: "Smash duplo, queijo americano, molho da casa. O clássico que não pede desculpa." },
      },
      letreiros: {
        title: "Letreiros e displays imersivos",
        text: "Frases âncora para displays e paredes.",
        frases: [
          "Order with confidence",
          "No fuss. No rush. Just good food.",
          "Since the first bite.",
          "Come as you are. Leave as a regular.",
        ],
        saida: "Drive carefully. Come back soon.",
        saidaNota: "Saída / porta: fechamento do ritual de hospitalidade, reforço do universo Rota 66.",
      },
    },
  },

  jornada: {
    title: "Jornada do cliente",
    presencial: {
      tab: "Presencial",
      sub: "Roteiro de atendimento presencial",
      passos: [
        {
          nome: "Chegada",
          alt: "Approach",
          desc: "Antes de abrir a boca, o atendente já está hospedando. Olho no olho, postura aberta, sem cara de quem tá esperando o turno acabar. O cliente decide se fica ou vai antes de ver o cardápio.",
          falas: [
            { quem: "Santé", t: "Boa noite! Bem-vindo à Santé! Pode chegar, sua mesa tá te esperando. Já conhece a casa? Quer dar uma olhada no cardápio ou já sabe o que quer?" },
          ],
          faz: "Pode ficar à vontade, tô aqui qualquer coisa. (Presença sem pressão.)",
          naoFaz: "Posso te ajudar? (Quem serve pergunta isso. Quem hospeda, convida.)",
        },
        {
          nome: "Menu discovery",
          desc: "Nunca despeja o cardápio inteiro. Lê o cliente primeiro: é a primeira visita? Tá com pressa? Quer uma sugestão? A função aqui é de guia, não de leitor de menu.",
          falas: [
            { quem: "Santé", t: "Pois eu vou te dar uma dica, pode ser? Sugiro o THE SMOKE: é o mais pedido da casa, e tem uma razão pra isso. Angus 150g, bacon, onion rings e molho defumado." },
            { quem: "Santé", t: "Se você quiser um sabor mais diferenciado, a gente tem o Cremoso que é absurdo. Mas pra primeira vez, começa pelo clássico!" },
          ],
          dica: "Dica premium: nunca recomenda tudo ao mesmo tempo. Uma sugestão clara vale mais que três opções, transmite domínio do produto e respeito pelo tempo do cliente.",
          faz: "Começa pelo X, é o melhor pra quem tá vindo pela primeira vez.",
          naoFaz: "Temos várias opções, dá uma olhada. (Vazio, sem personalidade.)",
        },
        {
          nome: "Order placement",
          desc: "A validação existe pra fazer o cliente sentir que fez a escolha certa, não pra inflar o ego de ninguém. Uma palavra basta. Sem “que maravilha” ou “que lindo pedido”.",
          falas: [
            { quem: "Cliente", t: "Então eu vou querer o THE SMOKE no combo, com batatinha e Pepsi." },
            { quem: "Santé", t: "Clássico. Deseja trocar a Pepsi pelo Milkshake da casa por mais cinco reais? O shake de Oreo é absurdo." },
          ],
          dica: "Upsell invisível: o upgrade é oferecido como dica de quem sabe, não como técnica de venda. Se o cliente recusar, o atendente aceita numa boa, sem insistir, sem comentar.",
        },
        {
          nome: "Delivery at table",
          desc: "A entrega não é logística: é o ponto alto da experiência. O atendente entrega com intenção: nomeia o item, faz um comentário curto que conecta, e sai sem sufocar.",
          falas: [
            { quem: "Santé", t: "É aqui que pediram um THE SMOKE? Saiu agora da chapa. Bom apetite de verdade. Qualquer coisa é só chamar." },
          ],
          faz: "Saiu agora da chapa. (Âncora sensorial, gera antecipação.)",
          naoFaz: "Vai querer sobremesa depois? (Na entrega, não. Deixa o cliente comer.)",
        },
        {
          nome: "Checagem",
          desc: "Passa perto, faz contato visual. Se o cliente estiver bem, só um aceno basta, não interrompe. Se o cliente chamar, responde rápido e sem cara de peso.",
          falas: [
            { quem: "Santé", t: "Tudo certo por aqui? Precisa de mais alguma coisa?" },
            { quem: "Cliente", t: "Tudo certo! Bem melhor do que eu esperava!" },
            { quem: "Santé", t: "Perfeito! Foi feito pra isso! Se precisar de alguma coisa é só falar." },
          ],
        },
        {
          nome: "Ritual de saída",
          desc: "A despedida é a última memória que o cliente leva. Tem que ser calorosa, rápida e genuína. Nunca mecânica. Uma frase com personalidade vale mais que um “tenha um bom dia” automático.",
          falas: [{ quem: "Santé", t: "Um brinde à sua visita! Volta com fome, a gente tá aqui te esperando!" }],
        },
      ],
    },
    digital: {
      tab: "Digital",
      sub: "Roteiro de atendimento digital",
      passos: [
        {
          nome: "Pedido realizado",
          desc: "Mesmo sendo automática, a confirmação precisa soar como se uma pessoa tivesse escrito. Nunca “Seu pedido foi recebido com sucesso”: burocrático e sem alma.",
          falas: [{ quem: "Santé", t: "Pedido recebido! A chapa já tá quente aqui pra você. THE SMOKE (combo) saindo." }],
        },
        {
          nome: "Dúvida do cliente",
          desc: "Responder com uma pergunta de volta só quando necessário. A maioria das dúvidas quer resposta direta, não um formulário de atendimento disfarçado de conversa.",
          falas: [
            { quem: "Cliente", t: "Oi, tem opção sem glúten?" },
            { quem: "Santé", t: "Oi! Nosso pão tem glúten, mas você pode pedir qualquer burger sem o pão. A gente embala separado e fica igualmente absurdo. Quer tentar assim?" },
            { quem: "Cliente", t: "Sim! Pode ser!" },
            { quem: "Santé", t: "Anotado, já coloquei a observação no pedido. Boa escolha, aliás." },
          ],
          faz: "Valida antes de fechar: “Boa escolha, aliás.” Pequeno, mas faz diferença.",
          naoFaz: "Verificar disponibilidade junto à equipe de produção. (Isso é suporte de banco, não atendimento de hamburgueria.)",
        },
        {
          nome: "Atraso ou imprevisto",
          desc: "Atraso já chateou o cliente. Mensagem de atraso genérica chateou o cliente duas vezes. A Santé assume, explica em uma frase e resolve, sem texto longo de desculpa, sem frase decorada demais.",
          falas: [
            { quem: "Santé", t: "Oi! A demanda aqui tá alta hoje! Seu pedido vai chegar uns 10 minutos depois do estimado. A gente tá em cima, promete. Valeu pela paciência!" },
          ],
          dica: "Por que funciona: proativo + honesto + humano. O cliente recebe a informação antes de perguntar. Isso transforma frustração potencial em tolerância, porque alguém se importou o suficiente pra avisar.",
        },
        {
          nome: "Saída pra entrega",
          desc: "",
          falas: [{ quem: "Santé", t: "Saiu! A Fumaça tá a caminho. Deixa um cantinho livre na mesa." }],
          dica: "Detalhe: “Deixa um cantinho livre na mesa” cria uma imagem mental e aproxima a experiência digital da presencial. É pequeno. É o que a maioria das marcas não faz.",
        },
        {
          nome: "Reclamação",
          desc: "Reclamação é a hora mais premium do atendimento. Quem responde bem numa crise fideliza mais do que quem nunca errou. A fórmula: valida a frustração, assume responsabilidade, resolve, não usa juridiquês.",
          falas: [
            { quem: "Cliente", t: "Chegou faltando o bacon no meu burger! Paguei pelo completo!" },
            { quem: "Santé", t: "Cara, isso não é a Santé que a gente quer ser. Desculpa de verdade. Pode me mandar uma foto do pedido? A gente resolve isso agora: ou refaz ou devolve o valor, o que for melhor pra você." },
          ],
          faz: "Isso não é a Santé que a gente quer ser. (Assume sem se humilhar.)",
          naoFaz: "Prezado cliente, lamentamos o ocorrido e nos comprometemos a verificar... (Isso é modelo de e-mail de banco em 2009.)",
        },
        {
          nome: "Elogio",
          desc: "Elogio não pede agradecimento excessivo. Uma frase que devolve carinho e já planta o próximo pedido, sem pedir nada, sem “não esqueça de avaliar”.",
          falas: [
            { quem: "Cliente", t: "Gente, o melhor burger que já comi na vida. Sério!" },
            { quem: "Santé", t: "Aqui tudo é feito com você em mente. Te esperamos na próxima! A chapa tá sempre quente." },
          ],
        },
      ],
    },
  },

  logo: {
    title: "O logo",
    antes: "O logo feito no pitch era assim.",
    depois: "O logo atual é assim.",
    problemas: ["Logo sem fluidez e movimento", "Menção ao hambúrguer no “A” muito simples", "Baixa usabilidade e aplicação"],
  },
};
