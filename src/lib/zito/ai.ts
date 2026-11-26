import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { BIBLE } from "./codex";

// IA do Survival or Dice (/zito): assistente de bastidores do Mestre.
// A chave fica só aqui no servidor. O navegador manda dados estruturados e
// este arquivo monta os pedidos; ninguém consegue usar a rota como um chat livre.

const MODEL = (process.env.ZITO_MODEL ?? "claude-sonnet-5-5").trim();
export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY && process.env.ZITO_AI !== "0";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 45_000 }));

async function complete(system: string, user: string, maxTokens: number): Promise<string> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  });
  if (res.stop_reason === "refusal") throw new Error("refusal");
  return res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
}

// ---------- limite de uso (melhor esforço, por instância) ----------
const hits = new Map<string, number[]>();
export function allow(key: string, perTenMin = 30, perDay = 300): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < 86_400_000);
  if (list.filter((t) => now - t < 600_000).length >= perTenMin || list.length >= perDay) { hits.set(key, list); return false; }
  list.push(now); hits.set(key, list);
  if (hits.size > 3000) for (const [k, v] of hits) if (!v.some((t) => now - t < 86_400_000)) hits.delete(k);
  return true;
}
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local").slice(0, 64);
}

// ---------- tipos do pedido ----------
type Item = { name: string; qty: number };
type RosterIn = { uid: string; charName: string; playerName: string; placeName: string | null; vida: number; sanidade: number; inv: Item[] };
type Ctx = { roster: RosterIn[]; places: { id: string; name: string }[]; resources: { key: string; label: string }[] };

const str = (v: unknown, n: number) => String(v ?? "").slice(0, n);
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);
export function cleanCtx(raw: unknown): Ctx {
  const c = (raw ?? {}) as Record<string, unknown>;
  const roster = (Array.isArray(c.roster) ? c.roster : []).slice(0, 12).map((r: Record<string, unknown>) => ({
    uid: str(r.uid, 40), charName: str(r.charName, 60), playerName: str(r.playerName, 40), placeName: r.placeName ? str(r.placeName, 60) : null,
    vida: num(r.vida), sanidade: num(r.sanidade),
    inv: (Array.isArray(r.inv) ? r.inv : []).slice(0, 40).map((i: Record<string, unknown>) => ({ name: str(i.name, 60), qty: num(i.qty) })),
  }));
  const places = (Array.isArray(c.places) ? c.places : []).slice(0, 80).map((p: Record<string, unknown>) => ({ id: str(p.id, 40), name: str(p.name, 60) }));
  const resources = (Array.isArray(c.resources) ? c.resources : []).slice(0, 10).map((r: Record<string, unknown>) => ({ key: str(r.key, 40), label: str(r.label, 40) }));
  return { roster, places, resources };
}

// ---------- 1. interpretar a narração (só prévia; o Mestre confirma) ----------
const INTERPRET_SYSTEM = `Você é o assistente de bastidores do Mestre de um RPG de mesa chamado Survival or Dice, criado por Zito. Você NÃO decide nada: só organiza a narração em uma prévia que o Mestre vai revisar.

Regras:
1. Divida a narração em trechos e classifique cada um como: narracao, alteracao, decisao, hipotese, pergunta, dialogo, nao_confirmado.
2. Hipóteses ("talvez", "se", "poderia"), perguntas, diálogos, boatos e negações NUNCA geram alterações.
3. Só proponha alterações para acontecimentos narrados como concluídos.
4. Não invente itens, números, lugares ou consequências que não estejam na narração. Se a quantidade não foi dita, use qty 1 e marque "qtdIncerta": true.
5. Para deslocamento, use placeId de um local existente quando o nome bater; senão placeId null e o nome dito.
6. "o grupo", "todos", "eles" = todos os uids.
7. Status existentes na ficha: vida, sanidade, bemEstar, xp. NÃO existem fome, sede nem moeda, a menos que apareçam em "Recursos".

Responda só com JSON, sem texto fora dele, neste formato:
{"resumo":"uma frase","trechos":[{"texto":"...","tipo":"narracao"}],"alteracoes":[
 {"tipo":"move","uids":["..."],"local":"nome","placeId":null,"evidencia":"trecho"},
 {"tipo":"stat","uid":"...","campo":"vida|sanidade|bemEstar|xp","delta":-3,"evidencia":"..."},
 {"tipo":"item_add","uid":"...","nome":"...","qty":1,"qtdIncerta":false,"evidencia":"..."},
 {"tipo":"item_remove","uid":"...","nome":"...","qty":1,"evidencia":"..."},
 {"tipo":"resource","uid":"...","key":"...","delta":3,"evidencia":"..."},
 {"tipo":"condition_add","uid":"...","nome":"...","evidencia":"..."},
 {"tipo":"condition_remove","uid":"...","nome":"...","evidencia":"..."}
]}`;

function parseJson(text: string): unknown {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("bad json");
  return JSON.parse(text.slice(a, b + 1));
}

export async function interpret(text: string, ctx: Ctx): Promise<unknown> {
  const roster = ctx.roster.map((r) => ({ uid: r.uid, personagem: r.charName, jogador: r.playerName, local: r.placeName, vida: r.vida, sanidade: r.sanidade, mochila: r.inv.map((i) => `${i.qty}× ${i.name}`) }));
  const user = `Narração do Mestre (transcrita, pode ter erros de reconhecimento de voz):
"""${text}"""

Personagens na mesa (use só estes uid):
${JSON.stringify(roster)}

Locais já existentes no mapa: ${JSON.stringify(ctx.places.map((p) => ({ id: p.id, nome: p.name })))}
Recursos contáveis ativos na sessão: ${JSON.stringify(ctx.resources.map((r) => ({ key: r.key, nome: r.label })))}`;
  return parseJson(await complete(INTERPRET_SYSTEM, user, 2500));
}

// ---------- 2. crônica ----------
export async function chronicle(plain: string): Promise<string> {
  return (await complete(
    "Você escreve crônicas de sessões do RPG Survival or Dice, criado por Zito. Use só os fatos dos registros: não invente nomes, lugares, criaturas nem consequências. Português do Brasil, terceira pessoa, passado, 3 a 6 parágrafos curtos, ritmo variado, sem travessões. Sem título e sem assinatura.",
    `Registros:\n${plain}`, 1800)).trim();
}

// ---------- 3. perguntar ao códice ----------
export async function ask(question: string, notes: string[]): Promise<string> {
  return (await complete(
    `Você é o assistente de bastidores do Mestre de Survival or Dice, RPG criado por Zito. Responda em português do Brasil usando SOMENTE a bíblia abaixo e as notas do Mestre. Cite a fonte entre colchetes como aparece na bíblia (ex.: [RS p.3]). Se a bíblia não responder, diga que é uma lacuna e não invente. Você sugere; quem decide é o Mestre.\n\nBÍBLIA:\n${BIBLE}`,
    `NOTAS DO MESTRE:\n${notes.map((n) => "- " + n).join("\n") || "(nenhuma)"}\n\nPERGUNTA: ${question}`, 1200)).trim();
}
