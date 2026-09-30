import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Contact from "@/components/Contact";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import { projectTypes } from "@/content/site";
import { getProjectBySlug, getPublishedProjects, pickRelated } from "@/lib/data";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return {};
  const description = p.summary ?? undefined;
  return {
    title: p.title,
    description,
    alternates: { canonical: `/projetos/${p.slug}` },
    openGraph: {
      title: p.title,
      description,
      images: p.cover_url ? [{ url: p.cover_url }] : undefined,
    },
    twitter: { card: "summary_large_image", images: p.cover_url ? [p.cover_url] : undefined },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const [project, all] = await Promise.all([getProjectBySlug(slug), getPublishedProjects()]);
  if (!project) notFound();

  // A lista `images` já vem na ordem do admin (inclui a capa). Projetos antigos tinham a capa fora da lista.
  const images = project.images.includes(project.cover_url ?? "")
    ? project.images
    : [project.cover_url, ...project.images].filter((s): s is string => Boolean(s));
  const related = pickRelated(project, all);

  const info: [string, string | number | null][] = [
    ["Cliente", project.client],
    ["Tipo", projectTypes[project.type]],
    ["Ano", project.year],
  ];

  return (
    <>
      <div className="container-x grid gap-10 py-10 md:py-16 lg:grid-cols-[1fr_22rem] lg:gap-16">
        {/* Info: antes das imagens no mobile; sticky à direita no desktop */}
        <aside className="lg:order-2">
          <div className="lg:sticky lg:top-24">
            <h1 className="display text-5xl md:text-6xl">{project.title}</h1>
            <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
              {info.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {project.summary && <p className="mt-8 leading-relaxed text-muted">{project.summary}</p>}
            {project.external_url && (
              <a
                href={project.external_url}
                target="_blank"
                rel="noreferrer"
                className="btn mt-8 inline-block rounded-full border border-fg px-6 py-3 text-sm font-medium hover:border-accent hover:bg-accent hover:text-on-accent"
              >
                Ver projeto online ↗
              </a>
            )}
          </div>
        </aside>

        {/* Identidades: pranchetas grandes empilhadas. Social Media: posts (4:5) em grade. */}
        <div
          className={
            project.type === "social-media"
              ? "grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-3 lg:order-1"
              : "space-y-4 md:space-y-6 lg:order-1"
          }
        >
          {images.map((src, i) => (
            <Reveal key={src + i} delay={project.type === "social-media" ? (i % 3) * 40 : 0}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${project.title} — imagem ${i + 1}`}
                className="w-full bg-surface-2"
                loading={i < 2 ? "eager" : "lazy"}
              />
            </Reveal>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-line py-24 md:py-32">
          <div className="container-x">
            <Reveal><p className="mb-10 text-sm text-muted">/ Outros projetos</p></Reveal>
            <div className="grid gap-x-6 gap-y-12 md:grid-cols-3">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 60}><ProjectCard project={p} /></Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <Contact />
    </>
  );
}
