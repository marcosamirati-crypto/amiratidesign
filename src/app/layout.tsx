import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/content/site";
import { Analytics } from "@vercel/analytics/next";

// Fonte única do site (títulos e texto): variações de peso (200–700) fazem o papel de "segunda voz".
// Para trocar: substitua o arquivo em /public/fonts.
const stack = localFont({
  src: "../../public/fonts/StackSansHeadline-VariableFont_wght.ttf",
  weight: "200 700",
  variable: "--font-stack",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Portfólio do Amirati", template: "%s — Portfólio do Amirati" },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: "Portfólio do Amirati",
    title: "Portfólio do Amirati",
    description: site.description,
    locale: "pt_BR",
    images: [{ url: "/capa-vermelha.webp", width: 1920, height: 1080, alt: "Portfólio do Amirati" }],
  },
  twitter: { card: "summary_large_image", images: ["/capa-vermelha.webp"] },
};

export const viewport: Viewport = { themeColor: "#151314" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" className={stack.variable} suppressHydrationWarning>
      <head>
        {/* sinaliza JS ativo antes da pintura: as animações de entrada só "escondem" conteúdo quando há JS */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
