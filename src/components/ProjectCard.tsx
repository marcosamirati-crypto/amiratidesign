import Link from "next/link";
import { projectTypes } from "@/content/site";
import type { Project } from "@/lib/types";

export default function ProjectCard({ project, priority = false }: { project: Project; priority?: boolean }) {
  return (
    <Link href={`/projetos/${project.slug}`} className="card group block">
      <div className="card-img aspect-[4/3] overflow-hidden bg-surface-2">
        {project.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.cover_url}
            alt={`Capa do projeto ${project.title}`}
            className="size-full object-cover"
            loading={priority ? "eager" : "lazy"}
          />
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="text-xl font-medium tracking-tight">{project.title}</h3>
        <span className="shrink-0 text-sm text-muted">
          {projectTypes[project.type]}
          {project.year ? ` · ${project.year}` : ""}
        </span>
      </div>
    </Link>
  );
}
