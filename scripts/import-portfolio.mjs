// Importa as pastas "IDENTIDADES VISUAIS" e "SOCIAL MEDIA" (ao lado do projeto) para o Supabase.
//   npm run import:dry   -> só mostra o que seria importado (sem rede, sem senha)
//   npm run import      -> pede e-mail/senha do admin e envia tudo (otimizado em WebP)
// Rodar de novo é seguro: os arquivos são sobrescritos e os projetos atualizados pelo slug.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");
const ROOT = path.resolve(process.cwd(), "..");
const IDS = path.join(ROOT, "IDENTIDADES VISUAIS");
const SOCIAL = path.join(ROOT, "SOCIAL MEDIA");
const SEED_SLUGS = ["aurora-cafe", "nordeste-studio", "pulso-fit", "mare-alta"];

// ───────── definição dos projetos ─────────
const num = (s) => Number((s.match(/\d+/) ?? [0])[0]);
const byNumber = (a, b) => num(a) - num(b);
const isImg = (f) => /\.(png|jpe?g|webp)$/i.test(f);

function listIdentity(dir, pick) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(isImg);
  return pick(files).map((f) => path.join(dir, f));
}

const identities = [
  {
    slug: "sante-burger", title: "Santé Burger", type: "identidade-visual", order: 1, published: true,
    files: listIdentity(path.join(IDS, "SANTE BURGER"), (fs) => fs.filter((f) => /^Prancheta/i.test(f)).sort(byNumber)),
  },
  {
    slug: "lubo", title: "LUBO", type: "identidade-visual", order: 2, published: true,
    files: listIdentity(path.join(IDS, "LUBO"), (fs) => fs.filter((f) => /^Prancheta/i.test(f)).sort(byNumber)),
  },
  {
    slug: "tudo-aqui", title: "Tudo Aqui", type: "identidade-visual", order: 3, published: true,
    files: listIdentity(path.join(IDS, "TUDO AQUI"), (fs) => fs.filter((f) => /^Prancheta/i.test(f)).sort(byNumber)),
  },
  {
    // ordem sugerida; ajuste no admin se quiser
    slug: "farol", title: "FAROL", type: "identidade-visual", order: 4, published: true,
    files: listIdentity(path.join(IDS, "FAROL", "Nova pasta"), (fs) => {
      const want = ["img01", "img02", "alltype", "ilustração01", "ilustração02", "ilustração03", "cartãodevisitas", "mockupcaderno", "mockuppapeltimbrado"];
      return want.map((w) => fs.find((f) => f.toLowerCase().normalize("NFC").includes(w.normalize("NFC")))).filter(Boolean);
    }),
  },
  {
    // nome do cliente não confirmado: entra como RASCUNHO
    slug: "benvinda", title: "Benvinda", type: "identidade-visual", order: 5, published: false,
    files: fs.existsSync(SOCIAL)
      ? fs.readdirSync(SOCIAL).filter((f) => /BENVINDA/i.test(f) && isImg(f)).sort().map((f) => path.join(SOCIAL, f))
      : [],
  },
];

const CLIENTS = {
  CIN: "Cine +",
  AUS: "Audium Systems",
  ADS: "Audium Systems",
  SNT: "Sonitécnica",
  FPC: "Força pra Crescer",
  LAB: "Laboratórios Culturais",
  CEC: "Ceará Criativo",
};
const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function socialProjects() {
  const groups = new Map(); // nome do cliente -> { posts: Map(chave -> {date, items[]}) }
  for (const f of fs.existsSync(SOCIAL) ? fs.readdirSync(SOCIAL).filter(isImg) : []) {
    if (/BENVINDA/i.test(f)) continue;
    let code, date = "000000", post, idx = 1;
    const m = f.match(/^(\d{6})_([A-Z]+)-(.+?)(?:_(\d+))?\.\w+$/);
    if (m) { [, date, code, post] = m; idx = m[4] ? Number(m[4]) : 1; }
    else if (/^SONICETCNICA/i.test(f)) { code = "SNT"; post = "sonitecnica-extra"; idx = num(f); }
    else { console.warn("  ? ignorado (nome fora do padrão):", f); continue; }
    const client = CLIENTS[code];
    if (!client) { console.warn("  ? cliente desconhecido:", code, f); continue; }
    const g = groups.get(client) ?? new Map();
    const key = `${date}_${post}`; // mesmo nome em datas diferentes = posts diferentes
    const p = g.get(key) ?? { date, items: [] };
    p.items.push({ idx, file: path.join(SOCIAL, f) });
    g.set(key, p);
    groups.set(client, g);
  }
  const yymmdd = (d) => d.slice(4, 6) + d.slice(2, 4) + d.slice(0, 2);
  return [...groups.entries()].map(([client, posts], i) => {
    const ordered = [...posts.values()].sort((a, b) => yymmdd(b.date).localeCompare(yymmdd(a.date)));
    const files = [], covers = [];
    for (const p of ordered) {
      p.items.sort((a, b) => a.idx - b.idx);
      covers.push(p.items[0].file); // "01" do carrossel, ou o post único
      files.push(...p.items.map((x) => x.file));
    }
    const newest = ordered.map((p) => p.date).filter((d) => d !== "000000").map(yymmdd).sort().pop();
    return {
      slug: slugify(client), title: client, client, type: "social-media", order: 10 + i, published: true,
      year: newest ? 2000 + Number(newest.slice(0, 2)) : null,
      summary: `Artes e carrosséis para as redes sociais — ${client}.`,
      files, covers,
    };
  });
}

// Pasta FOTOGRAFIA (ao lado do projeto): fotos soltas viram o projeto "Fotografia";
// cada subpasta vira uma série (projeto) com o nome da pasta. Fotos .heic (iPhone) não são lidas: exporte como JPG.
const FOTO = path.join(ROOT, "FOTOGRAFIA");
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true });
function photoProjects() {
  if (!fs.existsSync(FOTO)) return [];
  const out = [];
  const entries = fs.readdirSync(FOTO, { withFileTypes: true });
  for (const e of entries) if (e.isFile() && /\.hei[cf]$/i.test(e.name)) console.warn(`  ? ignorado (HEIC não suportado, exporte como JPG): ${e.name}`);
  const loose = entries.filter((e) => e.isFile() && isImg(e.name)).map((e) => e.name).sort(natural).map((n) => path.join(FOTO, n));
  if (loose.length) out.push({ slug: "fotografia", title: "Fotografia", type: "fotografia", order: 30, published: true, files: loose });
  entries.filter((e) => e.isDirectory()).forEach((d, i) => {
    const dir = path.join(FOTO, d.name);
    const files = fs.readdirSync(dir).filter(isImg).sort(natural).map((n) => path.join(dir, n));
    out.push({ slug: slugify(d.name), title: d.name, type: "fotografia", order: 31 + i, published: true, files });
  });
  return out;
}

const projects = [...identities, ...socialProjects(), ...photoProjects()].filter((p) => p.files.length);

// ───────── simulação ─────────
console.log(`\nPasta base: ${ROOT}\n`);
for (const p of projects) {
  console.log(`• ${p.title} [${p.type}${p.published ? "" : ", RASCUNHO"}] — ${p.files.length} imagens${p.covers ? `, ${p.covers.length} capas/destaques` : ""}${p.year ? `, ${p.year}` : ""}`);
}
const skipped = [path.join(IDS, "FAROL", "Nova pasta", "FAROL_videogif.gif")].filter(fs.existsSync);
if (skipped.length) console.log(`\n(pulado: ${skipped.map((s) => path.basename(s)).join(", ")} — vídeo/GIF fica para quando o site aceitar vídeo)`);
if (fs.existsSync(path.join(IDS, "RENOVAR")) && !fs.readdirSync(path.join(IDS, "RENOVAR"), { recursive: true }).length)
  console.log("(pulado: pasta RENOVAR está vazia)");
console.log(`\nTotal: ${projects.length} projetos, ${projects.reduce((n, p) => n + p.files.length, 0)} imagens.`);
if (DRY) process.exit(0);

// ───────── envio ─────────
function loadEnv() {
  const env = {};
  const f = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(f)) return env;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
function ask(q, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => rl.output.write(s.includes(q) ? s : "*");
    rl.question(q, (a) => { rl.close(); if (hidden) console.log(); resolve(a.trim()); });
  });
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.error("Faltam as chaves do Supabase no .env.local"); process.exit(1); }
const supabase = createClient(url, key, { auth: { persistSession: false } });

console.log("\nEntre com o e-mail e a senha do admin (a senha não aparece na tela).");
const email = await ask("E-mail: ");
const password = await ask("Senha: ", true);
const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
if (authErr) { console.error("Login falhou:", authErr.message); process.exit(1); }
console.log("Login ok.");

// Não sobrescreve projetos que já existem (ex.: criados à mão no admin). Use --overwrite para forçar.
const OVERWRITE = process.argv.includes("--overwrite");
const { data: existing, error: exErr } = await supabase.from("projects").select("slug");
if (exErr) { console.error("Não consegui ler os projetos:", exErr.message); process.exit(1); }
const have = new Set((existing ?? []).map((r) => r.slug));
const skip = projects.filter((p) => have.has(p.slug) && !OVERWRITE).map((p) => p.title);
if (skip.length) console.log(`Já existem e serão mantidos como estão: ${skip.join(", ")}  (para sobrescrever: npm run import -- --overwrite)`);
console.log("Enviando…\n");

async function uploadOne(file, slug, n) {
  const buf = await sharp(file).rotate().resize({ width: 2400, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  const p = `import/${slug}/${String(n).padStart(3, "0")}.webp`;
  const { error } = await supabase.storage.from("projects").upload(p, buf, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
  if (error) throw new Error(`${path.basename(file)}: ${error.message}`);
  return supabase.storage.from("projects").getPublicUrl(p).data.publicUrl;
}

for (const p of projects) {
  if (have.has(p.slug) && !OVERWRITE) continue;
  process.stdout.write(`• ${p.title}: `);
  const urls = new Map();
  let n = 0;
  const queue = [...p.files];
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift();
      const i = ++n;
      urls.set(f, await uploadOne(f, p.slug, i));
      process.stdout.write(".");
    }
  };
  // preserva a ordem: índice fixo por arquivo
  const order = new Map(p.files.map((f, i) => [f, i + 1]));
  n = 0;
  const q2 = [...p.files];
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (q2.length) {
        const f = q2.shift();
        urls.set(f, await uploadOne(f, p.slug, order.get(f)));
        process.stdout.write(".");
      }
    }),
  );
  const images = p.files.map((f) => urls.get(f));
  const highlights = (p.covers ?? []).map((f) => urls.get(f));
  const row = {
    slug: p.slug, title: p.title, client: p.client ?? null, type: p.type, year: p.year ?? null,
    summary: p.summary ?? null, cover_url: highlights[0] ?? images[0], images, highlights,
    published: p.published, sort_order: p.order, updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("projects").upsert(row, { onConflict: "slug" });
  if (error) {
    console.error(`\n  Erro ao salvar "${p.title}": ${error.message}`);
    if (/highlights/.test(error.message)) console.error("  -> rode supabase/migrations/0002_highlights.sql no SQL Editor e tente de novo.");
    process.exit(1);
  }
  console.log(" ok");
}

const { error: delErr } = await supabase.from("projects").delete().in("slug", SEED_SLUGS);
console.log(delErr ? `\nNão consegui apagar os exemplos: ${delErr.message}` : "\nProjetos de exemplo removidos.");
console.log("Pronto! Abra o site em alguns segundos (ele atualiza a cada 1 minuto).");
