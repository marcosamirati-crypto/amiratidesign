// Lê de volta os briefings guardados na tabela `messages` (ver sendBriefing em app/actions.ts).
// O briefing é salvo como texto: "BRIEFING — X" / "Contato: nome · email · whats" / "1. Pergunta" + resposta…
// Aqui esse texto vira uma ficha estruturada para o painel /admin/briefings e para o e-mail de aviso.

import { briefingQuestions } from "@/content/briefing";

export const BRIEFING_PREFIX = "Briefing · ";

export type BriefingAnswer = { n: number; title: string; answer: string; id?: string };

export type Briefing = {
  empresa: string;
  nome: string;
  email: string;
  whatsapp: string;
  answers: BriefingAnswer[];
  truncated: boolean;
};

export const isBriefing = (name: string) => name.startsWith(BRIEFING_PREFIX);

export function parseBriefing(name: string, email: string, text: string): Briefing {
  const lines = text.replace(/\r/g, "").split("\n");
  const empresaFromName = name.startsWith(BRIEFING_PREFIX) ? name.slice(BRIEFING_PREFIX.length) : name;

  let nome = "";
  let whatsapp = "";
  const contato = lines.find((l) => l.startsWith("Contato: "));
  if (contato) {
    const parts = contato.slice("Contato: ".length).split(" · ");
    nome = parts[0] ?? "";
    whatsapp = parts.slice(2).join(" · ");
  }

  const answers: BriefingAnswer[] = [];
  const start = contato ? lines.indexOf(contato) + 1 : 1;
  let current: BriefingAnswer | null = null;
  let body: string[] = [];
  const flush = () => {
    if (!current) return;
    current.answer = body.join("\n").trim();
    answers.push(current);
  };

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const m = /^(\d{1,2})\. (.+)$/.exec(line);
    const expected: number = answers.length + (current ? 2 : 1);
    const prevBlank = i === start || lines[i - 1].trim() === "";
    // Se a pergunta desse número ainda existe com o mesmo título, exige o título exato (protege contra
    // respostas que tenham uma linha começando com "2. …"). Perguntas antigas/editadas caem no caso geral.
    const known = briefingQuestions[expected - 1]?.title;
    const titleOk = !m || !known || !text.includes(`\n${expected}. ${known}\n`) || m[2].trim() === known;
    if (m && Number(m[1]) === expected && prevBlank && titleOk) {
      flush();
      const title = m[2].trim();
      const q = briefingQuestions.find((x) => x.title === title);
      current = { n: expected, title, answer: "", id: q?.id };
      body = [];
    } else if (current) {
      body.push(line);
    }
  }
  flush();

  const truncated = text.endsWith("[continua…]");
  if (truncated && answers.length) {
    const last = answers[answers.length - 1];
    last.answer = last.answer.replace(/\[continua…\]$/, "").trim();
  }

  return { empresa: empresaFromName, nome: nome || empresaFromName, email, whatsapp, answers, truncated };
}

export const answerOf = (b: Briefing, id: string) => {
  const a = b.answers.find((x) => x.id === id)?.answer ?? "";
  return a === "(sem resposta)" ? "" : a;
};

/** Link wa.me a partir do que a pessoa digitou. Números com 10–11 dígitos ganham o 55 do Brasil. */
export function whatsappLink(raw: string, text?: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
