"use client";

import { useActionState, useState } from "react";
import { saveProject, type AdminState } from "../actions";
import MediaManager from "./MediaManager";
import { projectTypes } from "@/content/site";
import type { Project } from "@/lib/types";

const field = "w-full border border-line bg-transparent px-3 py-2.5 outline-none focus:border-fg";
const lab = "mb-1.5 block text-sm text-muted";

export default function ProjectForm({ project }: { project?: Project }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveProject, null);
  const [busy, setBusy] = useState(false);

  return (
    <form action={action} className="mt-10 grid max-w-3xl gap-6">
      {project && <input type="hidden" name="id" value={project.id} />}
      <div className="grid gap-6 md:grid-cols-2">
        <label><span className={lab}>Título *</span><input name="title" required defaultValue={project?.title} className={field} /></label>
        <label><span className={lab}>Slug (URL) — vazio = automático</span><input name="slug" defaultValue={project?.slug} className={field} /></label>
        <label><span className={lab}>Cliente</span><input name="client" defaultValue={project?.client ?? ""} className={field} /></label>
        <label>
          <span className={lab}>Tipo</span>
          <select name="type" defaultValue={project?.type ?? "identidade-visual"} className={field}>
            {Object.entries(projectTypes).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label><span className={lab}>Ano</span><input name="year" type="number" defaultValue={project ? (project.year ?? "") : new Date().getFullYear()} className={field} /></label>
        <label><span className={lab}>Ordem (menor aparece primeiro)</span><input name="sort_order" type="number" defaultValue={project?.sort_order ?? 0} className={field} /></label>
      </div>
      <label><span className={lab}>Resumo / contexto</span><textarea name="summary" rows={4} defaultValue={project?.summary ?? ""} className={field} /></label>
      <label><span className={lab}>Link externo (opcional)</span><input name="external_url" type="url" defaultValue={project?.external_url ?? ""} className={field} /></label>

      <MediaManager
        initialImages={project?.images ?? []}
        initialCover={project?.cover_url ?? null}
        initialHighlights={project?.highlights ?? []}
        onBusyChange={setBusy}
      />

      <label className="flex items-center gap-3">
        <input type="checkbox" name="published" defaultChecked={project?.published ?? false} className="size-4 accent-[var(--accent)]" />
        Publicado no site
      </label>

      {state?.error && <p role="alert" className="text-sm text-accent-ink">{state.error}</p>}
      <div>
        <button disabled={pending || busy} className="btn rounded-full bg-accent px-7 py-3 font-medium text-on-accent disabled:opacity-50">
          {busy ? "Aguarde o envio das imagens…" : pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
