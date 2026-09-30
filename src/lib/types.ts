export type ProjectType = "identidade-visual" | "branding" | "social-media";

export type Project = {
  id: string;
  slug: string;
  title: string;
  client: string | null;
  type: ProjectType;
  year: number | null;
  summary: string | null;
  external_url: string | null;
  cover_url: string | null;
  images: string[];
  /** Subconjunto de `images` em destaque (capas de posts). Vazio = usa todas. */
  highlights?: string[];
  /** Destaques que aparecem colados ao destaque anterior (trinca contínua). */
  joined?: string[];
  published: boolean;
  sort_order: number;
  created_at: string;
};
