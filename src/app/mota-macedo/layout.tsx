import type { Metadata, Viewport } from "next";
import "@/styles/mota.css";
import { mm } from "@/content/motaMacedo";

// A página da Mota Macedo vive fora do grupo (site): sem cabeçalho, rodapé ou cursor do portfólio.
const title = `${mm.brand} — ${mm.hero.eyebrow}`;

export const metadata: Metadata = {
  title: { absolute: title },
  description: mm.hero.line,
  // Fora do Google enquanto for prévia. Para liberar: troque por { index: true }.
  robots: { index: false, follow: false },
  openGraph: { type: "website", siteName: mm.brand, title, description: mm.hero.line, locale: "pt_BR", images: [] },
  twitter: { card: "summary", title, description: mm.hero.line, images: [] },
};

export const viewport: Viewport = { themeColor: "#080d1a" };

export default function MotaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
