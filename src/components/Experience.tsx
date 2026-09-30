import Reveal from "./Reveal";
import { experience } from "@/content/site";

type Item = { period: string; place: string; role: string };

function List({ label, items, cols }: { label: string; items: Item[]; cols?: string }) {
  return (
    <div>
      <Reveal><h3 className="mb-8 text-sm text-muted">{label}</h3></Reveal>
      <ul className={`grid gap-x-10 gap-y-8 ${cols ?? ""}`}>
        {items.map((j, i) => (
          <Reveal as="li" key={j.place + j.period} delay={(i % 3) * 50}>
            <p className="text-lg text-muted md:text-xl">{j.period}</p>
            <p className="mt-1 text-xl font-semibold uppercase leading-tight tracking-tight md:text-2xl">{j.place}</p>
            {j.role && <p className="mt-1 text-sm uppercase tracking-tight md:text-base">{j.role}</p>}
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

export default function Experience() {
  return (
    <section id="experiencia" className="scroll-mt-16 border-t border-line py-24 md:py-40">
      <div className="container-x">
        <Reveal>
          <p className="mb-8 text-sm text-muted">/ Experiência</p>
          <h2 className="display max-w-3xl text-4xl text-accent-ink md:text-7xl">{experience.title}</h2>
        </Reveal>
        <div className="mt-20 grid gap-16 lg:grid-cols-[2fr_1fr] lg:gap-24">
          <List label="Experiência" items={experience.jobs} cols="sm:grid-cols-2" />
          <List label="Educação" items={experience.education} />
        </div>
      </div>
    </section>
  );
}
