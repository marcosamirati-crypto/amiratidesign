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
