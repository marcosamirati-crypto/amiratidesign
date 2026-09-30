import Link from "next/link";
import Reveal from "./Reveal";
import { socialIntro } from "@/content/site";
import type { Project } from "@/lib/types";

/** Mural de posts: junta as imagens de todos os projetos do tipo "Social Media". */
export default function SocialShowcase({ projects }: { projects: Project[] }) {
  // Prioridade às capas dos posts (highlights); sem destaques, usa todas as imagens do projeto.
  const posts = projects.flatMap((p) => {
    const srcs = p.highlights?.length ? p.highlights : p.images.length ? p.images : p.cover_url ? [p.cover_url] : [];
    return srcs.map((src) => ({ src, project: p }));
  });
  if (posts.length === 0) return null;

  return (
    <section id="social" className="scroll-mt-16 border-t border-line py-24 md:py-40">
      <div className="container-x">
        <div className="mb-12 grid gap-6 md:grid-cols-12">
          <Reveal className="md:col-span-3"><p className="text-sm text-muted">/ {socialIntro.title}</p></Reveal>
          <Reveal className="md:col-span-9" delay={60}>
            <p className="display max-w-3xl text-3xl md:text-5xl">{socialIntro.line}</p>
          </Reveal>
        </div>
        <div className="columns-2 gap-3 md:columns-3 md:gap-5 lg:columns-4">
          {posts.map(({ src, project }, i) => (
            <Reveal key={src + i} delay={(i % 4) * 50} className="mb-3 break-inside-avoid md:mb-5">
              <Link href={`/projetos/${project.slug}`} className="card block" aria-label={`Ver projeto ${project.title}`}>
                <div className="card-img overflow-hidden bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Post de ${project.title}`} className="w-full" loading="lazy" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
