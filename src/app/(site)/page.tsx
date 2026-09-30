import Link from "next/link";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Experience from "@/components/Experience";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import SocialShowcase from "@/components/SocialShowcase";
import { audience, deliverables, services, site, steps } from "@/content/site";
import { getPublishedProjects } from "@/lib/data";

export const revalidate = 60;

const label = "mb-8 text-sm text-muted";

export default async function Home() {
  const all = await getPublishedProjects();
  const socialProjects = all.filter((p) => p.type === "social-media");
  const projects = all.filter((p) => p.type !== "social-media");

  return (
    <>
      {/* Hero */}
      <section className="container-x flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center pb-20 pt-16 text-center">
        <span className="line-mask mx-auto">
          <span style={{ "--d": "0ms" } as React.CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/memoji.png"
              alt="Memoji do Amirati"
              width={248}
              height={282}
              draggable={false}
              data-no-glow
              className="mx-auto block h-auto w-[clamp(7rem,13vw,11.5rem)]"
            />
          </span>
        </span>
        <h1 className="display mt-8 max-w-[14ch] text-balance text-[clamp(3rem,9.4vw,8.5rem)] md:mt-10">
          <span className="line-mask"><span style={{ "--d": "120ms" } as React.CSSProperties}>oi! eu sou o amirati!</span></span>
        </h1>
        <p className="mt-6 text-xl text-muted md:text-2xl">{site.tagline}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="#contato" className="btn rounded-full bg-accent px-7 py-4 font-medium text-on-accent">
            Pedir orçamento
          </Link>
          <Link href="#trabalhos" className="btn rounded-full border border-line px-7 py-4 font-medium hover:border-fg">
            Ver trabalhos
          </Link>
        </div>
      </section>

      {/* Trabalhos */}
      <section id="trabalhos" className="scroll-mt-16 border-t border-line py-24 md:py-40">
        <div className="container-x">
          <Reveal><p className={label}>/ Trabalhos</p></Reveal>
          {projects.length === 0 ? (
            <p className="text-muted">Em breve, novos projetos por aqui.</p>
          ) : (
            <div className="grid gap-x-8 gap-y-16 md:grid-cols-2">
              {projects.map((p, i) => (
                <Reveal key={p.id} delay={(i % 2) * 60}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Social Media (some se não houver projetos do tipo) */}
      <SocialShowcase projects={socialProjects} />

      <About />

      <Experience />

      {/* Serviços */}
      <section id="servicos" className="scroll-mt-16 border-t border-line py-24 md:py-40">
        <div className="container-x">
          <Reveal><p className={label}>/ Serviços</p></Reveal>
          <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 60} className="bg-bg p-8 md:p-12">
                <h3 className="text-3xl font-medium tracking-tight md:text-4xl">{s.title}</h3>
                <p className="mt-4 max-w-md text-muted">{s.line}</p>
                {s.tiers.length > 0 ? (
                  <ul className="mt-10 divide-y divide-line border-y border-line">
                    {s.tiers.map((t) => (
                      <li key={t.name} className="flex flex-col gap-1 py-4 md:flex-row md:gap-8">
                        <span className="w-20 shrink-0 font-medium">{t.name}</span>
                        <span className="text-muted">{t.line}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-10 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent">
                    Preço por peça
                  </p>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* O que você recebe */}
      <section id="entregaveis" className="scroll-mt-16 border-t border-line py-24 md:py-40">
        <div className="container-x">
          <Reveal><p className={label}>/ O que você recebe</p></Reveal>
          <div className="grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {deliverables.map((d, i) => (
              <Reveal key={d.title} delay={(i % 3) * 60} className="flex flex-col bg-bg p-8">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>/{String(i + 1).padStart(2, "0")}</span>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-on-accent">{d.tag}</span>
                </div>
                <h3 className="mt-10 text-2xl font-medium tracking-tight">{d.title}</h3>
                <p className="mt-2 text-muted">{d.line}</p>
                <ul className="mt-6 space-y-2 border-t border-line pt-6 text-sm">
                  {d.items.map((it) => (
                    <li key={it} className="flex gap-3">
                      <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                      {it}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Processo */}
      <section id="processo" className="scroll-mt-16 border-t border-line py-24 md:py-40">
        <div className="container-x">
          <Reveal><p className={label}>/ Processo</p></Reveal>
          <ol className="grid gap-10 md:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 60} className="border-t border-fg pt-5">
                <span className="text-sm text-muted">0{i + 1}</span>
                <h3 className="mt-6 text-2xl font-medium tracking-tight">{s.title}</h3>
                <p className="mt-2 text-muted">{s.line}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Para quem é */}
      <section className="border-t border-line py-24 md:py-40">
        <div className="container-x grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-3"><p className={label}>/ {audience.title}</p></Reveal>
          <Reveal className="md:col-span-9" delay={60}>
            <p className="display text-3xl leading-[1.05] md:text-6xl">{audience.text}</p>
          </Reveal>
        </div>
      </section>

      <Contact />
    </>
  );
}
