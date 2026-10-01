import type { ReactElement } from "react";
import type { Project } from "@/lib/types";
import SantePage from "./SantePage";
import TudoPage from "./tudo/TudoPage";

/**
 * Páginas de marca com layout próprio, pelo slug do projeto. Para um novo cliente (ex.: LUBO):
 * crie o conteúdo em src/content/brands/<cliente>.ts, o componente da página e registre aqui.
 */
export const brandPages: Record<string, (props: { project: Project; images: string[] }) => ReactElement> = {
  "sante-burger": SantePage,
  "tudo-aqui": TudoPage,
};