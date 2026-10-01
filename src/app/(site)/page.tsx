import Contact from "@/components/Contact";
import Experience from "@/components/Experience";
import About from "@/components/About";
import Hero from "@/components/Hero";
import PhotoShowcase from "@/components/PhotoShowcase";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import SobreMais from "@/components/SobreMais";
import SocialShowcase from "@/components/SocialShowcase";
import { getPublishedProjects } from "@/lib/data";

export const revalidate = 60;

const label = "mb-8 text-sm text-muted";

/**
 * Três âncoras: TRABALHOS (identidades em duas colunas, posts e fotografia), SOBRE (quem sou, experiência,
 * serviços, entregáveis e processo) e CONTATO.
 */
export default async function Home() {
  const all = await getPublishedProjects();
  const socialProjects = all.filter((p) => p.type === "social-media");
  const photoProjects = all.filter((p) => p.type === "fotografia");
  const projects = all.filter((p) => p.type !== "social-media" && p.type !== "fotografia");

  return (
    <>
      <Hero />

      {/* TRABALHOS */}
      <section id="trabalhos" className="scroll-mt-20 py-24 md:py-40">
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
      <SocialShowcase projects={socialProjects} />
      <PhotoShowcase projects={photoProjects} />

      {/* SOBRE */}
      <About />
      <Experience />
      <SobreMais />

      {/* CONTATO */}
      <Contact />
    </>
  );
}
