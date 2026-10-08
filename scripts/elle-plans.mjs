#!/usr/bin/env node
// Prepara os planos de governo oficiais (PDFs do TSE) para a Elle consultar.
//
// Como usar (o TSE bloqueia download automático, então os PDFs entram por arquivo):
//   1. No site do TSE, baixe o PDF de cada plano (botão "Baixar propostas em PDF").
//   2. Rode:   npm.cmd run elle:plans -- --from "C:\\caminho\\da\\pasta\\com\\os\\pdfs"
//      (sem --from, usa a pasta src/content/elle/plans/pdf)
//   O script acha o PDF do Flávio e o da Lula pelo nome do arquivo e grava os trechos em
//   src/content/elle/plans/*.json. Rode de novo sempre que o TSE publicar uma versão nova.
//
// Outros modos:
//   --dry              mostra o que seria gravado, sem gravar
//   --dump <arquivo>   imprime o texto extraído de um PDF (para conferir)
//   --flavio <pdf> --lula <pdf>   caminhos explícitos

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractText, getDocumentProxy } from "unpdf";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plansDir = join(root, "src", "content", "elle", "plans");

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] ?? true) : null;
};
const dry = args.includes("--dry");

const fold = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function readPdf(path) {
  const buf = readFileSync(path);
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  return { buf, totalPages, pages: text };
}

/** Limpa quebras de linha de PDF sem perder parágrafos. */
function clean(page) {
  return page
    .replace(/\r/g, "")
    .replace(/-\n(?=[a-zà-ú])/g, "") // palavra hifenizada na quebra de linha
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Divide cada página em trechos de ~450–900 caracteres, em fim de frase, mantendo o número da página. */
function chunk(pages) {
  const out = [];
  pages.forEach((raw, i) => {
    const text = clean(raw).replace(/\n(?!\n)/g, " ");
    if (text.length < 80) return;
    const sentences = text.match(/[^.!?;:]+[.!?;:]+\s*|[^.!?;:]+$/g) ?? [text];
    let cur = "";
    const flush = () => {
      const t = cur.replace(/\s+/g, " ").trim();
      cur = "";
      if (t.length < 80) return;
      // Sumário e índices (linhas de pontinhos ou quase só números) não ajudam a achar propostas.
      if (/(\.\s?){8,}/.test(t)) return;
      const letters = (t.match(/\p{L}/gu) ?? []).length;
      if (letters / t.length < 0.55) return;
      out.push({ page: i + 1, text: t });
    };
    for (const s of sentences) {
      if ((cur + s).length > 900 && cur.length >= 450) flush();
      cur += s;
    }
    flush();
  });
  return out;
}

async function dump(path) {
  const { totalPages, pages } = await readPdf(path);
  console.log(`# ${path} (${totalPages} páginas)\n`);
  pages.forEach((p, i) => console.log(`\n----- página ${i + 1} -----\n${clean(p)}`));
}

function findPdf(dir, who) {
  if (!existsSync(dir)) return null;
  const hit = readdirSync(dir).find((f) => f.toLowerCase().endsWith(".pdf") && fold(f).includes(who));
  return hit ? join(dir, hit) : null;
}

async function ingest(id, pdfPath, file) {
  const jsonPath = join(plansDir, file);
  const meta = JSON.parse(readFileSync(jsonPath, "utf8"));
  const { buf, totalPages, pages } = await readPdf(pdfPath);
  const passages = chunk(pages);
  const chars = passages.reduce((a, p) => a + p.text.length, 0);
  const perPage = chars / Math.max(1, totalPages);

  console.log(`\n${meta.candidate.name} (${meta.candidate.party}) — ${pdfPath}`);
  console.log(`  páginas: ${totalPages} | trechos: ${passages.length} | caracteres: ${chars.toLocaleString("pt-BR")} | média por página: ${Math.round(perPage)}`);
  if (perPage < 400) {
    console.warn("  ATENÇÃO: pouco texto por página. O PDF pode ser escaneado (imagem) e a leitura pode estar incompleta.");
  }

  const next = {
    ...meta,
    status: passages.length ? "ready" : "pending",
    source: {
      ...meta.source,
      extracted_at: new Date().toISOString(),
      sha256: createHash("sha256").update(buf).digest("hex"),
      pages: totalPages,
    },
    passages,
  };
  if (dry) return;
  writeFileSync(jsonPath, `${JSON.stringify(next, null, 1)}\n`, "utf8");
  console.log(`  gravado: src/content/elle/plans/${file}`);
}

async function main() {
  const d = flag("--dump");
  if (d) return dump(String(d));

  const from = flag("--from");
  const dir = typeof from === "string" ? resolve(from) : join(plansDir, "pdf");
  const flavio = typeof flag("--flavio") === "string" ? resolve(flag("--flavio")) : findPdf(dir, "flavio");
  const lula = typeof flag("--lula") === "string" ? resolve(flag("--lula")) : findPdf(dir, "lula");

  if (!flavio && !lula) {
    console.error(`Nenhum PDF encontrado em ${dir}.\nO nome do arquivo precisa conter "flavio" ou "lula".`);
    process.exit(1);
  }
  if (flavio) await ingest("flavio", flavio, "flavio-bolsonaro.json");
  else console.warn("PDF do Flávio não encontrado: mantido como estava.");
  if (lula) await ingest("lula", lula, "lula.json");
  else console.warn("PDF da Lula não encontrado: mantido como estava.");
  console.log(dry ? "\n(modo --dry: nada foi gravado)" : "\nPronto. Os trechos já estão disponíveis para a Elle.");
}

main().catch((e) => {
  console.error("Falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
