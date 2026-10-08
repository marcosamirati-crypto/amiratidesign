import "server-only";

/** Minúsculas, sem acentos e sem pontuação: para comparar textos sem se enganar com formatação. */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%$,.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Corta em fim de frase (ou de palavra) quando o texto passa muito do limite. Não mexe se estiver perto. */
export function clampText(s: unknown, max: number): string {
  const text = typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";
  const hard = Math.round(max * 1.35);
  if (text.length <= hard) return text;
  const cut = text.slice(0, hard);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  if (lastStop > max * 0.5) return cut.slice(0, lastStop + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : hard).replace(/[,;:\s]+$/, "")}…`;
}

/** Números citados no texto, normalizados (vírgula decimal = ponto), ignorando dígitos soltos. */
export function numbersIn(s: string): string[] {
  const out: string[] = [];
  const re = /\d[\d.,]*\d|\d/g;
  for (const m of s.matchAll(re)) {
    const raw = m[0];
    // "1.234,5" -> "1234.5"; "5,6" -> "5.6"; "2026" -> "2026"
    let n = raw;
    if (n.includes(",") && n.includes(".")) n = n.replace(/\./g, "").replace(",", ".");
    else if (n.includes(",")) n = n.replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(n)) n = n.replace(/\./g, "");
    n = n.replace(/\.$/, "");
    if (n.length >= 2) out.push(n);
  }
  return out;
}

/** Hostname sem "www.". Null se a URL for inválida ou não for http(s). */
export function hostnameOf(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** URL sem parâmetros de rastreio nem âncora, para achar duplicatas. */
export function canonicalUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    for (const k of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_|ref$|ref_)/i.test(k)) u.searchParams.delete(k);
    }
    u.hostname = u.hostname.replace(/^www\./, "");
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/**
 * Cabe em `max` caracteres (contados por símbolo, como as redes contam): tira frases do fim até caber;
 * se a primeira frase sozinha for grande demais, corta na última palavra com reticências.
 */
export function fitChars(s: string, max: number): string {
  const text = s.replace(/\s+/g, " ").trim();
  const len = (t: string) => Array.from(t).length;
  if (len(text) <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [text];
  let out = "";
  for (const sent of sentences) {
    const next = (out + sent).trim();
    if (len(next) > max) break;
    out = next;
  }
  if (out) return out;
  let cut = "";
  for (const w of text.split(" ")) {
    const next = cut ? `${cut} ${w}` : w;
    if (len(next) > max - 1) break;
    cut = next;
  }
  return `${cut.replace(/[,;:\s]+$/, "")}…`;
}

/** "Padrão" + " Fonte: Nome" dentro de 280 caracteres. Null quando não há fonte citada. */
export function withSource(standard: string, sourceName: string | null): string | null {
  if (!sourceName || !standard) return null;
  const suffix = ` Fonte: ${sourceName}`;
  const sl = Array.from(suffix).length;
  if (sl > 60) return null;
  // Se a IA já escreveu "Fonte: …" no fim, tira: a fonte certa é a que o código monta, não a que ela escreveu.
  const clean = standard.replace(/\s*Fonte:.*$/is, "").trim();
  const base = fitChars(clean, 280 - sl);
  return base ? `${base}${suffix}` : null;
}

export function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}
