import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "./config";
import { ElleError } from "./errors";

// Única porta de entrada para o modelo. Trocar de provedor de IA = reescrever só este arquivo.

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    // ANTHROPIC_BASE_URL (opcional) é lida pelo próprio SDK; serve para testes locais com servidor falso.
    client = new Anthropic({ apiKey: getConfig().anthropicKey, maxRetries: 1, timeout: 50_000 });
  }
  return client;
}

/** `effort` só existe nos modelos da família 5 em diante. */
function supportsEffort(model: string): boolean {
  return /^claude-(opus|sonnet|haiku|fable|mythos)-5/.test(model);
}

export type Effort = "low" | "medium" | "high";

export type UserContent = Anthropic.MessageParam["content"];

export interface JsonCall<T> {
  model: string;
  system: string;
  content: UserContent;
  /** JSON Schema da resposta (additionalProperties:false em todos os objetos). */
  schema: Record<string, unknown>;
  effort: Effort;
  maxTokens: number;
  signal: AbortSignal;
  /** Valida e normaliza o JSON bruto. Deve lançar se o formato estiver errado. */
  parse: (raw: unknown) => T;
}

export async function generateJson<T>(call: JsonCall<T>): Promise<T> {
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model: call.model,
    max_tokens: call.maxTokens,
    // O prompt de sistema é igual em toda análise: fica em cache e as próximas leituras dele custam ~5-10% do preço.
    system: [{ type: "text", text: call.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: call.content }],
    output_config: {
      format: { type: "json_schema", schema: call.schema },
      ...(supportsEffort(call.model) ? { effort: call.effort } : {}),
    },
  };

  const res = await getClient().messages.create(params, { signal: call.signal });

  if (res.stop_reason === "refusal") throw new ElleError("unreadable", "model refusal");
  if (res.stop_reason === "max_tokens") throw new ElleError("unknown", "max_tokens");

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ElleError("unknown", "bad json");
  }
  try {
    return call.parse(raw);
  } catch (e) {
    throw new ElleError("unknown", `bad shape: ${e instanceof Error ? e.message : "?"}`);
  }
}
