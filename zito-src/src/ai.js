// Três tarefas de IA, sempre como assistente do Mestre: interpretar a
// narração, escrever a crônica e responder pelo códice. Duas origens:
// a capacidade "sample" do Claude (página no Claude) ou a rota do servidor
// do portfólio (site aberto), que guarda a chave da Anthropic.
import { normalizeClaude, interpretPrompt } from './interpret.js';

export function chroniclePrompt(plain) {
  return `Escreva em português do Brasil a crônica de uma sessão do RPG Survival or Dice, criado por Zito, a partir dos registros abaixo. Use só os fatos dos registros: não invente nomes, lugares, criaturas nem consequências. Narre em terceira pessoa, no passado, em 3 a 6 parágrafos curtos, com frases de ritmo variado e sem travessões. Não inclua título nem assinatura.\n\nRegistros:\n${plain}`;
}
export function askPrompt(bible, notes, q) {
  return `Você é o assistente de bastidores do Mestre de Survival or Dice, RPG criado por Zito. Responda em português do Brasil usando SOMENTE a bíblia abaixo. Cite a fonte entre colchetes como aparece nela (ex.: [RS p.3]). Se a bíblia não responder, diga que é uma lacuna e não invente. Você sugere; quem decide é o Mestre.\n\nBÍBLIA:\n${bible}\n\nNOTAS DO MESTRE:\n${(notes || []).map(n => '- ' + n.text).join('\n')}\n\nPERGUNTA: ${q}`;
}

// --- dentro do Claude
export function sampleAI(sample) {
  return {
    source: 'Claude',
    async interpret(text, ctx) { const out = await sample.json(interpretPrompt(text, ctx), { modelTier: 'default', cache: false }); return normalizeClaude(out, ctx, text); },
    async chronicle(plain, onText) { const r = await sample(chroniclePrompt(plain), { modelTier: 'default', cache: false, onText: ({ text }) => onText && onText(text) }); return r.text; },
    async ask(bible, notes, q, onText) { const r = await sample(askPrompt(bible, notes, q), { modelTier: 'default', onText: ({ text }) => onText && onText(text) }); return r.text; },
  };
}

// --- no site aberto: rota do servidor, que monta os pedidos e guarda a chave
export function apiAI(base = '/api/zito/ai') {
  const post = async body => {
    const r = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ ok: false, code: 'bad_response' }));
    if (!r.ok || !j.ok) throw { code: j.code || (r.status === 429 ? 'rate_limited' : 'unavailable') };
    return j;
  };
  return {
    source: 'Claude',
    async interpret(text, ctx) { const j = await post({ task: 'interpret', text, ctx: slimCtx(ctx) }); return normalizeClaude(j.data, ctx, text); },
    async chronicle(plain) { return (await post({ task: 'chronicle', plain })).text; },
    async ask(_bible, notes, q) { return (await post({ task: 'ask', notes: (notes || []).map(n => n.text).slice(-30), question: q })).text; },
  };
}
const slimCtx = ctx => ({
  roster: (ctx.roster || []).slice(0, 12).map(r => ({ uid: r.uid, charName: r.charName, playerName: r.playerName, placeName: r.placeName || null, vida: r.vida, sanidade: r.sanidade, inv: (r.inv || []).slice(0, 40).map(i => ({ name: i.name, qty: i.qty })) })),
  places: (ctx.places || []).slice(0, 80),
  resources: (ctx.resources || []).slice(0, 10),
});
