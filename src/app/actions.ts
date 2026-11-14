"use server";

import { createPublicClient, hasSupabase } from "@/lib/supabase/server";

export type FormState = { ok: boolean; error?: string } | null;

export async function sendMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const message = String(fd.get("message") ?? "").trim();
  const honeypot = String(fd.get("website") ?? "");

  if (honeypot) return { ok: true }; // bot
  if (!name || !email || !message) return { ok: false, error: "Preencha todos os campos." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "E-mail inválido." };
  if (!hasSupabase) return { ok: false, error: "Formulário ainda não conectado ao Supabase. Use o WhatsApp." };

  const { error } = await createPublicClient()
    .from("messages")
    .insert({ name: name.slice(0, 120), email: email.slice(0, 200), message: message.slice(0, 4000) });
  if (error) return { ok: false, error: "Não foi possível enviar agora. Tente o WhatsApp." };
  return { ok: true };
}

/* ───────── Briefing (/briefing) ─────────
   Guarda as respostas na mesma tabela de mensagens (aparecem em /admin/mensagens) e devolve o texto
   formatado, que a página oferece para enviar também pelo WhatsApp ou copiar. */
export type BriefingState = { ok: boolean; saved: boolean; error?: string; text?: string } | null;

export async function sendBriefing(_prev: BriefingState, fd: FormData): Promise<BriefingState> {
  const { briefingQuestions } = await import("@/content/briefing");
  const get = (k: string) => String(fd.get(k) ?? "").trim();

  if (get("website")) return { ok: true, saved: true }; // bot
  const nome = get("nome").slice(0, 80);
  const empresa = get("empresa").slice(0, 80);
  const email = get("email").slice(0, 200);
  const whatsapp = get("whatsapp").slice(0, 40);
  if (!nome || !email) return { ok: false, saved: false, error: "Preencha nome e e-mail." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, saved: false, error: "E-mail inválido." };

  const lines = [
    `BRIEFING — ${empresa || nome}`,
    `Contato: ${nome} · ${email}${whatsapp ? ` · ${whatsapp}` : ""}`,
    "",
  ];
  briefingQuestions.forEach((q, i) => {
    const picks = fd.getAll(`q_${q.id}`).map((v) => String(v).trim()).filter(Boolean);
    const detail = get(`q_${q.id}_detalhe`);
    const answer = [picks.join(", "), detail].filter(Boolean).join(" — ").slice(0, 1500);
    lines.push(`${i + 1}. ${q.title}`, answer || "(sem resposta)", "");
  });
  const text = lines.join("\n").trim();

  if (!hasSupabase) return { ok: true, saved: false, text };
  const { error } = await createPublicClient()
    .from("messages")
    .insert({
      name: `Briefing · ${empresa || nome}`.slice(0, 120),
      email,
      message: text.length > 4000 ? `${text.slice(0, 3980)}\n[continua…]` : text,
    });
  return { ok: true, saved: !error, text };
}
