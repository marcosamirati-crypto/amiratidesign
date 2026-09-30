// Toda a copy do site fica aqui — edite sem mexer nos componentes.

export const site = {
  name: "Amirati Design",
  headline: "Design Admirável",
  tagline: "Branding que é lembrado",
  description:
    "Estúdio de branding especializado em gestão de marcas. Identidade visual, projetos de branding e gestão gráfica de redes sociais.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsapp:
    "https://api.whatsapp.com/send/?phone=8598883106&text&type=phone_number&app_absent=0",
  email: "marcosamirati@gmail.com",
  instagram: "@amiratidesign",
  instagramUrl: "https://instagram.com/amiratidesign",
};

export const about = {
  title: "Marcas que ficam na memória.",
  text: [
    "A Amirati Design é um estúdio de branding que cuida da marca de ponta a ponta — da ideia ao feed.",
    "Eu desenho a identidade, organizo o sistema visual e mantenho tudo consistente, para que o seu negócio seja reconhecido antes mesmo de assinar embaixo.",
  ],
};

export const projectTypes: Record<string, string> = {
  "identidade-visual": "Identidade Visual",
  branding: "Branding",
  "social-media": "Social Media",
};

export const services = [
  {
    title: "Projeto de Identidade Visual",
    line: "Do logotipo ao sistema completo, em três níveis para caber no momento da sua marca.",
    tiers: [
      { name: "Bronze", line: "O essencial para começar bem: logotipo, paleta e tipografia." },
      { name: "Prata", line: "Bronze + aplicações, papelaria e guia de uso resumido." },
      { name: "Ouro", line: "Prata + manual de marca completo e templates de social media." },
    ],
  },
  {
    title: "Projeto de Social Media Design",
    line: "Peças para redes sociais com a cara da marca. Valor definido por peça: você compra só o que precisa.",
    tiers: [],
  },
];

export const deliverables = [
  {
    title: "Logotipo e variações",
    line: "A assinatura da marca, pronta para qualquer tamanho.",
    items: ["Logotipo principal", "Versões horizontal, vertical e símbolo", "Versões positiva e negativa"],
    tag: "Bronze+",
  },
  {
    title: "Cores e tipografia",
    line: "Um sistema simples de reconhecer e fácil de aplicar.",
    items: ["Paleta principal e de apoio", "Famílias tipográficas", "Hierarquia de uso"],
    tag: "Bronze+",
  },
  {
    title: "Aplicações",
    line: "A marca em uso real, não só no papel.",
    items: ["Papelaria básica", "Perfis de redes sociais", "Mockups de aplicação"],
    tag: "Prata+",
  },
  {
    title: "Manual de marca",
    line: "Regras claras para a marca crescer sem se perder.",
    items: ["Uso e não-uso do logotipo", "Área de respiro e tamanhos mínimos", "Tom visual e exemplos"],
    tag: "Ouro",
  },
  {
    title: "Templates de social media",
    line: "Modelos editáveis para você postar com consistência.",
    items: ["Feed e carrossel", "Stories", "Capas de destaque"],
    tag: "Ouro",
  },
  {
    title: "Gestão gráfica de redes",
    line: "Peças novas com a identidade sempre alinhada.",
    items: ["Criação por peça", "Adaptação de formatos", "Arquivos prontos para publicar"],
    tag: "Por peça",
  },
];

export const steps = [
  { title: "Kickoff", line: "Conversa e briefing para entender o negócio, o público e o objetivo." },
  { title: "Criação", line: "Pesquisa, conceito e desenvolvimento da identidade, com apresentações claras." },
  { title: "Ajustes", line: "Refinamentos em conjunto até a marca estar exatamente certa." },
  { title: "Entrega", line: "Arquivos organizados e prontos para usar em qualquer meio." },
];

export const audience = {
  title: "Para quem é",
  text: "Para empreendedores, profissionais e negócios que querem uma marca com presença — e não só um logotipo. Se você quer ser lembrado, levar a imagem a sério e manter consistência nas redes, vamos conversar.",
};
