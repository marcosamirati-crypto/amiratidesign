import Link from "next/link";
import { deleteProject, togglePublished } from "../actions";
import { projectTypes } from "@/content/site";
import { createAuthClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProjects() {
  const supabase = await createAuthClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as Project[];

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="display text-4xl">Projetos</h1>
        <Link href="/admin/projetos/novo" className="btn rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent">
          Novo projeto
        </Link>
      </div>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {projects.length === 0 && <li className="py-6 text-muted">Nenhum projeto ainda.</li>}
        {projects.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-4 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.cover_url ? <img src={p.cover_url} alt="" className="h-14 w-20 object-cover" /> : <div className="h-14 w-20 bg-surface-2" />}
            <div className="min-w-0 flex-1">
              <Link href={`/admin/projetos/${p.id}`} className="link-u font-medium">{p.title}</Link>
              <p className="text-sm text-muted">{projectTypes[p.type]}{p.year ? ` · ${p.year}` : ""}</p>
            </div>
            <form action={togglePublished}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="published" value={String(p.published)} />
              <button className={`btn rounded-full px-3 py-1 text-xs font-medium ${p.published ? "bg-accent text-on-accent" : "border border-line text-muted"}`}>
                {p.published ? "Publicado" : "Rascunho"}
              </button>
            </form>
            <form action={deleteProject}>
              <input type="hidden" name="id" value={p.id} />
              <button className="btn text-sm text-muted hover:text-fg">Excluir</button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
