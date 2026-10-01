import Link from "next/link";
import { projectTypes } from "@/content/site";
import { marcas } from "@/content/story";
import type { Project } from "@/lib/types";

/** Identidades visuais como peças editoriais: três composições que se alternam (tamanho, lado e respiro). */
export default function Marcas({ projects }: { projects: Project[] }) {
  return (
    <section id="marcas" className="scroll-mt-16 px-[4.6vw] pb-32 md:px-[3.2vw] md:pb-48">
      <div className="mb-20 grid gap-8 md:mb-32 md:grid-cols-12">
        <h2 className="display text-[clamp(2.6rem,7.4vw,8rem)] md:col-span-9">{marcas.title}</h2>
        <p className="aside max-w-xs text-[1.1rem] text-muted md:col-span-3 md:self-end">{marcas.aside}</p>
      </div>

      {projects.length === 0 ? (
        <p className="aside text-muted">Em breve, novas marcas por aqui.</p>
      ) : (
        <div className="flex flex-col gap-24 md:gap-12">
          {projects.map((p, i) => {
            const cover = p.cover_url ?? p.images[0];
            return (
              <article key={p.id} className="marca" data-v={i % 3}>
                <Link href={`/projetos/${p.slug}`} className="marca-link contents" aria-label={`Ver o projeto ${p.title}`}>
                  <figure className="marca-fig m-0">
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={`Capa do projeto ${p.title}`} loading={i === 0 ? "eager" : "lazy"} />
                    )}
                  </figure>
                  <div className="marca-text">
                    <h3 className="marca-title">{p.title}</h3>
                    <p className="aside mt-4 text-[1.1rem] text-muted">
                      {projectTypes[p.type]}
                      {p.year ? `, ${p.year}` : ""}
                    </p>
                    {p.summary && <p className="mt-3 max-w-md text-muted">{p.summary}</p>}
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
