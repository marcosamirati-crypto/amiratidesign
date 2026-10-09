import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ElleErrorCode } from "../types";

export class ElleError extends Error {
  constructor(
    public code: ElleErrorCode,
    message?: string,
    public retryable = true,
  ) {
    super(message ?? code);
    this.name = "ElleError";
  }
}

/** Traduz qualquer exceção em um erro humano para a interface. Nunca vaza detalhes técnicos. */
export function toElleError(err: unknown): ElleError {
  if (err instanceof ElleError) return err;
  if (err instanceof Anthropic.APIUserAbortError) return new ElleError("timeout", "abort");
  if (err instanceof Anthropic.APIConnectionTimeoutError) return new ElleError("timeout", "api timeout");
  if (err instanceof Anthropic.RateLimitError) return new ElleError("unavailable", "api rate limit");
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new ElleError("unavailable", "api auth", false);
  }
  if (err instanceof Anthropic.APIError) {
    // Créditos da API acabaram: a Anthropic responde 400 com "credit balance". Vira "unavailable"
    // (a pessoa vê que o Elle está fora do ar, não um erro genérico) e o log diz "api 400 credit".
    if (err.status === 400 && /credit balance/i.test(err.message)) {
      return new ElleError("unavailable", "api 400 credit", false);
    }
    // 400 com imagem inválida, 5xx etc.
    return new ElleError(err.status && err.status >= 500 ? "unavailable" : "unknown", `api ${err.status}`);
  }
  if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
    return new ElleError("timeout", err.name);
  }
  return new ElleError("unknown", err instanceof Error ? err.message : "unknown");
}
