import Link from "next/link";
import Reveal from "./Reveal";
import { fotografia } from "@/content/story";
import type { Project } from "@/lib/types";

/** Seção de fotografia: fotos dos projetos do tipo "Fotografia", em grade (ordem da lista do admin). Some se não houver. */
export default function PhotoShowcase({ projects }: { projects: Project[] }) {
  const photos = projects.flatMap((p) =>
    (p.images.length ? p.images : p.cover_url ? [p.cover_url] : []).map((src) => ({ src, project: p })),
  );
  if (photos.length === 0) return null;

  return (
    <section id="fotografia" className="scroll-mt-16 border-t border-line px-[4.6vw] py-28 md:px-[3.2vw] md:py-44">
      <div className="mb-16 grid gap-8 md:mb-24 md:grid-cols-12">
        <h2 className="display text-[clamp(2.6rem,7vw,7.5rem)] md:col-span-8">{fotografia.title}</h2>
        <p className="aside max-w-xs text-[1.1rem] text-muted md:col-span-3 md:col-start-10 md:self-end">{fotografia.aside}</p>
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
    </section>
  );
}
