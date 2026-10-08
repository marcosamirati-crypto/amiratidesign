import "server-only";
import { getConfig } from "./config";
import { generateJson } from "./llm";
import { READ_SYSTEM } from "./prompts";
import { parseReading, READING_SCHEMA, type Reading } from "./schemas";

export interface ImageInput {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
}

/**
 * OCR + visão multimodal numa só chamada: devolve uma representação estruturada
 * (texto cru, afirmações, entidades, eixos, perguntas de pesquisa), não só uma string.
 */
export async function readScreenshot(image: ImageInput, signal: AbortSignal): Promise<Reading> {
  const c = getConfig();
  return generateJson<Reading>({
    model: c.modelRead,
    system: READ_SYSTEM,
    content: [
      { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.base64 } },
      { type: "text", text: "Leia este print e devolva a leitura estruturada." },
    ],
    schema: READING_SCHEMA as unknown as Record<string, unknown>,
    effort: "low",
    // O "pensamento" adaptativo do modelo conta contra este limite: folga grande para a resposta nunca ser cortada.
    maxTokens: 8000,
    signal,
    parse: parseReading,
  });
}
