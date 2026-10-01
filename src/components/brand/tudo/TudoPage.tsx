import "@/styles/tudo-aqui.css";
import type { Project } from "@/lib/types";
import { tudo } from "@/content/brands/tudo-aqui";
import { Conceito } from "./TudoConceito";
import { Cores } from "./TudoColors";
import { Intro, Mercado, Publico } from "./TudoAnalises";
import TudoHero from "./TudoHero";
import { Marca } from "./TudoMarca";
import { MascotLooks } from "./TudoMascots";
import { Tipografia } from "./TudoType";
import { BolsosBand, Ficha, Frases, Pecas } from "./TudoUsos";

/** Página interna do projeto Tudo Aqui: o bairro cabendo no bolso (cores, letras e vizinhos da própria marca). */
export default function TudoPage({ project, images }: { project: Project; images: string[] }) {
  return (
    <div className="tudo-page">
      <MascotLooks />
      <TudoHero client={project.title} year={String(project.year ?? tudo.year)} />
      <Ficha project={project} />
      <Intro />
      <Mercado />
      <Publico />
      <Conceito />
      <Tipografia />
      <Cores />
      <Marca />
      <Frases />
      <Pecas title={project.title} images={images} />
      <BolsosBand />
    </div>
  );
}