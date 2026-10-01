import Link from "next/link";
import Reveal from "./Reveal";
import SocialMosaic from "./SocialMosaic";
import { feed } from "@/content/site";
import type { Project } from "@/lib/types";

type Post = { src: string; project: Project };

// Classes estáticas (o Tailwind não enxerga nomes montados em runtime).
const SPAN_LG: Record<number, string> = { 1: "", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4" };

/**
 * Mural de posts. A ordem é a da lista de imagens de cada projeto (definida no admin), projeto a projeto.
 * Um destaque marcado como "colado" forma bloco com o anterior (trinca contínua): lado a lado, sem espaço.
 */
export default function SocialShowcase({ projects }: { projects: Project[] }) {
  const blocks: Post[][] = [];
  for (const p of projects) {
    const srcs = p.highlights?.length ? p.highlights : p.images.length ? p.images : p.cover_url ? [p.cover_url] : [];
    const joined = new Set(p.joined ?? []);
    let current: Post[] | null = null;
    for (const src of srcs) {
      const post = { src, project: p };
      if (current && joined.has(src) && current.length < 4) current.push(post);
      else {
        current = [post];
        blocks.push(current);
      }
    }
  }
  if (blocks.length === 0) return null;

  return (
    <section className="border-t border-line py-24 md:py-40">
      <div className="container-x">
      <div className="mb-16 grid gap-8 md:mb-24 md:grid-cols-12">
        <h2 className="display text-[clamp(2.6rem,7vw,7.5rem)] md:col-span-8">{feed.title}</h2>
        <p className="aside max-w-xs text-[1.1rem] text-muted md:col-span-3 md:col-start-10 md:self-end">{feed.aside}</p>
      </div>
      {/* Celular: linhas justificadas (todos os posts da linha com a mesma altura), sem buracos. Desktop: grade em linhas, 4 colunas. */}
      <SocialMosaic
        className="md:hidden"
        blocks={blocks.map((b) => b.map(({ src, project }) => ({ src, slug: project.slug, title: project.title })))}
      />
      <div className="hidden md:grid md:grid-cols-2 md:items-start md:gap-5 lg:grid-cols-4">
        {blocks.map((block, i) => (
          <Reveal
            key={block[0].src + i}
            delay={(i % 4) * 50}
            className={`${block.length > 1 ? "md:col-span-2" : ""} ${SPAN_LG[block.length]}`}
          >
            <div className="flex">
              {block.map(({ src, project }, k) => (
                <Link
                  key={src + k}
                  href={`/projetos/${project.slug}`}
                  className="card block min-w-0 flex-1"
                  aria-label={`Ver projeto ${project.title}`}
                >
                  <div className="card-img overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Post de ${project.title}`} className="block w-full" loading="lazy" />
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
      </div>
    </section>
  );
}
