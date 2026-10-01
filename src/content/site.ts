// Toda a copy do site fica aqui — edite sem mexer nos componentes.

export const site = {
  name: "Amirati Design",
  headline: "Design Admirável",
  tagline: "Brand Designer e Diretor de Arte em Fortaleza",
  description:
    "Estúdio de branding especializado em gestão de marcas. Identidade visual, projetos de branding e gestão gráfica de redes sociais.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsapp:
    "https://api.whatsapp.com/send/?phone=8598883106&text&type=phone_number&app_absent=0",
  email: "marcosamirati@gmail.com",
  instagram: "@amiratidesign",
  instagramUrl: "https://instagram.com/amiratidesign",
  phone: "+55 (85) 98883-1106",
  linkedin: "linkedin.com/in/marcosamirati",
  linkedinUrl: "https://www.linkedin.com/in/marcosamirati",
};

export const experience = {
  title: "Aqui tem um pouco de onde eu já passei…",
  jobs: [
    { period: "2017 — atualmente", place: "Brand Designer Freelancer", role: "" },
    { period: "2025 — 2026", place: "Quitanda Soluções Criativas", role: "Estágio em Design" },
    { period: "2024 — 2025", place: "Sicredi", role: "Estágio em Marketing" },
    { period: "2022 — 2023", place: "Rastro Agência Jr.", role: "Diretoria de Projetos" },
    { period: "2022 — 2023", place: "Caju Benefícios", role: "Estágio em Brand Design" },
    { period: "2021 — 2022", place: "Voadora Design", role: "Brand Designer Júnior" },
  ],
  education: [
    { period: "2021 — 2027", place: "Universidade Federal do Ceará", role: "Publicidade e Propaganda" },
    { period: "2016 — 2019", place: "Gracom School of Visual Effects", role: "Curso técnico em Design Gráfico" },
  ],
};

export const socialIntro = {
  title: "Social Media",
  line: "Posts pensados para a marca ser reconhecida no feed, com identidade e consistência.",
};

export const photoIntro = {
  title: "Fotografia",
  line: "Fotografias feitas por mim: o olhar por trás dos projetos.",
};

export const projectTypes: Record<string, string> = {
  "identidade-visual": "Identidade Visual",
  branding: "Branding",
  "social-media": "Social Media",
  fotografia: "Fotografia",
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

export const about = {
  title: "Sou Amirati, Brand Designer e Art Director de Fortaleza.",
  text: [
    "Minha especialidade é identidade visual e gestão de marcas: crio sistemas de design estratégicos e emocionalmente envolventes para negócios que querem se posicionar com clareza e personalidade.",
    "Com formação em Publicidade e anos de experiência em agências, startups e como freelancer, uno pensamento conceitual a uma execução visual forte. Meu trabalho conecta branding, produção gráfica e presença digital, transformando ideias em experiências de marca coesas e memoráveis.",
  ],
  photo: "/eu.jpg",
  photoAlt: "Retrato de Amirati sob luz vermelha, de óculos escuros",
  softwares: [
    { short: "Ps", name: "Photoshop" },
    { short: "Ai", name: "Illustrator" },
    { short: "Ae", name: "After Effects" },
    { short: "Id", name: "InDesign" },
    { short: "Pr", name: "Premiere Pro" },
  ],
};

export const audience = {
  title: "Para quem é",
  text: "Para empreendedores, profissionais e negócios que querem uma marca com presença — e não só um logotipo. Se você quer ser lembrado, levar a imagem a sério e manter consistência nas redes, vamos conversar.",
};

// Introduções das áreas de postagens e fotografia (dentro de TRABALHOS).
export const feed = {
  title: "No feed, a marca fala todo dia.",
  aside: "Posts, carrosséis e trincas para Cine +, Audium Systems, Sonitécnica, Força pra Crescer, Laboratórios Culturais e Ceará Criativo.",
};

export const fotografia = {
  title: "Fora do computador, eu também fotografo.",
  aside: "Praia, ruína, gente jogando bola. O que me chama atenção quando eu levanto a cabeça.",
};