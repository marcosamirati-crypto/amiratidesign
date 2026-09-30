import type { Project } from "./types";

// Usado quando o Supabase ainda não está configurado (.env.local vazio),
// para o site poder ser visualizado localmente. Espelha supabase/seed.sql.
const base = { external_url: null, published: true, created_at: "2025-01-01T00:00:00Z" } as const;

const mk = (
  n: number,
  slug: string,
  title: string,
  client: string,
  type: Project["type"],
  year: number,
  summary: string,
): Project => ({
  ...base,
  id: `seed-${n}`,
  slug,
  title,
  client,
  type,
  year,
  summary,
  cover_url: `/placeholder/${slug}-0`,
  images: [1, 2, 3].map((i) => `/placeholder/${slug}-${i}`),
  sort_order: n,
});

export const seedProjects: Project[] = [
  mk(1, "aurora-cafe", "Aurora Café", "Aurora Café", "identidade-visual", 2025,
    "Identidade visual completa para uma cafeteria de bairro: logotipo, paleta quente, tipografia e aplicações em embalagens e fachada."),
  mk(2, "nordeste-studio", "Nordeste Studio", "Nordeste Studio", "branding", 2025,
    "Projeto de branding para um estúdio de arquitetura: posicionamento, voz, sistema visual e manual de marca."),
  mk(3, "pulso-fit", "Pulso Fit", "Pulso Fit", "social-media", 2024,
    "Gestão gráfica do Instagram de uma academia: templates de feed, stories e capas de destaque com identidade consistente."),
  mk(4, "mare-alta", "Maré Alta", "Maré Alta Cervejaria", "identidade-visual", 2024,
    "Rótulos, logotipo e sistema visual para uma cervejaria artesanal litorânea."),
];
