import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getPublishedProjects } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublishedProjects();
  return [
    { url: site.url, changeFrequency: "monthly", priority: 1 },
    ...projects.map((p) => ({
      url: `${site.url}/projetos/${p.slug}`,
      lastModified: p.created_at,
      priority: 0.7,
    })),
  ];
}
