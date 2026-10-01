import "@/styles/sante.css";
import type { Project } from "@/lib/types";
import { sante } from "@/content/brands/sante";
import { Archetype, CheckerBand, MissionVision, Persona, Triade, Values } from "./SanteAbout";
import { ColorStats, Palette, RedOcean } from "./SanteColors";
import { Gallery, InfoStrip } from "./SanteGallery";
import SanteHero from "./SanteHero";
import { Journey } from "./SanteJourney";
import { LogoShow } from "./SanteLogoShow";
import { Touchpoints } from "./SanteTouch";
import { SanteType } from "./SanteType";
import { Layers, Mantras, ToneSliders } from "./SanteVoice";

/** Página interna do projeto Santé Burger: o "mundo" da marca (cores, fonte e movimento da própria Santé). */
export default function SantePage({ project, images }: { project: Project; images: string[] }) {
  return (
    <div className="sante-page">
      <SanteHero client={project.title} year={String(project.year ?? sante.year)} kicker={sante.kicker} />
      <InfoStrip project={project} />
      <CheckerBand />
      <Triade />
      <MissionVision />
      <Values />
      <Archetype />
      <Persona />
      <ToneSliders />
      <Layers />
      <Mantras />
      <ColorStats />
      <RedOcean />
      <Palette />
      <SanteType />
      <Touchpoints />
      <Journey />
      <LogoShow />
      <Gallery title={project.title} images={images} />
      <CheckerBand tone="teal" />
    </div>
  );
}