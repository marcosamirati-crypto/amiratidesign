import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";

// Segunda voz: serifada itálica calorosa, só para observações e notas pequenas.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

// Fonte principal (display + corpo). Para trocar: substitua o arquivo em /public/fonts.
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
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#000000" };

// Aplica o tema salvo antes da pintura (evita flash). Padrão: escuro.
const themeScript = `try{var t=localStorage.getItem('theme')||'dark';document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" className={`${stack.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
