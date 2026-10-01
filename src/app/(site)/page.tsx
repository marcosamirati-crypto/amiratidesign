import Campo from "@/components/Campo";
import Contact from "@/components/Contact";
import Hero from "@/components/Hero";
import Manifesto from "@/components/Manifesto";
import Marcas from "@/components/Marcas";
import Percurso from "@/components/Percurso";
import PhotoShowcase from "@/components/PhotoShowcase";
import SocialShowcase from "@/components/SocialShowcase";
import Trabalhar from "@/components/Trabalhar";
import { getPublishedProjects } from "@/lib/data";

export const revalidate = 60;

/**
 * A home é uma história, não uma lista de seções:
 * pôster → como eu penso → campo de atuação → marcas → feed → fotografia → percurso → como trabalhar → contato.
 */
export default async function Home() {
  const all = await getPublishedProjects();
  const marcas = all.filter((p) => p.type !== "social-media" && p.type !== "fotografia");
  const social = all.filter((p) => p.type === "social-media");
  const fotos = all.filter((p) => p.type === "fotografia");

  return (
    <>
      <Hero />
      <Manifesto />
      <Campo />
      <Marcas projects={marcas} />
      <SocialShowcase projects={social} />
      <PhotoShowcase projects={fotos} />
      <Percurso />
      <Trabalhar />
      <Contact />
    </>
  );
}
