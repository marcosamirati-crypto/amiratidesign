import { aiEnabled } from "@/lib/zito/ai";

// Survival or Dice (/zito): o que o app estático precisa saber do servidor.
// URL e chave anon do Supabase são públicas por natureza (o app só usa o Realtime para
// retransmitir mensagens criptografadas entre os aparelhos; nada é gravado no banco).
export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(
    JSON.stringify({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
      ai: aiEnabled(),
    }),
    { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
  );
}
