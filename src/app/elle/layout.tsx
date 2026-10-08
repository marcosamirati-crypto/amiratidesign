import type { Metadata, Viewport } from "next";
import "@/styles/elle.css";

// A Elle vive fora do grupo (site): sem cabeçalho, rodapé, cursor ou botão de WhatsApp do portfólio.
export const metadata: Metadata = {
  title: { absolute: "ELLE — Assistente de debates online" },
  description: "Envie um print de um comentário. A Elle pesquisa o contexto, compara com fontes e ajuda você a responder melhor.",
  // Fora do Google enquanto a Elle não for lançada. Para liberar: troque por { index: true }.
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "ELLE",
    title: "ELLE — Assistente de debates online",
    description: "Envie um print. A Elle pesquisa o contexto.",
    locale: "pt_BR",
  },
  // A imagem vem de opengraph-image.tsx / twitter-image.tsx (e não da capa do portfólio, definida no layout raiz).
  twitter: {
    card: "summary_large_image",
    title: "ELLE — Assistente de debates online",
    description: "Envie um print. A Elle pesquisa o contexto.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ECEEF0" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0D0F" },
  ],
  // Teclado do celular empurra o conteúdo em vez de cobrir o campo de opinião.
  interactiveWidget: "resizes-content",
};

export default function ElleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
