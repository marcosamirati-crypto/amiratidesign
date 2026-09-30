import Link from "next/link";
import Reveal from "./Reveal";
import { photoIntro } from "@/content/site";
import type { Project } from "@/lib/types";

/** Seção FOTOGRAFIA da home: fotos dos projetos do tipo "Fotografia", em grade (ordem da lista do admin). Some se não houver. */
export default function PhotoShowcase({ projects }: { projects: Project[] }) {
  const photos = projects.flatMap((p) =>
    (p.images.length ? p.images : p.cover_url ? [p.cover_url] : []).map((src) => ({ src, project: p })),
  );
  if (photos.length === 0) return null;

  return (
    <section id="fotografia" className="scroll-mt-16 border-t border-line py-24 md:py-40">
      <div className="container-x">
        <div className="mb-12 grid gap-6 md:grid-cols-12">
          <Reveal className="md:col-span-3"><p className="text-sm text-muted">/ {photoIntro.title}</p></Reveal>
          <Reveal className="md:col-span-9" delay={60}>
            <p className="display max-w-3xl text-3xl md:text-5xl">{photoIntro.line}</p>
          </Reveal>
        </div>
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {photos.map(({ src, project }, i) => (
            <Reveal key={src + i} delay={(i % 3) * 50}>
              <Link href={`/projetos/${project.slug}`} className="card block" aria-label={`Ver fotografias: ${project.title}`}>
                <div className="card-img overflow-hidden bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Fotografia — ${project.title}`} className="block w-full" loading="lazy" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
