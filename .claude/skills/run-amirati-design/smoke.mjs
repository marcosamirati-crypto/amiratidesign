// Smoke test do site rodando em BASE (padrão http://localhost:3000). Uso: node .claude/skills/run-amirati-design/smoke.mjs
const BASE = process.env.BASE ?? "http://localhost:3000";
let failed = 0;

async function check(path, { status = 200, has = [], redirect } = {}) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  const body = await res.text();
  const problems = [];
  if (redirect) {
    if (res.status < 300 || res.status >= 400 || !(res.headers.get("location") ?? "").includes(redirect))
      problems.push(`esperava redirect para ${redirect}, veio ${res.status} ${res.headers.get("location")}`);
  } else if (res.status !== status) problems.push(`status ${res.status} (esperado ${status})`);
  for (const s of has) if (!body.includes(s)) problems.push(`faltou "${s}"`);
  console.log(problems.length ? "FAIL" : "ok  ", path, problems.join("; "));
  if (problems.length) failed++;
}

await check("/", { has: ["Admirável", "Aurora Café", "O que você recebe","Processo", "api.whatsapp.com"] });
await check("/projetos/aurora-cafe", { has: ["Outros projetos", "og:image", "Identidade Visual"] });
await check("/projetos/nao-existe", { status: 404 });
await check("/placeholder/pulso-fit-0", { has: ["<svg"] });
await check("/sitemap.xml", { has: ["/projetos/pulso-fit"] });
await check("/robots.txt", { has: ["Disallow: /admin"] });
await check("/admin", { redirect: "/admin/login" });
await check("/admin/login", { has: ["Entrar"] });

process.exit(failed ? 1 : 0);
