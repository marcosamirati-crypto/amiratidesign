// "Mestre fala, o sistema entende". Transforma narração em uma PRÉVIA de
// alterações. Nada é aplicado aqui: o Mestre revisa, edita e confirma.
// Dois motores: Claude (capacidade sample) e um intérprete local em
// português, usado quando o Claude não está disponível nesta visualização.
import { norm } from './ui.js';

export const KINDS = {
  narracao: { label: 'Narração', hint: 'acontecimento narrado' },
  alteracao: { label: 'Alteração de estado', hint: 'muda ficha, mochila ou local' },
  decisao: { label: 'Decisão do Mestre', hint: 'definição explícita' },
  hipotese: { label: 'Hipótese', hint: 'não aconteceu' },
  pergunta: { label: 'Pergunta', hint: 'não aconteceu' },
  dialogo: { label: 'Diálogo', hint: 'fala de personagem' },
  nao_confirmado: { label: 'Não confirmado', hint: 'boato, impressão' },
};

const NUM = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, cem: 100, cento: 100, duzentos: 200, trezentos: 300, quinhentos: 500, mil: 1000 };
const toNum = w => { if (w == null) return null; const n = norm(w).replace(/[^\w]/g, ''); if (/^\d+$/.test(n)) return +n; return NUM[n] ?? null; };
const cap1 = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
let seq = 0;
const cid = () => 'c' + (++seq) + Math.random().toString(36).slice(2, 6);

const GROUP = /\b(o grupo|todos|todas|eles|elas|a party|os jogadores|os personagens|o time|a equipe|voces|nos)\b/;

export function splitSentences(text) {
  return String(text || '').replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}

export function classify(s) {
  const n = norm(s);
  if (/\?\s*$/.test(s) || /\b(pergunta|perguntam|perguntou|quer saber|querem saber)\b/.test(n)) return 'pergunta';
  if (/^(talvez|se |caso |supondo|imagine|imaginando|quem sabe|pode ser que|e se)/.test(n) || /\b(talvez|poderia|poderiam|possivelmente|provavelmente|seria|seriam|pode ser que|caso)\b/.test(n)) return 'hipotese';
  if (/["“”«»]/.test(s) || /^\s*[-–—]\s/.test(s) || /\b(diz|disse|fala|falou|grita|gritou|sussurra|responde|respondeu)\s*:/.test(n)) return 'dialogo';
  if (/\b(parece|parecem|acha que|acham que|acredita|acreditam|rumor|rumores|dizem que|nao tem certeza|suspeita|suspeitam)\b/.test(n)) return 'nao_confirmado';
  if (/\b(o mestre decide|decido|decidi|fica decidido|esta decidido|confirmo|confirmado|oficialmente)\b/.test(n)) return 'decisao';
  return 'narracao';
}

function actorsIn(n, roster) {
  if (GROUP.test(n)) return roster.map(r => r.uid);
  const found = [];
  for (const r of roster) {
    const names = [r.charName, r.playerName, (r.charName || '').split(' ')[0]].filter(x => x && x.length > 1).map(norm);
    if (names.some(x => new RegExp('\\b' + x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(n))) found.push(r.uid);
  }
  return found;
}

const STOP_WORDS = new Set(['proximo','proxima','proximos','proximas','perto','ao','junto','sobre','embaixo','debaixo','dentro','em','no','na','nos','nas','pelo','pela','que','enquanto','quando','onde','depois','antes','durante','entre','e','com','para','do','da','dos','das']);
// Recorta a expressão do objeto no texto ORIGINAL (mantém acentos)
function objectPhrase(raw) {
  const clean = String(raw).replace(/[,.;!?:].*$/, '').trim();
  const toks = clean.split(/\s+/).filter(Boolean);
  let qty = 1, qtyKnown = true, i = 0;
  const f = norm(toks[0]);
  const q = toNum(toks[0]);
  if (q != null) { qty = q; i = 1; }
  else if (/^(o|a|os|as)$/.test(f)) i = 1;
  else if (/^(alguns|algumas|varios|varias|uns|umas)$/.test(f)) { qtyKnown = false; i = 1; }
  const out = [];
  for (; i < toks.length && out.length < 4; i++) {
    if (STOP_WORDS.has(norm(toks[i]))) break;
    out.push(toks[i]);
  }
  return { qty, qtyKnown, name: norm(out.join(' ')), label: out.join(' ') };
}
const orig = (s, n, part) => { const i = n.lastIndexOf(part); return i >= 0 ? s.slice(i, i + part.length) : part; };

function placePhrase(raw) {
  let p = raw.replace(/[,.;!?:].*$/, '').replace(/\s(e la|e ali|onde|quando|durante|enquanto|depois|apos|antes|com|para)\b.*$/i, '').trim();
  p = p.replace(/^(a|ao|à|as|às|aos|o|os|em|no|na|nos|nas|ate|até|para|pelo|pela|uma|um)\s+/i, '');
  p = p.replace(/^(a|o|uma|um)\s+/i, '');
  const w = p.split(' ').slice(0, 5).join(' ');
  return cap1(w);
}

const VERB_MOVE = /\b(chega|chegam|chegou|chegaram|entra|entram|entrou|entraram|alcanca|alcancam|segue|seguem|vai|vao|caminha|caminham|atravessa|atravessam|retorna|retornam|volta|voltam|sobe|sobem|desce|descem)\s+(?:ate\s+|para\s+|por\s+)?(a|ao|à|aos|as|às|em|no|na|nos|nas|ate|para|pelo|pela)\s+(.+)$/i;
const STAT = { vida: 'vida', sanidade: 'sanidade', 'bem-estar': 'bemEstar', 'bem estar': 'bemEstar', xp: 'xp', experiencia: 'xp' };

export function localInterpret(text, ctx) {
  const roster = ctx.roster || [];
  const places = ctx.places || [];
  const resources = ctx.resources || [];
  const segments = [];
  const changes = [];
  let lastActors = [];
  let lastFind = null;
  for (const s of splitSentences(text)) {
    let kind = classify(s);
    const n = norm(s);
    const negated = /\b(nao|nada|nenhum|nenhuma|nem)\b/.test(n);
    const before = changes.length;
    const named = actorsIn(n, roster);
    if (named.length) lastActors = named;
    if ((kind === 'narracao' || kind === 'decisao') && !negated) {
      let actors = named;
      if (!actors.length && /\b(ele|ela|eles|elas|dele|dela|deles|delas|seu|sua)\b/.test(n)) actors = lastActors;
      if (!actors.length && roster.length === 1) actors = [roster[0].uid];
      const ev = s;
      // deslocamento
      const mv = n.match(VERB_MOVE);
      if (mv) {
        const raw = orig(s, n, mv[3]);
        const name = placePhrase(raw);
        if (name) {
          const hit = places.find(p => norm(p.name) === norm(name)) || places.find(p => norm(name).includes(norm(p.name)) || norm(p.name).includes(norm(name)));
          changes.push({ id: cid(), on: true, t: 'move', uids: actors.length ? actors : roster.map(r => r.uid), place: hit ? hit.name : name, placeId: hit ? hit.id : null, evidence: ev });
        }
      }
      // dano, perdas e ganhos de status
      const dmg = n.match(/\b(perde|perdem|perdeu|perderam|sofre|sofrem|sofreu|leva|levam|levou|toma|tomam|tomou|recebe|recebem|recebeu)\s+(\S+)\s+(?:pontos?\s+)?(?:de\s+)?(dano|vida|sanidade|bem-estar|bem estar)\b/);
      if (dmg && toNum(dmg[2]) != null) {
        const key = dmg[3] === 'dano' ? 'vida' : STAT[dmg[3]];
        for (const u of actors) changes.push({ id: cid(), on: true, t: 'stat', uid: u, key, delta: -toNum(dmg[2]), evidence: ev });
      }
      const heal = n.match(/\b(recupera|recuperam|recuperou|cura|curam|curou|regenera|regeneram)\s+(\S+)\s+(?:pontos?\s+)?(?:de\s+)?(vida|sanidade|bem-estar|bem estar)\b/);
      if (heal && toNum(heal[2]) != null) for (const u of actors) changes.push({ id: cid(), on: true, t: 'stat', uid: u, key: STAT[heal[3]], delta: toNum(heal[2]), evidence: ev });
      const xp = n.match(/\b(ganha|ganham|ganhou|ganharam|recebe|recebem|recebeu|receberam)\s+(\S+)\s+(?:pontos?\s+)?(?:de\s+)?(xp|experiencia)\b/);
      if (xp && toNum(xp[2]) != null) for (const u of actors) changes.push({ id: cid(), on: true, t: 'stat', uid: u, key: 'xp', delta: toNum(xp[2]), evidence: ev });
      // itens encontrados
      const fnd = !dmg && !xp && n.match(/\b(encontra|encontram|encontrou|encontraram|acha|acham|achou|acharam|pega|pegam|pegou|pegaram|recebe|recebem|recebeu|ganha|ganham|ganhou|coleta|coletam|coletou|apanha|apanham|apanhou|guarda|guardam|compra|compram|comprou)\s+(.+)$/);
      if (fnd && actors.length) {
        const o = objectPhrase(orig(s, n, fnd[2]));
        if (o.name && !/^(dano|vida|sanidade|xp|experiencia|ninguem|nada)/.test(o.name)) {
          const res = resources.find(r => norm(r.label) === o.name || norm(r.key) === o.name);
          for (const u of actors.slice(0, 1).concat(GROUP.test(n) ? [] : actors.slice(1))) {
            if (res) changes.push({ id: cid(), on: true, t: 'resource', uid: u, key: res.key, delta: o.qty, evidence: ev });
            else changes.push({ id: cid(), on: true, t: 'item_add', uid: u, item: { name: cap1(o.label), qty: o.qty, cat: '', desc: '' }, qtyUnknown: !o.qtyKnown, evidence: ev });
          }
          lastFind = { actors: actors.slice(0, 1) };
        }
      }
      // conteúdo de um recipiente recém-encontrado
      const inside = n.match(/\b(dentro|nela|nele|dentro dela|dentro dele)\b.*\b(existem|existe|ha|tem|tinha|havia|contem|estao|esta)\s+(.+)$/);
      if (inside && lastFind) {
        const o = objectPhrase(orig(s, n, inside[3]));
        if (o.name) {
          const res = resources.find(r => norm(r.label) === o.name || norm(r.key) === o.name);
          for (const u of lastFind.actors) {
            if (res) changes.push({ id: cid(), on: true, t: 'resource', uid: u, key: res.key, delta: o.qty, evidence: ev });
            else changes.push({ id: cid(), on: true, t: 'item_add', uid: u, item: { name: cap1(o.label), qty: o.qty, cat: '', desc: '' }, qtyUnknown: !o.qtyKnown, evidence: ev });
          }
          actors = lastFind.actors;
        }
      }
      // perdas de item
      const lose = !dmg && n.match(/\b(larga|largam|largou|deixa|deixam|deixou|entrega|entregam|entregou|gasta|gastam|gastou|usa|usam|usou|consome|consomem|consumiu|perde|perdem|perdeu)\s+(.+)$/);
      if (lose && actors.length) {
        const o = objectPhrase(orig(s, n, lose[2]));
        for (const u of actors) {
          const r = roster.find(x => x.uid === u);
          const res = resources.find(rr => norm(rr.label) === o.name || norm(rr.key) === o.name);
          const item = r && (r.inv || []).find(i => norm(i.name) === o.name || norm(i.name).includes(o.name) || o.name.includes(norm(i.name)));
          if (res) changes.push({ id: cid(), on: true, t: 'resource', uid: u, key: res.key, delta: -o.qty, evidence: ev });
          else if (item) changes.push({ id: cid(), on: true, t: 'item_remove', uid: u, name: item.name, qty: o.qty, evidence: ev });
        }
      }
      // condições
      const cond = n.match(/\b(fica|ficam|ficou|ficaram|esta|estao|cai|caem|caiu)\s+(envenenad[oa]s?|ferid[oa]s?|inconscientes?|cansad[oa]s?|exaust[oa]s?|cego|cega|cegos|surd[oa]s?|paralisad[oa]s?|amedrontad[oa]s?|corrompid[oa]s?|sangrando|pres[oa]s?|atordoad[oa]s?)\b/);
      if (cond) for (const u of actors) changes.push({ id: cid(), on: true, t: 'condition_add', uid: u, name: cap1(cond[2].replace(/s$/, '')), evidence: ev });
      const brk = n.match(/\b(quebra|quebrou|fratura|fraturou)\s+(o|a)\s+(braco|perna|mao|pe|costela|nariz)\b/);
      if (brk) { const part = { braco: 'Braço', perna: 'Perna', mao: 'Mão', pe: 'Pé', costela: 'Costela', nariz: 'Nariz' }[brk[3]]; for (const u of actors) changes.push({ id: cid(), on: true, t: 'condition_add', uid: u, name: `${part} quebrad${/^(Perna|Mão|Costela)$/.test(part) ? 'a' : 'o'}`, evidence: ev }); }
      if (actors.length) lastActors = actors;
      if (changes.length > before) kind = kind === 'decisao' ? 'decisao' : 'alteracao';
    }
    segments.push({ text: s, kind, negated: negated && kind === 'narracao' });
  }
  return { source: 'local', summary: '', segments, changes, logText: String(text || '').trim() };
}

// ---------- Claude ----------
export function interpretPrompt(text, ctx) {
  const roster = (ctx.roster || []).map(r => ({ uid: r.uid, personagem: r.charName, jogador: r.playerName, local: r.placeName || null, vida: r.vida, sanidade: r.sanidade, mochila: (r.inv || []).map(i => `${i.qty}× ${i.name}`) }));
  return `Você é o assistente de bastidores do Mestre de um RPG de mesa chamado Survival or Dice, criado por Zito. Você NÃO decide nada: só organiza a narração em uma prévia que o Mestre vai revisar.

Narração do Mestre (transcrita, pode ter erros de reconhecimento de voz):
"""${text}"""

Personagens na mesa (use só estes uid):
${JSON.stringify(roster)}

Locais já existentes no mapa: ${JSON.stringify((ctx.places || []).map(p => ({ id: p.id, nome: p.name })))}
Recursos contáveis ativos na sessão: ${JSON.stringify((ctx.resources || []).map(r => ({ key: r.key, nome: r.label })))}
Status existentes na ficha: vida, sanidade, bemEstar, xp. NÃO existem fome, sede nem moeda a menos que estejam em "Recursos".

Regras:
1. Divida a narração em trechos e classifique cada um como: narracao, alteracao, decisao, hipotese, pergunta, dialogo, nao_confirmado.
2. Hipóteses ("talvez", "se", "poderia"), perguntas, diálogos, boatos e negações NUNCA geram alterações.
3. Só proponha alterações para acontecimentos narrados como concluídos.
4. Não invente itens, números, lugares ou consequências que não estejam na narração. Se a quantidade não foi dita, use qty 1 e marque "qtdIncerta": true.
5. Para deslocamento, use placeId de um local existente quando o nome bater; senão placeId null e o nome dito.
6. "o grupo", "todos", "eles" = todos os uids.

Responda só com JSON neste formato:
{"resumo":"uma frase","trechos":[{"texto":"...","tipo":"narracao"}],"alteracoes":[
 {"tipo":"move","uids":["..."],"local":"nome","placeId":null,"evidencia":"trecho"},
 {"tipo":"stat","uid":"...","campo":"vida|sanidade|bemEstar|xp","delta":-3,"evidencia":"..."},
 {"tipo":"item_add","uid":"...","nome":"...","qty":1,"qtdIncerta":false,"evidencia":"..."},
 {"tipo":"item_remove","uid":"...","nome":"...","qty":1,"evidencia":"..."},
 {"tipo":"resource","uid":"...","key":"...","delta":3,"evidencia":"..."},
 {"tipo":"condition_add","uid":"...","nome":"...","evidencia":"..."},
 {"tipo":"condition_remove","uid":"...","nome":"...","evidencia":"..."}
]}`;
}

export function normalizeClaude(o, ctx, text) {
  const uids = new Set((ctx.roster || []).map(r => r.uid));
  const okKind = k => Object.prototype.hasOwnProperty.call(KINDS, k) ? k : 'narracao';
  const segments = Array.isArray(o && o.trechos) ? o.trechos.filter(t => t && t.texto).map(t => ({ text: String(t.texto).slice(0, 600), kind: okKind(t.tipo) })) : splitSentences(text).map(s => ({ text: s, kind: classify(s) }));
  const changes = [];
  const num = v => Number.isFinite(+v) ? Math.max(-9999, Math.min(9999, Math.round(+v))) : null;
  const str = v => String(v || '').slice(0, 80).trim();
  for (const a of (Array.isArray(o && o.alteracoes) ? o.alteracoes : [])) {
    const ev = str(a.evidencia).slice(0, 240);
    if (a.tipo === 'move') {
      const us = (a.uids || []).filter(u => uids.has(u));
      const pl = (ctx.places || []).find(p => p.id === a.placeId);
      if (us.length && (pl || str(a.local))) changes.push({ id: cid(), on: true, t: 'move', uids: us, place: pl ? pl.name : str(a.local), placeId: pl ? pl.id : null, evidence: ev });
    } else if (!uids.has(a.uid)) continue;
    else if (a.tipo === 'stat' && ['vida', 'sanidade', 'bemEstar', 'xp'].includes(a.campo) && num(a.delta)) changes.push({ id: cid(), on: true, t: 'stat', uid: a.uid, key: a.campo, delta: num(a.delta), evidence: ev });
    else if (a.tipo === 'item_add' && str(a.nome)) changes.push({ id: cid(), on: true, t: 'item_add', uid: a.uid, item: { name: cap1(str(a.nome)), qty: Math.max(1, num(a.qty) || 1), cat: '', desc: '' }, qtyUnknown: !!a.qtdIncerta, evidence: ev });
    else if (a.tipo === 'item_remove' && str(a.nome)) changes.push({ id: cid(), on: true, t: 'item_remove', uid: a.uid, name: str(a.nome), qty: Math.max(1, num(a.qty) || 1), evidence: ev });
    else if (a.tipo === 'resource' && (ctx.resources || []).some(r => r.key === a.key) && num(a.delta)) changes.push({ id: cid(), on: true, t: 'resource', uid: a.uid, key: a.key, delta: num(a.delta), evidence: ev });
    else if (a.tipo === 'condition_add' && str(a.nome)) changes.push({ id: cid(), on: true, t: 'condition_add', uid: a.uid, name: cap1(str(a.nome)), evidence: ev });
    else if (a.tipo === 'condition_remove' && str(a.nome)) changes.push({ id: cid(), on: true, t: 'condition_remove', uid: a.uid, name: str(a.nome), evidence: ev });
  }
  return { source: 'claude', summary: str(o && o.resumo), segments, changes, logText: String(text || '').trim() };
}
