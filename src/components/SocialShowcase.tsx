import Link from "next/link";
import Reveal from "./Reveal";
import { socialIntro } from "@/content/site";
import type { Project } from "@/lib/types";

type Post = { src: string; project: Project };

// Classes estáticas (o Tailwind não enxerga nomes montados em runtime).
const SPAN_LG: Record<number, string> = { 1: "", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4" };

/**
 * Mural de posts da home. A ordem é a da lista de imagens de cada projeto (definida no admin),
 * projeto a projeto. Um destaque marcado como "colado" forma bloco com o anterior (trinca contínua):
 * as imagens ficam lado a lado, sem espaço entre elas.
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
    <section id="social" className="scroll-mt-16 border-t border-line py-24 md:py-40">
      <div className="container-x">
        <div className="mb-12 grid gap-6 md:grid-cols-12">
          <Reveal className="md:col-span-3"><p className="text-sm text-muted">/ {socialIntro.title}</p></Reveal>
          <Reveal className="md:col-span-9" delay={60}>
            <p className="display max-w-3xl text-3xl md:text-5xl">{socialIntro.line}</p>
          </Reveal>
        </div>
        {/* Grade em linhas (da esquerda para a direita), 2 colunas no celular e 4 no desktop */}
        <div className="grid grid-cols-2 items-start gap-3 md:gap-5 lg:grid-cols-4">
          {blocks.map((block, i) => (
            <Reveal
              key={block[0].src + i}
              delay={(i % 4) * 50}
              className={`${block.length > 1 ? "col-span-2" : ""} ${SPAN_LG[block.length]}`}
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
