import { BESTIARIO, BIBLE, CODEX_VERSION } from "@/lib/zito/codex";

// Survival or Dice (/zito): bíblia e bestiário, carregados pelo aparelho do Mestre e
// guardados no banco dele, com leitura bloqueada para os jogadores.
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(JSON.stringify({ version: CODEX_VERSION, bible: BIBLE, bestiario: BESTIARIO }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300", "X-Robots-Tag": "noindex, nofollow" },
  });
}
