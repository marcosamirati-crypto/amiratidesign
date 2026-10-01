import Reveal from "./Reveal";
import { about } from "@/content/site";

export default function About() {
  return (
    <section id="sobre" className="scroll-mt-16 border-t border-line py-24 md:py-40">
      <div className="container-x">
        <Reveal><p className="mb-8 text-sm text-muted">/ Sobre</p></Reveal>
        <div className="grid items-start gap-12 md:grid-cols-12 md:gap-16">
          <Reveal className="md:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={about.photo}
              alt={about.photoAlt}
              className="aspect-[2/3] w-full bg-surface-2 object-cover object-center"
              loading="lazy"
            />
          </Reveal>
          <Reveal className="md:col-span-7" delay={60}>
            <h2 className="display text-4xl md:text-6xl">{about.title}</h2>
            <div className="mt-10 max-w-2xl space-y-5 text-lg text-muted md:text-xl">
              {about.text.map((t) => <p key={t}>{t}</p>)}
            </div>
            <div className="mt-12">
              <h3 className="mb-4 text-sm text-muted">Softwares</h3>
              <ul className="flex flex-wrap gap-3">
                {about.softwares.map((s) => (
                  <li
                    key={s.short}
                    title={s.name}
                    className="grid size-14 place-items-center rounded-lg border border-fg text-lg font-semibold"
                  >
                    <span aria-hidden>{s.short}</span>
                    <span className="sr-only">{s.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}