import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/styles/mota.css";
import { mm } from "@/content/motaMacedo";

// A página da Mota Macedo vive fora do grupo (site): sem cabeçalho, rodapé ou cursor do portfólio.
// Fonte própria: Inter com eixo óptico (títulos grandes ganham desenho de "display" automaticamente).
const inter = localFont({
  src: "../../../public/fonts/Inter-opsz.woff2",
  weight: "100 900",
  variable: "--font-mm",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

const title = `${mm.product} · ${mm.brand} — ${mm.hero.eyebrow}`;
const description = mm.hero.line;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  // Fora do Google enquanto for prévia. Para liberar: troque por { index: true, follow: true }.
  robots: mm.preview ? { index: false, follow: false } : { index: true, follow: true },
  alternates: { canonical: "/mota-macedo" },
  openGraph: { type: "website", siteName: mm.product, title, description, locale: "pt_BR", url: "/mota-macedo", images: [{ url: "/mota/og.png", width: 1200, height: 630, alt: `${mm.product} — ${mm.statement.text}` }] },
  twitter: { card: "summary_large_image", title, description, images: ["/mota/og.png"] },
};

export const viewport: Viewport = { themeColor: "#08090D", colorScheme: "dark" };

export default function MotaLayout({ children }: { children: React.ReactNode }) {
  return <div className={inter.variable}>{children}</div>;
}
