import { createPublicClient, hasSupabase } from "./supabase/server";
import { seedProjects } from "./seed";
import type { Project } from "./types";

const order = (a: Project, b: Project) =>
  a.sort_order - b.sort_order || (b.year ?? 0) - (a.year ?? 0);

export async function getPublishedProjects(): Promise<Project[]> {
  if (!hasSupabase) return [...seedProjects].sort(order);
  const { data, error } = await createPublicClient()
    .from("projects")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("year", { ascending: false });
  if (error) {
    console.error("getPublishedProjects", error.message);
    return [];
  }
  return (data ?? []) as Project[];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const all = await getPublishedProjects();
  return all.find((p) => p.slug === slug) ?? null;
}

/** 3 recomendações: mesmo tipo primeiro; completa com os mais recentes. */
export function pickRelated(current: Project, all: Project[], n = 3): Project[] {
  const others = all.filter((p) => p.id !== current.id);
  const recent = (a: Project, b: Project) => (b.year ?? 0) - (a.year ?? 0);
  const same = others.filter((p) => p.type === current.type).sort(recent);
  const rest = others.filter((p) => p.type !== current.type).sort(recent);
  return [...same, ...rest].slice(0, n);
}
