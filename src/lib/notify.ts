// Aviso automático por e-mail a cada briefing novo, via Resend (https://resend.com, plano gratuito).
// Variáveis (só no servidor):
//   RESEND_API_KEY        chave da Resend
//   BRIEFING_NOTIFY_TO    para onde vai o aviso (seu e-mail; sem domínio próprio verificado na Resend,
//                         precisa ser o mesmo e-mail da sua conta Resend)
//   RESEND_FROM           opcional. Padrão: "Amirati Design <onboarding@resend.dev>"
// Sem as duas primeiras, nada é enviado e o site segue funcionando normalmente.

import { answerOf, whatsappLink, type Briefing } from "@/lib/briefing";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const hasNotify = Boolean(process.env.RESEND_API_KEY && process.env.BRIEFING_NOTIFY_TO);

export async function notifyNewBriefing(b: Briefing, text: string, saved: boolean) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.BRIEFING_NOTIFY_TO;
  if (!key || !to) return;

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://marcosamirati.com").replace(/\/$/, "");
  const painel = `${site}/admin/briefings`;
  const wa = b.whatsapp ? whatsappLink(b.whatsapp, `Oi, ${b.nome.split(" ")[0]}! Aqui é o Amirati. Recebi seu briefing.`) : null;
  const objetivo = answerOf(b, "objetivo");
  const prazo = answerOf(b, "prazo");
  const palavras = answerOf(b, "palavras");

  const chip = (label: string, v: string) =>
    v
      ? `<tr><td style="padding:6px 0;color:#777;font-size:13px;width:110px;vertical-align:top">${label}</td><td style="padding:6px 0;font-size:14px">${esc(v)}</td></tr>`
      : "";
  const btn = (href: string, label: string, primary = false) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 18px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;${
      primary ? "background:#ea0637;color:#fff" : "border:1px solid #ddd;color:#111"
    }">${label}</a>`;

  const html = `<!doctype html><html><body style="margin:0;background:#f4f2ef;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
  <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#ea0637">/ Novo briefing</p>
  <h1 style="margin:0 0 4px;font-size:30px;line-height:1.05;letter-spacing:-.03em">${esc(b.empresa)}</h1>
  <p style="margin:0 0 24px;color:#555;font-size:15px">${esc(b.nome)} · <a href="mailto:${esc(b.email)}" style="color:#555">${esc(b.email)}</a>${b.whatsapp ? ` · ${esc(b.whatsapp)}` : ""}</p>
  <div style="background:#fff;border-radius:16px;padding:20px 22px;margin-bottom:24px">
    <table style="width:100%;border-collapse:collapse">${chip("Objetivo", objetivo)}${chip("Prazo / verba", prazo)}${chip("3 palavras", palavras)}</table>
  </div>
  <div style="margin-bottom:28px">${btn(painel, "Abrir a ficha completa", true)}${wa ? btn(wa, "Chamar no WhatsApp") : ""}</div>
  ${saved ? "" : `<p style="background:#fff4f4;border-radius:12px;padding:12px 14px;font-size:13px;color:#a00">Atenção: o briefing não foi salvo no banco. As respostas completas estão abaixo — guarde este e-mail.</p>`}
  <pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.55;color:#333;background:#fff;border-radius:16px;padding:20px 22px;margin:0">${esc(text)}</pre>
  <p style="margin:24px 0 0;font-size:12px;color:#999">Responda este e-mail para falar direto com ${esc(b.nome.split(" ")[0])}.</p>
</div></body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Amirati Design <onboarding@resend.dev>",
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        reply_to: b.email,
        subject: `Novo briefing: ${b.empresa}`,
        html,
        text: `Novo briefing de ${b.nome} (${b.email}).\n\nFicha: ${painel}\n\n${text}`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("[briefing] aviso por e-mail falhou:", res.status);
  } catch {
    console.error("[briefing] aviso por e-mail falhou: sem resposta da Resend");
  }
}
