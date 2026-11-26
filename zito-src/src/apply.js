// Autoridade do Mestre. Só o dispositivo do Mestre escreve o estado oficial.
// Toda escrita em ficha gera uma entrada de auditoria com o antes e o depois,
// o que permite desfazer.
import { P, write, getDoc, col, doc, uid8, now } from './rt.js';
import { derive, reserveFor, levelForXp, TIERS, POINTS_PER_LEVEL, ATTRS, BASE_SPREAD } from './lore.js';

const clone = o => JSON.parse(JSON.stringify(o));

export function validateDraft(dr) {
  const issues = [];
  const a = dr.attrs || {};
  const keys = ATTRS.map(x => x.k);
  const base = dr.base || {};
  const sorted = keys.map(k => base[k]).sort((x, y) => y - x);
  if (JSON.stringify(sorted) !== JSON.stringify(BASE_SPREAD)) issues.push('Os valores base não são 9, 7, 5, 5, 5, 5 e 3.');
  let spent = 0;
  for (const k of keys) { const d = (a[k] || 0) - (base[k] || 0); if (d < 0) issues.push(`${k} abaixo do valor travado.`); spent += d; }
  if (spent !== POINTS_PER_LEVEL) issues.push(`Distribuiu ${spent} pontos soltos; o level 1 tem 8.`);
  if (!(dr.sorte >= 1 && dr.sorte <= 100)) issues.push('Sorte não rolada.');
  if ((dr.pericias || []).filter(Boolean).length !== 2) issues.push('São 2 perícias no começo.');
  if (!String(dr.charName || '').trim()) issues.push('Personagem sem nome.');
  return issues;
}

export function makeSheet(dr, uid, sid, placeId) {
  const attrs = {}; for (const x of ATTRS) attrs[x.k] = Math.max(0, Math.round(+dr.attrs[x.k] || 0));
  const der = derive(attrs);
  return {
    uid, sid,
    playerName: String(dr.playerName || '').slice(0, 40),
    charName: String(dr.charName || '').slice(0, 60),
    race: String(dr.race || 'Humano').slice(0, 40),
    tendencia: String(dr.tendencia || '').slice(0, 60),
    aparencia: String(dr.aparencia || '').slice(0, 600),
    historia: String(dr.historia || '').slice(0, 1500),
    portrait: dr.portrait || {},
    attrs, level: 1, xp: 0, sorte: Math.round(+dr.sorte || 0),
    vida: der.vida, sanidade: der.sanidade, bemEstar: der.bemEstar,
    reserve: reserveFor(1),
    pericias: (dr.pericias || []).filter(Boolean).slice(0, 2).map(n => ({ name: String(n).slice(0, 40), lvl: 1 })),
    habilidades: [], arvore: '',
    inv: [], conditions: [], resources: {},
    placeId: placeId || null, trail: placeId ? [placeId] : [], knownPlaces: {},
    defense: null, pendingPoints: 0, pendingPericias: 0, notes: '',
    createdAt: now(), updatedAt: now(),
  };
}

// --------- operações sobre uma ficha (puras) ---------
export function applyChange(sh, c, ctx = {}) {
  const s = sh;
  const der = derive(s.attrs);
  const max = { vida: der.vida, sanidade: der.sanidade, bemEstar: der.bemEstar };
  switch (c.t) {
    case 'stat':
      if (c.key === 'xp') {
        const before = s.level;
        s.xp = Math.max(0, (s.xp || 0) + c.delta);
        const lv = levelForXp(s.xp);
        if (lv > before) levelUp(s, before, lv);
      } else {
        const cap = max[c.key] ?? 9999;
        const cur = s[c.key] || 0;
        let v = cur + c.delta;
        if (c.delta > 0) v = Math.min(v, Math.max(cap, cur)); // cura não passa do máximo
        s[c.key] = Math.max(0, v);
      }
      break;
    case 'set': s[c.key] = c.value; break;
    case 'attr': {
      const old = s.attrs[c.key] || 0;
      s.attrs[c.key] = Math.max(0, old + c.delta);
      const d2 = derive(s.attrs);
      if (c.key === 'res') { s.vida += d2.vida - der.vida; s.bemEstar += d2.bemEstar - der.bemEstar; }
      if (c.key === 'fm') { s.sanidade += d2.sanidade - der.sanidade; s.bemEstar += d2.bemEstar - der.bemEstar; }
      break;
    }
    case 'item_add': {
      const it = c.item;
      const same = s.inv.find(i => i.name.toLowerCase() === it.name.toLowerCase() && !i.unique);
      if (same && !it.forceNew) same.qty = (same.qty || 1) + (it.qty || 1);
      else s.inv.push({ id: it.id || ('i' + uid8()), name: it.name, qty: it.qty || 1, cat: it.cat || '', desc: it.desc || '', weight: it.weight ?? null, rarity: it.rarity || '', cond: it.cond || '', props: it.props || '', reqs: it.reqs || '', important: !!it.important, equipped: false });
      break;
    }
    case 'item_remove': {
      const i = s.inv.findIndex(x => x.id === c.itemId || x.name.toLowerCase() === String(c.name || '').toLowerCase());
      if (i >= 0) { s.inv[i].qty = (s.inv[i].qty || 1) - (c.qty || 1); if (s.inv[i].qty <= 0) s.inv.splice(i, 1); }
      break;
    }
    case 'item_edit': {
      const it = s.inv.find(x => x.id === c.itemId);
      if (it) Object.assign(it, c.patch);
      break;
    }
    case 'resource': s.resources = s.resources || {}; s.resources[c.key] = Math.max(0, (s.resources[c.key] || 0) + c.delta); break;
    case 'condition_add':
      if (!s.conditions.some(x => x.name.toLowerCase() === c.name.toLowerCase())) s.conditions.push({ id: 'k' + uid8(), name: c.name, note: c.note || '', tone: c.tone || '' });
      break;
    case 'condition_remove': s.conditions = s.conditions.filter(x => x.id !== c.condId && x.name.toLowerCase() !== String(c.name || '').toLowerCase()); break;
    case 'move':
      if (c.placeId && s.placeId !== c.placeId) { s.placeId = c.placeId; s.trail = (s.trail || []).concat(c.placeId).slice(-40); }
      if (c.placeId && c.place && ctx.places && ctx.places[c.placeId]) { const p = ctx.places[c.placeId]; s.knownPlaces = s.knownPlaces || {}; s.knownPlaces[c.placeId] = { name: p.name, x: p.x, y: p.y }; }
      break;
    case 'reserve': s.reserve[c.tier] = Math.max(0, (s.reserve[c.tier] || 0) + c.delta); break;
    case 'defense': s.defense = c.value; break;
  }
  return s;
}

function levelUp(s, from, to) {
  s.level = to;
  s.pendingPoints = (s.pendingPoints || 0) + POINTS_PER_LEVEL * (to - from);
  s.pendingPericias = (s.pendingPericias || 0) + (to - from);
  const a = reserveFor(from), b = reserveFor(to);
  for (const t of TIERS) { const g = (b[t] || 0) - (a[t] || 0); if (g > 0) s.reserve[t] = (s.reserve[t] || 0) + g; }
}

// Descansos. C1: os dois botões existem até o Mestre decidir [RS p.2, SD p.1]
export function restFull(s) { s.reserve = reserveFor(s.level); s.defense = null; for (const hb of s.habilidades || []) hb.usos = hb.usosMax || hb.usos; return s; }
export function restHalf(s) {
  const full = reserveFor(s.level);
  let missing = 0; for (const t of TIERS) missing += Math.max(0, (full[t] || 0) - (s.reserve[t] || 0));
  let give = Math.ceil(missing / 2);
  for (const t of TIERS) { // começando pelo tier mais baixo
    while (give > 0 && (s.reserve[t] || 0) < (full[t] || 0)) { s.reserve[t] = (s.reserve[t] || 0) + 1; give--; }
  }
  return s;
}

// --------- escrita com auditoria ---------
export async function commitSheet(sid, uid, before, after, label) {
  after.updatedAt = now();
  await write(P.sheet(uid, sid), after);
  const aid = 'a' + now().toString(36) + uid8().slice(0, 3);
  try { await write(`${P.audit(sid)}/${aid}`, { ts: now(), uid, label, before, after, undone: false }); } catch {}
  await syncRoster(sid, uid, after);
  return aid;
}

export async function syncRoster(sid, uid, s) {
  const d = derive(s.attrs);
  try {
    await write(P.rosterDoc(sid, uid), {
      uid, charName: s.charName, playerName: s.playerName, race: s.race, level: s.level, placeId: s.placeId || null,
      portrait: s.portrait || {}, vida: s.vida, vidaMax: d.vida, status: 'ativo', zero: ATTRS.some(x => (s.attrs[x.k] || 0) <= 0), joinedAt: s.createdAt,
    });
  } catch {}
}

export async function undoAudit(sid, aid, force = false) {
  const a = await getDoc(`${P.audit(sid)}/${aid}`);
  if (!a || a.undone) return { ok: false, why: 'Já desfeito ou não encontrado.' };
  const cur = await getDoc(P.sheet(a.uid, sid));
  if (!force && cur && a.after && cur.updatedAt !== a.after.updatedAt) return { ok: false, why: 'changed' };
  const back = clone(a.before); back.updatedAt = now();
  await write(P.sheet(a.uid, sid), back);
  await write(`${P.audit(sid)}/${aid}`, { undone: true }, 'update');
  await syncRoster(sid, a.uid, back);
  return { ok: true };
}

// --------- registro de acontecimentos com visibilidade ---------
// vis: 'todos' | 'alguns' (to: uids) | 'mestre'
export async function writeLog(sid, { text, title = '', kind = 'narracao', vis = 'todos', to = [], signed = false, chars = [] }) {
  const eid = 'e' + now().toString(36) + uid8().slice(0, 3);
  const entry = { ts: now(), text: String(text).slice(0, 8000), title: String(title).slice(0, 120), kind, vis, to, signed, chars };
  if (vis === 'todos') await write(`${P.log(sid)}/${eid}`, entry);
  else if (vis === 'alguns') {
    for (const u of to) await write(`${P.inbox(u, sid)}/${eid}`, entry);
    await write(`${P.gmLog(sid)}/${eid}`, entry); // espelho para o Mestre
  } else await write(`${P.gmLog(sid)}/${eid}`, entry);
  return eid;
}

// Prunar auditoria antiga (o banco tem teto de documentos)
export async function pruneAudit(sid, keep = 150) {
  try {
    const snap = await col(P.audit(sid)).orderBy('ts', 'desc').limit(400).get();
    const old = snap.docs.slice(keep);
    for (const d of old) await doc(`${P.audit(sid)}/${d.id}`).delete();
  } catch {}
}
