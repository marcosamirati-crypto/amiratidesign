// Centro de comando do Mestre. O dispositivo do Mestre é a autoridade: lê os
// pedidos dos jogadores, aplica o que as regras da sessão permitem e grava
// cada mudança com auditoria (desfazer).
import { h, put, icon, clear, toast, sheet, ask, seg, stepper, field, tag, cells, empty, norm, fmtTime, fmtDay, copyText, deferWhileTyping } from './ui.js';
import { cap, me, P, doc, col, write, getDoc, watch, joinRoom, roomNow, now, uid8, newCode } from './rt.js';
import { ATTRS, ATTR_NAME, derive, DERIVED, carga, deslocamento, RACE_BASE, reserveFor, daFor, TIERS, xpProgress, levelForXp, PERICIA_BONUS, difficulty, DIFF_STEPS, DIFF_BASE, TERRAIN, moveBudget, luck, d, CHAOS, SIGN, zeroAttrs } from './lore.js';
import { portraitSVG } from './portrait.js';
import { openRoller } from './dice.js';
import { renderMap, insideZone, W as MW, H as MH } from './map.js';
import { localInterpret, KINDS } from './interpret.js';
import { sampleAI } from './ai.js';
import { platform } from './platform.js';
import { validateDraft, makeSheet, applyChange, restFull, restHalf, commitSheet, syncRoster, undoAudit, writeLog, pruneAudit } from './apply.js';
import { entryCard, startPlayer } from './player.js';
import qrcode from 'qrcode-generator';

/* global ARTIFACT_URL */
const LINK = typeof ARTIFACT_URL === 'string' ? ARTIFACT_URL : '';
const clone = o => JSON.parse(JSON.stringify(o));
const AI = () => cap.ai || (cap.sample ? sampleAI(cap.sample) : null);
let wakeLock = null;
async function keepAwake() { try { if (navigator.wakeLock && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch {} }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && platform.site && ms.sid) keepAwake(); });
const ms = { sid: null, session: null, gm: null, roster: {}, sheets: {}, reqs: {}, queues: {}, log: [], gmlog: [], audit: [], peers: [], rolls: [], view: 'mesa', subs: [], sheetSubs: {}, chain: {}, processing: new Set(), booted: false, narr: { text: '', result: null, busy: false } };
let root, app;

export function startMaster(host) { root = host; lobby(); }

// ------------------------------------------------------------ lobby
async function lobby() {
  clear(root);
  const list = h('div', { class: 'stack' }, h('p', { class: 'muted' }, 'Carregando suas mesas…'));
  const name = h('input', { id: 'new-session', class: 'in big', maxlength: 60, placeholder: 'Nome da sessão' });
  const create = h('button', { class: 'btn primary big', onclick: async () => {
    if (!name.value.trim()) { name.focus(); return toast('Dê um nome à sessão.'); }
    create.disabled = true;
    try { const sid = await createSession(name.value.trim()); openCommand(sid); }
    catch (e) { create.disabled = false; toast('Não foi possível criar a sessão: ' + (e && e.message || 'erro')); }
  } }, icon('plus', 22), 'Criar sessão');
  root.appendChild(h('main', { class: 'flow gm-lobby' },
    h('p', { class: 'kicker' }, 'Survival or Dice'),
    h('h1', { class: 'title-l' }, 'Mesa do Mestre'),
    h('p', { class: 'lead' }, 'Crie uma sessão. A plataforma gera o código, o link e o QR para os jogadores entrarem.'),
    h('div', { class: 'stack' }, field('Nova sessão', name), create),
    platform.site ? h('p', { class: 'note' }, 'Este aparelho guarda e hospeda as mesas que você criar. Durante o jogo, mantenha a página aberta: os jogadores se ligam ao seu celular.') : null,
    h('h2', { class: 'title-m' }, 'Sessões'), list,
    platform.toPlayer ? h('button', { class: 'linkish', onclick: () => platform.toPlayer() }, 'Entrar numa mesa como jogador') : null));
  try {
    const snap = await col(P.sessions()).where('ownerId', '==', me.id).limit(50).get();
    clear(list);
    const docs = snap.docs.slice().sort((a, b) => (b.data().createdAt || 0) - (a.data().createdAt || 0));
    if (!docs.length) list.appendChild(empty('Nenhuma sessão ainda.'));
    for (const s of docs) { const v = s.data(); list.appendChild(h('button', { class: 'card row between pick', onclick: () => openCommand(s.id) }, h('span', null, h('b', null, v.name), h('br'), h('small', { class: 'muted' }, `${fmtDay(v.createdAt)} · ${v.status}`)), h('span', { class: 'code-chip' }, v.code))); }
  } catch { clear(list); list.appendChild(empty('Não consegui ler as sessões.')); }
}

async function createSession(name) {
  let code;
  for (let i = 0; i < 6; i++) { code = newCode(); const q = await col(P.sessions()).where('code', '==', code).limit(1).get(); if (q.empty) break; }
  const sid = 's' + uid8();
  const map = { places: {}, links: [], zones: {} };
  await write(P.session(sid), { name, code, ownerId: me.id, createdAt: now(), status: 'aberta', mode: 'campanha', opening: '', startPlaceId: null, races: [], resources: [], survival: { fome: false, sede: false }, rules: { autoSpend: true, autoDefense: true, autoEquip: true, autoPoints: true, autoUse: true, autoPericia: false }, day: 1, map });
  await write(P.gm(sid), { notes: '', charNotes: {}, map, createdAt: now() });
  return sid;
}

// ------------------------------------------------------------ centro de comando
async function openCommand(sid) {
  for (const u of ms.subs) u(); ms.subs = [];
  for (const u of Object.values(ms.sheetSubs)) u(); ms.sheetSubs = {};
  Object.assign(ms, { sid, roster: {}, sheets: {}, reqs: {}, queues: {}, log: [], gmlog: [], audit: [], rolls: [], booted: false });
  clear(root);
  app = h('div', { class: 'app master' });
  root.appendChild(app);
  const on = (ref, fn) => ms.subs.push(watch(ref, fn, { onError: () => toast('A conexão com o banco caiu. Recarregue a página.', { ms: 9000 }) }));
  on(doc(P.session(sid)), s => { if (s.exists) { ms.session = s.data(); paint(); } });
  on(doc(P.gm(sid)), s => { ms.gm = s.exists ? s.data() : { notes: '', charNotes: {}, map: { places: {}, links: [], zones: {} } }; paint(); });
  on(col(P.roster(sid)), q => {
    ms.roster = Object.fromEntries(q.docs.map(x => [x.id, x.data()]));
    for (const uid of Object.keys(ms.roster)) watchPlayer(uid);
    paint();
  });
  on(col(P.reqs()).where('sid', '==', sid), q => {
    for (const c of q.docChanges()) if (c.type !== 'removed' && ms.booted && c.doc.data().draft && c.doc.data().draft.sent && !ms.roster[c.doc.id]) toast(`${c.doc.data().draft.charName || 'Um jogador'} enviou a ficha.`);
    ms.reqs = Object.fromEntries(q.docs.map(x => [x.id, x.data()])); paint();
  });
  on(col(P.log(sid)).orderBy('ts', 'desc').limit(120), q => { ms.log = q.docs.map(x => ({ id: x.id, ...x.data(), scope: 'todos' })); if (ms.view === 'registro') paint(); });
  on(col(P.gmLog(sid)).orderBy('ts', 'desc').limit(120), q => { ms.gmlog = q.docs.map(x => ({ id: x.id, ...x.data(), scope: x.data().vis })); if (ms.view === 'registro') paint(); });
  on(col(P.audit(sid)).orderBy('ts', 'desc').limit(40), q => { ms.audit = q.docs.map(x => ({ id: x.id, ...x.data() })); if (ms.view === 'registro') paint(); });
  const s0 = await getDoc(P.session(sid));
  if (s0 && platform.hostSession) { platform.hostSession(s0.code); keepAwake(); }
  if (s0) {
    const room = await joinRoom(s0.code);
    if (room) {
      room.presence({ role: 'mestre', sid }).catch(() => {});
      room.onPeers(c => { ms.peers = c.peers; if (ms.view === 'mesa') paint(); });
      room.on('roll', m => { if (!m.data || m.data.sid !== sid) return; ms.rolls.unshift({ ...m.data, by: m.by, ts: now() }); ms.rolls = ms.rolls.slice(0, 12); if (ms.view === 'mesa') paint(); if (!m.sameTab) { const r = ms.roster[m.by]; toast(`${r ? r.charName : 'Jogador'}: ${m.data.label} = ${m.data.total}${m.data.crit === 'critico' ? ' (crítico)' : m.data.crit === 'erro' ? ' (erro crítico)' : ''}`); } });
    }
  }
  setTimeout(() => { ms.booted = true; pruneAudit(sid); }, 3000);
  initDictation();
}

function watchPlayer(uid) {
  if (ms.sheetSubs[uid]) return;
  const a = watch(doc(P.sheet(uid, ms.sid)), s => { if (s.exists) { const d0 = s.data(); if (!ms.sheets[uid] || (d0.updatedAt || 0) >= (ms.sheets[uid].updatedAt || 0)) ms.sheets[uid] = d0; paint(); } });
  const b = watch(col(P.queue(uid)).where('sid', '==', ms.sid), q => { ms.queues[uid] = q.docs.map(x => ({ id: x.id, ...x.data() })); processQueue(uid); paint(); });
  ms.sheetSubs[uid] = () => { a(); b(); };
}

// Serializa escritas por personagem e guarda a cópia mais nova localmente
function mutate(uid, label, fn) {
  const run = async () => {
    const cur = ms.sheets[uid] || await getDoc(P.sheet(uid, ms.sid));
    if (!cur) return null;
    const before = clone(cur); const after = clone(cur);
    const r = fn(after);
    if (r === false || JSON.stringify(before) === JSON.stringify(after)) return null;
    after.updatedAt = now();
    ms.sheets[uid] = after;
    return commitSheet(ms.sid, uid, before, after, label);
  };
  ms.chain[uid] = (ms.chain[uid] || Promise.resolve()).then(run, run);
  return ms.chain[uid];
}

// ------------------------------------------------------------ pedidos dos jogadores
const AUTO = { spend: 'autoSpend', defense: 'autoDefense', equip: 'autoEquip', unequip: 'autoEquip', points: 'autoPoints', use: 'autoUse', pericia: 'autoPericia' };
const REQ_LABEL = { spend: 'gastar dados da reserva', defense: 'fixar defesa', equip: 'equipar', unequip: 'desequipar', points: 'distribuir pontos', use: 'usar habilidade', pericia: 'nova perícia' };
async function processQueue(uid) {
  const rules = (ms.session && ms.session.rules) || {};
  for (const r of ms.queues[uid] || []) {
    if (ms.processing.has(r.id)) continue;
    if (!rules[AUTO[r.kind]]) continue;
    ms.processing.add(r.id);
    try { await resolveRequest(uid, r, true); } catch {} finally { setTimeout(() => ms.processing.delete(r.id), 15000); }
  }
}

async function resolveRequest(uid, r, accept) {
  if (accept) {
    const p = r.payload || {};
    await mutate(uid, `Pedido: ${REQ_LABEL[r.kind] || r.kind}`, s => {
      if (r.kind === 'spend' && TIERS.includes(p.tier)) s.reserve[p.tier] = Math.max(0, (s.reserve[p.tier] || 0) - Math.max(1, Math.min(5, +p.n || 1)));
      else if (r.kind === 'defense') s.defense = { esquiva: +p.esquiva || 0, bloqueio: +p.bloqueio || 0, contra: +p.contra || 0, ts: +p.ts || now() };
      else if (r.kind === 'equip' || r.kind === 'unequip') { const it = s.inv.find(i => i.id === p.itemId); if (!it) return false; it.equipped = r.kind === 'equip'; }
      else if (r.kind === 'points') {
        const alloc = p.alloc || {}; let sum = 0;
        for (const x of ATTRS) { const v = Math.round(+alloc[x.k] || 0); if (v < 0) return false; sum += v; }
        if (sum !== s.pendingPoints) return false;
        for (const x of ATTRS) { const v = Math.round(+alloc[x.k] || 0); if (v) applyChange(s, { t: 'attr', key: x.k, delta: v }); }
        s.pendingPoints = 0;
      } else if (r.kind === 'use') { const hb = (s.habilidades || []).find(x => x.id === p.habId); if (!hb || hb.usos <= 0) return false; hb.usos -= 1; }
      else if (r.kind === 'pericia') {
        if (!(s.pendingPericias > 0)) return false;
        const ex = s.pericias.find(x => norm(x.name) === norm(p.name));
        if (ex) { if (ex.lvl >= 3) return false; ex.lvl += 1; } else s.pericias.push({ name: String(p.name).slice(0, 40), lvl: 1 });
        s.pendingPericias -= 1;
      }
    });
  }
  try { await doc(`${P.queue(uid)}/${r.id}`).delete(); } catch {}
}

// ------------------------------------------------------------ pintura
const TABS = [['mesa', 'Mesa', 'mesa'], ['narrar', 'Narrar', 'narrar'], ['mapa', 'Mapa', 'map'], ['registro', 'Registro', 'log'], ['mais', 'Mais', 'more']];
function paint() {
  if (!app || !ms.session) return;
  if (deferWhileTyping(app, paint)) return; // não interrompe a escrita
  const y = window.scrollY;
  clear(app);
  app.appendChild(gmTop());
  const main = h('main', { class: 'view' });
  app.appendChild(main);
  ({ mesa: viewMesa, narrar: viewNarrar, mapa: viewMapa, registro: viewRegistro, mais: viewMais })[ms.view](main);
  app.appendChild(h('nav', { class: 'tabbar', 'aria-label': 'Seções do Mestre' }, TABS.map(([k, l, ic]) => h('button', { class: 'tab' + (ms.view === k ? ' on' : ''), 'aria-current': ms.view === k ? 'page' : null, onclick: () => { ms.view = k; paint(); window.scrollTo(0, 0); } }, icon(ic, 22), h('span', null, l), k === 'mesa' && pendingJoins().length ? h('i', { class: 'badge' }, String(pendingJoins().length)) : null))));
  window.scrollTo(0, y);
}
const pendingJoins = () => Object.entries(ms.reqs).filter(([uid, r]) => r.draft && r.draft.sent && !ms.roster[uid]);
const onlineUids = () => new Set((ms.peers || []).filter(p => p.presence && p.presence.role === 'jogador').map(p => p.by || p.presence.uid));
const places = () => (ms.gm && ms.gm.map && ms.gm.map.places) || {};
const placeName = id => (places()[id] || {}).name;

function gmTop() {
  const s = ms.session;
  const n = onlineUids().size;
  return h('header', { class: 'topbar gm' },
    h('button', { class: 'icon-btn', 'aria-label': 'Trocar de sessão', onclick: () => lobby() }, icon('undo')),
    h('div', { class: 'tb-id' }, h('h1', { class: 'tb-name' }, s.name), h('p', { class: 'tb-sub' }, `${s.status === 'aberta' ? 'Aberta' : s.status === 'pausada' ? 'Pausada' : 'Encerrada'} · ${n} ${n === 1 ? 'jogador conectado' : 'jogadores conectados'}${s.mode === 'prisioneiros' ? ' · Prisioneiros' : ''}`)),
    h('button', { class: 'code-chip big', onclick: showInvite, 'aria-label': `Código ${s.code}. Mostrar QR` }, icon('qr', 18), s.code));
}

function showInvite() {
  const s = ms.session;
  const url = platform.inviteLink ? platform.inviteLink(s.code) : LINK ? `${LINK}#mesa-${s.code}` : '';
  const qr = qrcode(0, 'M'); qr.addData(url || s.code); qr.make();
  const svg = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true }).replace(/fill="black"/g, 'fill="#1F1A15"');
  sheet({ title: 'Convite da mesa', sub: 'Aponte a câmera do celular para o QR.', body: h('div', { class: 'stack center' },
    h('div', { class: 'qr', html: svg }),
    h('p', { class: 'code-xl', 'aria-label': 'Código' }, s.code),
    url ? h('p', { class: 'mono-break' }, url) : h('p', { class: 'note' }, 'O link da página aparece aqui depois da publicação. Enquanto isso, os jogadores digitam o código.'),
    url ? h('button', { class: 'btn', onclick: () => copyText(url) }, icon('copy'), 'Copiar link') : null,
    h('p', { class: 'muted small' }, platform.site ? 'Qualquer pessoa entra pelo link ou pelo código, sem conta. Seu celular é o servidor da mesa: mantenha esta página aberta. O código sozinho não dá poderes de Mestre.' : 'Cada jogador precisa ter acesso a esta página no Claude com permissão de escrita (Contribuidor ou Editor). O código sozinho não dá poderes de Mestre.')) });
}

// ------------------------------------------------------------ MESA
function viewMesa(main) {
  const online = onlineUids();
  const joins = pendingJoins();
  if (joins.length) {
    main.appendChild(h('h2', { class: 'title-m' }, 'Chegando à mesa'));
    for (const [uid, r] of joins) main.appendChild(joinCard(uid, r));
  }
  const queued = Object.entries(ms.queues).flatMap(([uid, q]) => q.filter(r => !ms.processing.has(r.id)).map(r => ({ uid, r })));
  if (queued.length) main.appendChild(h('section', { class: 'card hl' }, h('h2', { class: 'card-t' }, 'Pedidos dos jogadores'),
    queued.map(({ uid, r }) => h('div', { class: 'row between req' }, h('span', null, h('b', null, (ms.roster[uid] || {}).charName || '?'), ` quer ${REQ_LABEL[r.kind] || r.kind}`, r.payload && r.payload.name ? `: ${r.payload.name}` : ''),
      h('span', { class: 'row' }, h('button', { class: 'btn ghost small', onclick: () => resolveRequest(uid, r, false) }, 'Recusar'), h('button', { class: 'btn small', onclick: () => resolveRequest(uid, r, true) }, 'Aprovar'))))));
  if (ms.rolls.length) main.appendChild(h('section', { class: 'rolls' }, h('h2', { class: 'card-t' }, 'Últimas rolagens'), h('div', { class: 'roll-strip' }, ms.rolls.slice(0, 6).map(r => h('div', { class: 'roll-pill ' + (r.crit || '') }, h('b', null, String(r.total)), h('span', null, `${(ms.roster[r.by] || {}).charName || 'Mestre'} · ${r.label}`))))));
  const ids = Object.keys(ms.roster);
  main.appendChild(h('div', { class: 'row between' }, h('h2', { class: 'title-m' }, 'Personagens'), h('button', { class: 'btn ghost small', onclick: () => openRoller({ sheetData: { attrs: { agi: 5, car: 5, for: 5, fm: 5, int: 5, per: 5, res: 5 }, level: 1, reserve: {}, sorte: 50, pericias: [] }, broadcast: data => roomNow() && roomNow().emit('roll', { ...data, sid: ms.sid }).catch(() => {}) }) }, icon('roll', 18), 'Rolar como NPC')));
  if (!ids.length) main.appendChild(empty('Ninguém na mesa ainda. Toque no código no topo para mostrar o QR.'));
  for (const uid of ids) main.appendChild(charCard(uid, online.has(uid)));
}

function joinCard(uid, r) {
  const dr = r.draft;
  const issues = validateDraft(dr);
  const pl = places();
  let start = ms.session.startPlaceId || '';
  const sel = h('select', { id: 'start-' + uid, class: 'in', 'aria-label': 'Local inicial', onchange: e => { start = e.target.value; } },
    h('option', { value: '' }, 'Local inicial: definir depois'), Object.entries(pl).map(([id, p]) => h('option', { value: id, selected: id === start }, p.name)));
  return h('section', { class: 'card join' },
    h('div', { class: 'row' }, h('div', { class: 'pt-m', html: portraitSVG(dr.portrait, { level: 1 }) }),
      h('div', null, h('h3', { class: 'title-s' }, dr.charName || 'Sem nome'), h('p', { class: 'muted' }, `${dr.race} · jogador ${dr.playerName} · Sorte ${dr.sorte} (rolou ${dr.sorteRolls || 1}×)`))),
    h('div', { class: 'mini-attrs' }, ATTRS.map(x => h('span', null, `${x.short} `, h('b', null, String(dr.attrs[x.k] ?? '–'))))),
    issues.length ? h('ul', { class: 'issues' }, issues.map(t => h('li', null, t))) : h('p', { class: 'note good' }, 'Ficha dentro das regras: 9, 7, 5, 5, 5, 5, 3 travados, 8 pontos soltos, Sorte rolada, 2 perícias.'),
    sel,
    h('button', { class: 'btn primary', onclick: async () => {
      const sh = makeSheet(dr, uid, ms.sid, start || null);
      if (start && pl[start]) { sh.knownPlaces[start] = { name: pl[start].name, x: pl[start].x, y: pl[start].y, desc: pl[start].desc || '' }; sh.chaosInside = chaosAt(start); }
      ms.sheets[uid] = sh;
      await write(P.sheet(uid, ms.sid), sh);
      await syncRoster(ms.sid, uid, sh);
      await writeLog(ms.sid, { text: `${sh.charName} chegou à mesa.`, kind: 'sistema' });
      toast(`${sh.charName} entrou na sessão.`);
    } }, icon('check'), issues.length ? 'Aprovar mesmo assim' : 'Aprovar ficha'));
}

function charCard(uid, online) {
  const r = ms.roster[uid]; const s = ms.sheets[uid];
  if (!s) return h('div', { class: 'card' }, r.charName, ' · carregando…');
  const der = derive(s.attrs);
  const res = TIERS.filter(t => reserveFor(s.level)[t]).map(t => `${s.reserve[t] || 0}/${reserveFor(s.level)[t]}${t.toUpperCase()}`).join(' · ');
  const quickBtn = (key, delta, label) => h('button', { class: 'qb', 'aria-label': label, onclick: e => { e.stopPropagation(); mutate(uid, `${label} (${s.charName})`, x => applyChange(x, { t: 'stat', key, delta })).then(aid => aid && toast(`${s.charName}: ${label}`, { action: () => undo(aid) })); } }, icon(delta < 0 ? 'minus' : 'plus', 18));
  const z = zeroAttrs(s.attrs);
  return h('article', { class: 'char', tabindex: 0, onclick: () => editChar(uid), onkeydown: e => { if (e.key === 'Enter') editChar(uid); } },
    h('div', { class: 'char-top' },
      h('div', { class: 'pt-m', html: portraitSVG(s.portrait, { level: s.level, ring: online }) }),
      h('div', { class: 'char-id' }, h('h3', { class: 'title-s' }, s.charName), h('p', { class: 'muted small' }, `${s.playerName} · ${s.race} · L${s.level}`), h('p', { class: 'small cplace' }, icon('local', 13), placeName(s.placeId) || 'sem local')),
      h('span', { class: 'dot' + (online ? ' on' : ''), title: online ? 'Conectado' : 'Fora da sala' })),
    z.length ? h('p', { class: 'note bad' }, `Insuficiência existencial: ${z.join(', ')} em zero.`) : null,
    h('div', { class: 'char-v' }, h('span', { class: 'cv-l' }, 'Vida'), cells(s.vida, der.vida, 'vida', { label: 'Vida' }), h('b', null, `${s.vida}/${der.vida}`), quickBtn('vida', -1, 'Vida −1'), quickBtn('vida', 1, 'Vida +1')),
    h('div', { class: 'char-v' }, h('span', { class: 'cv-l' }, 'Sanidade'), cells(s.sanidade, der.sanidade, 'san', { label: 'Sanidade' }), h('b', null, `${s.sanidade}/${der.sanidade}`), quickBtn('sanidade', -1, 'Sanidade −1'), quickBtn('sanidade', 1, 'Sanidade +1')),
    h('p', { class: 'small muted' }, `Reserva ${res}${s.defense ? ` · Defesa fixa E${s.defense.esquiva} B${s.defense.bloqueio} C${s.defense.contra}` : ''}`),
    (s.conditions || []).length ? h('div', { class: 'chips' }, s.conditions.map(c => h('span', { class: 'cond ' + (c.tone || '') }, c.name))) : null);
}

async function undo(aid) {
  const r = await undoAudit(ms.sid, aid);
  if (r.ok) return toast('Desfeito.');
  if (r.why === 'changed' && await ask('A ficha mudou depois dessa alteração.', { ok: 'Desfazer mesmo assim', detail: 'Desfazer agora volta a ficha inteira para o estado anterior e apaga as mudanças feitas depois.' })) { const r2 = await undoAudit(ms.sid, aid, true); toast(r2.ok ? 'Desfeito.' : 'Não deu para desfazer.'); }
  else if (r.why !== 'changed') toast(r.why);
}

// ------------------------------------------------------------ editor de personagem
function editChar(uid) {
  let tab = 'status';
  const body = h('div', { class: 'stack' });
  const s0 = ms.sheets[uid];
  const sh = sheet({ title: s0.charName, sub: `${s0.playerName} · ${s0.race} · Level ${s0.level}`, body, wide: true });
  const draw = () => {
    const s = clone(ms.sheets[uid]);
    const der = derive(s.attrs);
    clear(body);
    body.appendChild(seg([{ v: 'status', label: 'Status' }, { v: 'attrs', label: 'Atributos' }, { v: 'bag', label: 'Mochila' }, { v: 'hab', label: 'Habilidades' }, { v: 'msg', label: 'Notas' }], tab, v => { tab = v; draw(); }));
    const saveBtn = (label, fn) => h('button', { class: 'btn primary', onclick: async () => { const aid = await mutate(uid, `${label} (${s.charName})`, fn); if (aid) toast('Salvo.', { action: () => undo(aid) }); draw(); } }, label);
    if (tab === 'status') {
      const edits = {};
      const row = (l, key, max) => h('div', { class: 'row between' }, h('span', null, l, max != null ? h('small', { class: 'muted' }, ` máx ${max}`) : null), stepper(s[key] ?? 0, { min: 0, max: 999, label: l, onChange: v => { edits[key] = v; } }));
      const xpIn = h('input', { id: 'xp-add', class: 'in', type: 'number', inputmode: 'numeric', placeholder: '+ XP' });
      const condIn = h('input', { id: 'cond-add', class: 'in', placeholder: 'Nova condição' });
      const condTone = { v: '' };
      const plSel = h('select', { id: 'pl-sel', class: 'in' }, h('option', { value: '' }, 'Sem local'), Object.entries(places()).map(([id, p]) => h('option', { value: id, selected: id === s.placeId }, p.name)));
      const resv = {};
      const surv = ms.session.survival || {};
      put(body, 
        row('Vida', 'vida', der.vida), row('Sanidade', 'sanidade', der.sanidade), row('Bem-Estar', 'bemEstar', der.bemEstar),
        surv.fome ? row('Fome (proposta)', 'fome', 10) : null, surv.sede ? row('Sede (proposta)', 'sede', 10) : null,
        h('p', { class: 'f-label' }, 'Reserva de hoje'),
        TIERS.filter(t => reserveFor(s.level)[t]).map(t => h('div', { class: 'row between' }, h('span', null, `${t.toUpperCase()} `, h('small', { class: 'muted' }, `de ${reserveFor(s.level)[t]}`)), stepper(s.reserve[t] || 0, { min: 0, max: reserveFor(s.level)[t], label: t, onChange: v => { resv[t] = v; } }))),
        (ms.session.resources || []).map(r => h('div', { class: 'row between' }, h('span', null, r.label, ' ', tag('proposta')), stepper((s.resources || {})[r.key] || 0, { min: 0, max: 99999, label: r.label, onChange: v => { edits['res:' + r.key] = v; } }))),
        field('Local', plSel),
        saveBtn('Salvar status', x => {
          for (const [k, v] of Object.entries(edits)) { if (k.startsWith('res:')) { x.resources = x.resources || {}; x.resources[k.slice(4)] = v; } else x[k] = v; }
          for (const [t, v] of Object.entries(resv)) x.reserve[t] = v;
          if (plSel.value !== (x.placeId || '')) moveIn(x, plSel.value || null);
        }),
        h('div', { class: 'row' }, xpIn, h('button', { class: 'btn', onclick: async () => { const v = Math.round(+xpIn.value); if (!v) return; const aid = await mutate(uid, `XP ${v > 0 ? '+' : ''}${v} (${s.charName})`, x => applyChange(x, { t: 'stat', key: 'xp', delta: v })); if (aid) toast(`XP aplicado.`, { action: () => undo(aid) }); draw(); } }, 'Dar XP')),
        h('p', { class: 'small muted' }, `${s.xp} XP · level ${s.level} · próximo em ${xpProgress(s.xp).next ?? '–'}`),
        h('p', { class: 'f-label' }, 'Condições'),
        h('div', { class: 'chips' }, (s.conditions || []).map(c => h('button', { class: 'cond ' + (c.tone || ''), title: 'Remover', onclick: async () => { const aid = await mutate(uid, `Condição removida: ${c.name}`, x => applyChange(x, { t: 'condition_remove', condId: c.id })); aid && toast('Condição removida.', { action: () => undo(aid) }); draw(); } }, c.name, ' ×'))),
        h('div', { class: 'row' }, condIn, seg([{ v: '', label: 'Comum' }, { v: 'chaos', label: 'Caos' }], '', v => { condTone.v = v; }), h('button', { class: 'btn', onclick: async () => { if (!condIn.value.trim()) return; const aid = await mutate(uid, `Condição: ${condIn.value.trim()}`, x => applyChange(x, { t: 'condition_add', name: condIn.value.trim(), tone: condTone.v })); aid && toast('Condição aplicada.', { action: () => undo(aid) }); draw(); } }, 'Aplicar')),
        s.defense ? h('button', { class: 'btn ghost', onclick: async () => { await mutate(uid, 'Defesa liberada', x => { x.defense = null; }); draw(); } }, 'Liberar defesa fixa (turno voltou)') : null);
    }
    if (tab === 'attrs') {
      const delta = {};
      put(body, h('p', { class: 'muted' }, 'A distribuição inicial não se reorganiza. Aqui os valores sobem ou descem por acontecimentos. Zero em qualquer atributo mata por insuficiência existencial.'),
        ATTRS.map(x => h('div', { class: 'row between' }, h('span', null, x.name, ' ', h('b', null, String(s.attrs[x.k]))), stepper(0, { min: -s.attrs[x.k], max: 99, label: x.name, onChange: v => { delta[x.k] = v; } }))),
        s.pendingPoints ? h('p', { class: 'note' }, `${s.pendingPoints} pontos de level ainda não distribuídos pelo jogador.`) : null,
        saveBtn('Aplicar mudanças', x => { for (const [k, v] of Object.entries(delta)) if (v) applyChange(x, { t: 'attr', key: k, delta: v }); }),
        h('div', { class: 'grid3' }, DERIVED.map(x => h('div', { class: 'stat' }, h('b', null, String(der[x.k])), h('span', null, x.name)))));
    }
    if (tab === 'bag') {
      const f = { name: '', qty: 1, cat: '', desc: '', weight: '', rarity: '', cond: '', props: '', reqs: '', important: false };
      const inp = (k, ph, type = 'text') => { const e = h('input', { class: 'in', id: 'it-' + k, type, placeholder: ph }); e.oninput = () => { f[k] = e.value; }; return e; };
      put(body, 
        (s.inv || []).length ? h('div', { class: 'stack tight' }, s.inv.map(it => h('div', { class: 'row between inv-row' }, h('span', null, h('b', null, it.name), ` ×${it.qty}`, it.equipped ? h('small', { class: 'muted' }, ' equipado') : null),
          h('span', { class: 'row' }, h('button', { class: 'btn ghost small', onclick: async () => { const aid = await mutate(uid, `Item −1: ${it.name}`, x => applyChange(x, { t: 'item_remove', itemId: it.id, qty: 1 })); aid && toast('Item retirado.', { action: () => undo(aid) }); draw(); } }, '−1'),
            h('button', { class: 'btn ghost small', onclick: async () => { const aid = await mutate(uid, `Item +1: ${it.name}`, x => { const i = x.inv.find(y => y.id === it.id); if (i) i.qty += 1; }); aid && toast('Item somado.', { action: () => undo(aid) }); draw(); } }, '+1'))))) : h('p', { class: 'muted' }, 'Mochila vazia.'),
        h('p', { class: 'f-label' }, 'Novo item'),
        inp('name', 'Nome'), h('div', { class: 'row' }, inp('qty', 'Qtd', 'number'), inp('cat', 'Categoria')),
        h('textarea', { class: 'in', rows: 2, placeholder: 'Descrição', oninput: e => { f.desc = e.target.value; } }),
        h('details', null, h('summary', null, 'Campos opcionais (propostas)'), h('div', { class: 'stack tight' }, inp('weight', 'Peso em kg', 'number'), inp('rarity', 'Raridade'), inp('cond', 'Conservação'), inp('props', 'Propriedades'), inp('reqs', 'Requisitos de uso'),
          h('label', { class: 'check' }, h('input', { type: 'checkbox', onchange: e => { f.important = e.target.checked; } }), 'Item importante'))),
        h('button', { class: 'btn primary', onclick: async () => { if (!f.name.trim()) return toast('Nome do item.'); const aid = await mutate(uid, `Item: ${f.name}`, x => applyChange(x, { t: 'item_add', item: { name: f.name.trim(), qty: Math.max(1, Math.round(+f.qty || 1)), cat: f.cat, desc: f.desc, weight: f.weight === '' ? null : +f.weight, rarity: f.rarity, cond: f.cond, props: f.props, reqs: f.reqs, important: f.important, forceNew: true } })); aid && toast('Item entregue.', { action: () => undo(aid) }); draw(); } }, 'Entregar item'));
    }
    if (tab === 'hab') {
      const arv = h('input', { class: 'in', id: 'arvore', value: s.arvore || '', placeholder: 'Ex.: profissão, armadura ou contato com o caos' });
      const hab = { name: '', tipo: 'passiva', usosMax: 3, desc: '' };
      const hn = h('input', { class: 'in', id: 'hab-n', placeholder: 'Nome da habilidade', oninput: e => { hab.name = e.target.value; } });
      put(body, 
        field('Árvore inicial', arv, 'Dada pelo Mestre no level 1 [RS p.2]. As árvores ainda não estão escritas nos documentos.'),
        (s.habilidades || []).map(hb => h('div', { class: 'row between' }, h('span', null, h('b', null, hb.name), ` · ${hb.tipo}${hb.tipo === 'ativa' ? ` · ${hb.usos}/${hb.usosMax} usos` : ''}`), h('button', { class: 'icon-btn', 'aria-label': 'Remover', onclick: async () => { await mutate(uid, `Habilidade removida: ${hb.name}`, x => { x.habilidades = x.habilidades.filter(y => y.id !== hb.id); }); draw(); } }, icon('trash', 18)))),
        hn, seg([{ v: 'passiva', label: 'Passiva' }, { v: 'ativa', label: 'Ativa' }], 'passiva', v => { hab.tipo = v; }),
        h('div', { class: 'row between' }, h('span', null, 'Usos por dia (ativa)'), stepper(3, { min: 1, max: 5, label: 'usos', onChange: v => { hab.usosMax = v; } })),
        h('textarea', { class: 'in', rows: 2, placeholder: 'O que faz', oninput: e => { hab.desc = e.target.value; } }),
        h('p', { class: 'small muted' }, 'Level 1: uma passiva e uma ativa com 3 a 5 usos. Do level 3 em diante, ativas têm no máximo 3 usos [RS p.3].'),
        saveBtn('Salvar habilidades', x => { x.arvore = arv.value.trim(); if (hab.name.trim()) { x.habilidades = (x.habilidades || []).concat({ id: 'h' + uid8(), name: hab.name.trim(), tipo: hab.tipo, usosMax: hab.tipo === 'ativa' ? hab.usosMax : 0, usos: hab.tipo === 'ativa' ? hab.usosMax : 0, desc: hab.desc }); } }),
        h('p', { class: 'f-label' }, 'Perícias'),
        (s.pericias || []).map((p, i) => h('div', { class: 'row between' }, h('span', null, p.name), stepper(p.lvl, { min: 1, max: 3, label: p.name, onChange: async v => { await mutate(uid, `Perícia ${p.name} nível ${v}`, x => { x.pericias[i].lvl = v; }); } }))));
    }
    if (tab === 'msg') {
      const note = h('textarea', { class: 'in', id: 'gm-note', rows: 4, placeholder: 'Anotações secretas sobre este personagem' }, ((ms.gm && ms.gm.charNotes) || {})[uid] || '');
      const msg = h('textarea', { class: 'in', id: 'gm-msg', rows: 3, placeholder: 'Algo que só este personagem percebe' });
      const signed = { v: false };
      put(body, field('Notas do Mestre ', note, 'Ficam no painel do Mestre. O jogador não recebe.'),
        h('button', { class: 'btn', onclick: async () => { const g = clone(ms.gm); g.charNotes = g.charNotes || {}; g.charNotes[uid] = note.value; await write(P.gm(ms.sid), g); toast('Nota salva.'); } }, 'Salvar nota'),
        field('Mensagem só para este jogador', msg),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', onchange: e => { signed.v = e.target.checked; } }), 'Texto narrativo oficial (assina — Zito)'),
        h('button', { class: 'btn primary', onclick: async () => { if (!msg.value.trim()) return; await writeLog(ms.sid, { text: msg.value.trim(), vis: 'alguns', to: [uid], signed: signed.v, chars: [uid] }); toast('Enviado só para ' + s.charName + '.'); msg.value = ''; } }, icon('send'), 'Enviar'));
    }
  };
  draw();
}

function chaosAt(placeId) {
  const p = places()[placeId]; if (!p) return null;
  let best = null;
  for (const z of Object.values((ms.gm.map && ms.gm.map.zones) || {})) { const w = insideZone(z, p); if (w === 'zona') return 'zona'; if (w) best = w; }
  return best;
}
function moveIn(x, placeId) {
  x.placeId = placeId;
  if (!placeId) { x.chaosInside = null; return; }
  x.trail = (x.trail || []).concat(placeId).slice(-40);
  const p = places()[placeId];
  if (p) { x.knownPlaces = x.knownPlaces || {}; x.knownPlaces[placeId] = { name: p.name, x: p.x, y: p.y, desc: p.desc || '' }; }
  x.chaosInside = chaosAt(placeId);
}

// ------------------------------------------------------------ NARRAR
let dict = null, dictState = 'idle', partialEl = null;
function initDictation() {
  dict = cap.dictation;
  if (!dict) return;
  dict.onPartial(({ text }) => { if (partialEl) partialEl.textContent = text; });
  dict.onFinal(({ text }) => { ms.narr.text = (ms.narr.text ? ms.narr.text + ' ' : '') + text; const ta = document.getElementById('narr-text'); if (ta) ta.value = ms.narr.text; if (partialEl) partialEl.textContent = ''; });
  dict.onState(({ state }) => { dictState = state; const b = document.getElementById('mic'); if (b) { b.classList.toggle('live', state === 'listening'); b.setAttribute('aria-pressed', state === 'listening'); b.lastChild.textContent = state === 'listening' ? 'Parar' : 'Falar'; } roomNow() && roomNow().presence({ narrando: state === 'listening' }).catch(() => {}); });
}

function viewNarrar(main) {
  const N = ms.narr;
  const ta = h('textarea', { id: 'narr-text', class: 'in narr', rows: 6, placeholder: 'Narre o que aconteceu. Ex.: Depois de caminhar por algumas horas, o grupo chega a uma região desconhecida…' }, N.text);
  ta.oninput = () => { N.text = ta.value; };
  ta.onfocus = () => roomNow() && roomNow().presence({ narrando: true }).catch(() => {});
  ta.onblur = () => roomNow() && roomNow().presence({ narrando: false }).catch(() => {});
  partialEl = h('p', { class: 'partial', 'aria-live': 'polite' });
  const mic = dict ? h('button', { id: 'mic', class: 'btn mic' + (dictState === 'listening' ? ' live' : ''), 'aria-pressed': dictState === 'listening', onclick: () => {
    if (dictState === 'listening') { dict.stop().catch(() => {}); return; }
    dict.start().catch(e => { toast(e && e.code === 'not_granted' ? 'Microfone recusado. Use o teclado.' : 'O ditado não começou. Tente de novo.'); });
  } }, icon('mic', 22), h('span', null, dictState === 'listening' ? 'Parar' : 'Falar')) : null;
  const engine = h('span', { class: 'small muted' }, AI() ? 'Interpretação: Claude' : 'Interpretação: local (Claude indisponível aqui)');
  const go = h('button', { class: 'btn primary big', disabled: N.busy, onclick: async () => {
    if (!N.text.trim()) return toast('Narre algo primeiro.');
    if (dict && dictState === 'listening') await dict.stop().catch(() => {});
    N.busy = true; paint();
    const ctx = interpretCtx();
    try {
      const ai = AI();
      N.result = ai ? await ai.interpret(N.text, ctx).catch(e => { toast(e && e.code === 'rate_limited' ? 'Claude ocupado; usei o intérprete local.' : 'Claude não respondeu; usei o intérprete local.'); return localInterpret(N.text, ctx); }) : localInterpret(N.text, ctx);
      N.vis = 'todos'; N.to = []; N.signed = false; N.title = '';
    } finally { N.busy = false; paint(); }
  } }, N.busy ? 'Interpretando…' : 'Interpretar');
  put(main, 
    h('h2', { class: 'title-m' }, 'Narrar'),
    h('div', { class: 'narr-box' }, ta, partialEl),
    h('div', { class: 'row between wrap' }, mic || h('p', { class: 'small muted keyboard-hint' }, icon('mic', 16), 'Para falar, use o microfone do teclado do celular. O ditado da página funciona no Chrome e no app do Claude para computador.'), engine),
    go);
  if (N.result) main.appendChild(preview(N));
}

function interpretCtx() {
  const roster = Object.keys(ms.roster).map(uid => { const s = ms.sheets[uid] || {}; return { uid, charName: s.charName || ms.roster[uid].charName, playerName: s.playerName || ms.roster[uid].playerName, inv: s.inv || [], vida: s.vida, sanidade: s.sanidade, placeName: placeName(s.placeId) }; });
  return { roster, places: Object.entries(places()).map(([id, p]) => ({ id, name: p.name })), resources: ms.session.resources || [] };
}

const charName = uid => (ms.sheets[uid] || ms.roster[uid] || {}).charName || '?';
function preview(N) {
  const R = N.result;
  const box = h('section', { class: 'preview' });
  put(box, h('div', { class: 'row between' }, h('h2', { class: 'title-m' }, 'Prévia'), h('span', { class: 'tag ' + (R.source === 'claude' ? 't-interp' : 't-prop') }, R.source === 'claude' ? 'Claude' : 'Intérprete local')),
    R.summary ? h('p', { class: 'lead' }, R.summary) : null,
    h('div', { class: 'segs' }, R.segments.map(sg => h('div', { class: 'seg-line k-' + sg.kind }, h('span', { class: 'stamp' }, KINDS[sg.kind] ? KINDS[sg.kind].label : sg.kind), h('span', null, sg.text), sg.negated ? h('small', { class: 'muted' }, ' negação: nada muda') : null))));
  const list = h('div', { class: 'changes' });
  if (!R.changes.length) list.appendChild(h('p', { class: 'muted' }, 'Nenhuma alteração de estado encontrada. Você pode registrar só o texto.'));
  for (const c of R.changes) list.appendChild(changeRow(c));
  put(box, h('h3', { class: 'title-s' }, `Alterações sugeridas (${R.changes.filter(c => c.on).length} marcadas)`), list);
  // registro do acontecimento
  const ids = Object.keys(ms.roster);
  const logTa = h('textarea', { class: 'in', id: 'log-text', rows: 4, 'aria-label': 'Texto do registro' }, R.logText);
  logTa.oninput = () => { R.logText = logTa.value; };
  const toBox = h('div', { class: 'chips' + (N.vis === 'alguns' ? '' : ' hide') }, ids.map(uid => h('label', { class: 'chip check' }, h('input', { type: 'checkbox', checked: N.to.includes(uid), onchange: e => { N.to = e.target.checked ? [...N.to, uid] : N.to.filter(x => x !== uid); } }), charName(uid))));
  put(box, h('h3', { class: 'title-s' }, 'Registro no histórico'),
    h('input', { class: 'in', id: 'log-title', placeholder: 'Título (opcional)', value: N.title || '', oninput: e => { N.title = e.target.value; } }),
    logTa,
    seg([{ v: 'todos', label: 'Todos veem' }, { v: 'alguns', label: 'Só alguns' }, { v: 'mestre', label: 'Só o Mestre' }], N.vis, v => { N.vis = v; toBox.classList.toggle('hide', v !== 'alguns'); }),
    toBox,
    h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: N.signed, onchange: e => { N.signed = e.target.checked; } }), 'Texto narrativo oficial (assina — Zito)'),
    h('div', { class: 'row end wrap' },
      h('button', { class: 'btn ghost', onclick: () => { N.result = null; paint(); } }, 'Descartar'),
      h('button', { class: 'btn', onclick: () => commitNarration(N, false) }, 'Registrar só o texto'),
      h('button', { class: 'btn primary', onclick: () => commitNarration(N, true) }, icon('check'), `Aplicar ${R.changes.filter(c => c.on).length} e registrar`)));
  return box;
}

function changeRow(c) {
  const ids = Object.keys(ms.roster);
  const who = uid => h('select', { class: 'in mini', 'aria-label': 'Personagem', onchange: e => { c.uid = e.target.value; } }, ids.map(u => h('option', { value: u, selected: u === c.uid }, charName(u))));
  const num = (k, min = -999) => stepper(c[k], { min, max: 9999, onChange: v => { c[k] = v; } });
  let desc;
  if (c.t === 'move') {
    const sel = h('select', { class: 'in mini', 'aria-label': 'Destino', onchange: e => { c.placeId = e.target.value || null; c.place = c.placeId ? placeName(c.placeId) : c.newName; } },
      h('option', { value: '' }, `Novo local: ${c.newName || c.place}`), Object.entries(places()).map(([id, p]) => h('option', { value: id, selected: id === c.placeId }, p.name)));
    if (!c.placeId) c.newName = c.newName || c.place;
    desc = [h('b', null, c.uids.map(charName).join(', ')), ' vai para ', sel];
  } else if (c.t === 'stat') desc = [who(), ` ${{ vida: 'Vida', sanidade: 'Sanidade', bemEstar: 'Bem-Estar', xp: 'XP' }[c.key]} `, num('delta')];
  else if (c.t === 'item_add') { const n = h('input', { class: 'in mini', 'aria-label': 'Nome do item', value: c.item.name, oninput: e => { c.item.name = e.target.value; } }); desc = [who(), ' recebe ', stepper(c.item.qty, { min: 1, max: 9999, onChange: v => { c.item.qty = v; } }), n, c.qtyUnknown ? h('small', { class: 'muted' }, ' quantidade não dita') : null]; }
  else if (c.t === 'item_remove') desc = [who(), ` perde ${c.qty}× ${c.name}`];
  else if (c.t === 'resource') desc = [who(), ` ${((ms.session.resources || []).find(r => r.key === c.key) || {}).label || c.key} `, num('delta')];
  else if (c.t === 'condition_add') desc = [who(), ' fica ', h('input', { class: 'in mini', 'aria-label': 'Condição', value: c.name, oninput: e => { c.name = e.target.value; } })];
  else if (c.t === 'condition_remove') desc = [who(), ` deixa de estar ${c.name}`];
  const box = h('input', { type: 'checkbox', checked: c.on, 'aria-label': 'Incluir', onchange: e => { c.on = e.target.checked; row.classList.toggle('off', !c.on); } });
  const row = h('div', { class: 'chg' + (c.on ? '' : ' off') }, h('label', { class: 'chg-on' }, box), h('div', { class: 'chg-body' }, h('div', { class: 'chg-desc' }, desc), c.evidence ? h('small', { class: 'evidence' }, `“${c.evidence}”`) : null));
  return row;
}

async function commitNarration(N, withChanges) {
  const R = N.result;
  const chosen = withChanges ? R.changes.filter(c => c.on) : [];
  const aids = [];
  // locais novos
  const gm = clone(ms.gm); gm.map = gm.map || { places: {}, links: [], zones: {} };
  let mapDirty = false;
  for (const c of chosen.filter(x => x.t === 'move' && !x.placeId)) {
    const pid = 'p' + uid8();
    const first = ms.sheets[c.uids[0]]; const from = first && gm.map.places[first.placeId];
    const allParty = Object.keys(ms.roster).every(u => c.uids.includes(u));
    gm.map.places[pid] = { name: (c.newName || c.place || 'Lugar sem nome').slice(0, 60), x: from ? Math.min(MW - 60, from.x + 170) : 200 + Math.round(Math.random() * 600), y: from ? Math.max(60, Math.min(MH - 60, from.y + (Math.random() < 0.5 ? -90 : 90))) : 200 + Math.round(Math.random() * 300), desc: '', known: allParty, knownBy: allParty ? [] : c.uids };
    if (from && !gm.map.links.some(l => (l.a === first.placeId && l.b === pid))) gm.map.links.push({ a: first.placeId, b: pid });
    c.placeId = pid; mapDirty = true;
  }
  if (mapDirty) { ms.gm = gm; await saveMap(gm); }
  // agrupa por personagem
  const per = {};
  for (const c of chosen) {
    if (c.t === 'move') for (const u of c.uids) (per[u] = per[u] || []).push(c);
    else (per[c.uid] = per[c.uid] || []).push(c);
  }
  for (const [uid, list] of Object.entries(per)) {
    const aid = await mutate(uid, `Narração: ${(N.title || R.logText).slice(0, 50)}`, x => { for (const c of list) { if (c.t === 'move') moveIn(x, c.placeId); else applyChange(x, c); } });
    if (aid) aids.push(aid);
  }
  if (R.logText.trim()) await writeLog(ms.sid, { text: R.logText.trim(), title: N.title || '', vis: N.vis, to: N.to, signed: !!N.signed, chars: Object.keys(per) });
  toast(withChanges ? (chosen.length === 1 ? '1 alteração aplicada e registrada.' : `${chosen.length} alterações aplicadas e registradas.`) : 'Acontecimento registrado.', { action: aids.length ? async () => { for (const a of aids.reverse()) await undoAudit(ms.sid, a, true); toast('Alterações desfeitas. O texto continua no histórico.'); } : null, ms: 9000 });
  N.result = null; N.text = '';
  paint();
}

async function saveSession(patch) {
  ms.session = { ...ms.session, ...patch };
  await write(P.session(ms.sid), ms.session);
}

// ------------------------------------------------------------ MAPA
let mapMode = null, linkFrom = null, selPlace = null;
async function saveMap(gm) {
  await write(P.gm(ms.sid), gm);
  const pub = { places: {}, links: [], zones: {} };
  for (const [id, p] of Object.entries(gm.map.places)) if (p.known) pub.places[id] = { name: p.name, x: p.x, y: p.y, desc: p.desc || '' };
  pub.links = gm.map.links.filter(l => pub.places[l.a] && pub.places[l.b]);
  for (const [id, z] of Object.entries(gm.map.zones || {})) if (z.seen) pub.zones[id] = { x: z.x, y: z.y, rB: z.rB, rZ: z.rZ };
  await saveSession({ map: pub });
  // conhecimento individual
  for (const uid of Object.keys(ms.roster)) {
    const s = ms.sheets[uid]; if (!s) continue;
    const want = {};
    for (const [id, p] of Object.entries(gm.map.places)) if (!p.known && (p.knownBy || []).includes(uid)) want[id] = { name: p.name, x: p.x, y: p.y, desc: p.desc || '' };
    const keepVisited = Object.fromEntries(Object.entries(s.knownPlaces || {}).filter(([id]) => gm.map.places[id] && (s.trail || []).includes(id) && !gm.map.places[id].known).map(([id]) => { const p = gm.map.places[id]; return [id, { name: p.name, x: p.x, y: p.y, desc: p.desc || '' }]; }));
    const next = { ...keepVisited, ...want };
    const chaos = s.placeId ? chaosAt(s.placeId) : null;
    if (JSON.stringify(next) !== JSON.stringify(s.knownPlaces || {}) || (s.chaosInside || null) !== chaos) await mutate(uid, 'Mapa: conhecimento atualizado', x => { x.knownPlaces = next; x.chaosInside = chaos; });
  }
}

function viewMapa(main) {
  const gm = ms.gm || { map: { places: {}, links: [], zones: {} } };
  const box = h('div', { class: 'map-box gm' });
  const tokens = Object.keys(ms.roster).map(uid => { const s = ms.sheets[uid] || ms.roster[uid]; return { placeId: s.placeId, portrait: s.portrait, level: s.level, name: s.charName }; });
  const trails = Object.values(ms.sheets).map(s => ({ ids: s.trail || [] }));
  const tool = (k, label, ic) => h('button', { class: 'btn small' + (mapMode === k ? ' primary' : ' ghost'), 'aria-pressed': mapMode === k, onclick: () => { mapMode = mapMode === k ? null : k; linkFrom = null; paint(); } }, icon(ic, 16), label);
  put(main, h('div', { class: 'row between wrap' }, h('h2', { class: 'title-m' }, 'Mapa provisório'), h('div', { class: 'row wrap' }, tool('place', 'Local', 'local'), tool('zone', 'Zona de Caos', 'chaos'), tool('link', 'Caminho', 'link'))),
    mapMode ? h('p', { class: 'note' }, { place: 'Toque no mapa para criar um local.', zone: 'Toque no mapa para posicionar uma Bateria de caos com sua Zona e sua Bruma.', link: linkFrom ? 'Agora toque no segundo local.' : 'Toque no primeiro local do caminho.' }[mapMode]) : null,
    box,
    h('p', { class: 'small muted' }, 'Não existe mapa original nos documentos. Posições e caminhos são esquemáticos e decididos por você. Arraste os locais para reposicionar. Locais ocultos aparecem tracejados; os jogadores não os recebem.'));
  renderMap(box, { master: true, fit: !mapMode, editable: !mapMode, places: gm.map.places, links: gm.map.links, zones: gm.map.zones, tokens, trails, selected: linkFrom,
    onMovePlace: async (id, x, y) => { const g = clone(ms.gm); g.map.places[id].x = x; g.map.places[id].y = y; ms.gm = g; await saveMap(g); },
    onTapPlace: async id => {
      if (mapMode === 'zone') { const p = places()[id]; return createZone(p.x, p.y); }
      if (mapMode === 'link') {
        if (!linkFrom) { linkFrom = id; paint(); return; }
        if (linkFrom !== id) { const g = clone(ms.gm); g.map.links.push({ a: linkFrom, b: id }); ms.gm = g; linkFrom = null; await saveMap(g); toast('Caminho criado.'); }
        return;
      }
      placeSheet(id);
    },
    onTapZone: id => { if (!mapMode) zoneSheet(id); },
    onTapEmpty: async (x, y) => {
      if (mapMode === 'place') { const g = clone(ms.gm); const id = 'p' + uid8(); g.map.places[id] = { name: 'Novo local', x, y, desc: '', known: false, knownBy: [] }; ms.gm = g; mapMode = null; await saveMap(g); placeSheet(id); }
      else if (mapMode === 'zone') createZone(x, y);
    } });
}

async function createZone(x, y) {
  const g = clone(ms.gm); g.map.zones = g.map.zones || {};
  const id = 'z' + uid8();
  g.map.zones[id] = { x, y, rB: 110, rZ: 45, label: 'Bruma caótica', bateria: '', seen: false };
  ms.gm = g; mapMode = null; await saveMap(g); zoneSheet(id);
}

function placeSheet(id) {
  const g = clone(ms.gm); const p = g.map.places[id];
  const nm = h('input', { class: 'in', id: 'pl-name', value: p.name, maxlength: 60 });
  const ds = h('textarea', { class: 'in', id: 'pl-desc', rows: 3, placeholder: 'Descrição (vem da sua narração)' }, p.desc || '');
  let vis = p.known ? 'todos' : (p.knownBy || []).length ? 'alguns' : 'oculto';
  let knownBy = [...(p.knownBy || [])];
  const ids = Object.keys(ms.roster);
  const kb = h('div', { class: 'chips' + (vis === 'alguns' ? '' : ' hide') }, ids.map(u => h('label', { class: 'chip check' }, h('input', { type: 'checkbox', checked: knownBy.includes(u), onchange: e => { knownBy = e.target.checked ? [...knownBy, u] : knownBy.filter(x => x !== u); } }), charName(u))));
  let movers = [];
  const mv = h('div', { class: 'chips' }, ids.map(u => h('label', { class: 'chip check' }, h('input', { type: 'checkbox', onchange: e => { movers = e.target.checked ? [...movers, u] : movers.filter(x => x !== u); } }), charName(u))));
  const isStart = ms.session.startPlaceId === id;
  const s = sheet({ title: p.name, sub: 'Local do mapa provisório', body: h('div', { class: 'stack' },
    field('Nome', nm), field('Descrição', ds),
    h('span', { class: 'f-label' }, 'Quem conhece este lugar'),
    seg([{ v: 'todos', label: 'O grupo' }, { v: 'alguns', label: 'Alguns' }, { v: 'oculto', label: 'Oculto' }], vis, v => { vis = v; kb.classList.toggle('hide', v !== 'alguns'); }), kb,
    h('span', { class: 'f-label' }, 'Mover personagens para cá'), mv,
    h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: isStart, id: 'pl-start' }), 'Local inicial da sessão'),
    h('div', { class: 'row between' },
      h('button', { class: 'btn ghost danger-t', onclick: async () => { if (!await ask(`Apagar ${p.name}?`, { ok: 'Apagar', danger: true, detail: 'Os caminhos ligados a ele somem. Personagens que estavam aqui ficam sem local.' })) return; const g2 = clone(ms.gm); delete g2.map.places[id]; g2.map.links = g2.map.links.filter(l => l.a !== id && l.b !== id); ms.gm = g2; await saveMap(g2); for (const u of ids) if ((ms.sheets[u] || {}).placeId === id) await mutate(u, 'Local apagado', x => moveIn(x, null)); s.close(); } }, icon('trash', 18), 'Apagar'),
      h('button', { class: 'btn primary', onclick: async () => {
        p.name = nm.value.trim() || p.name; p.desc = ds.value.trim(); p.known = vis === 'todos'; p.knownBy = vis === 'alguns' ? knownBy : [];
        ms.gm = g; await saveMap(g);
        const startCk = document.getElementById('pl-start');
        if (startCk && startCk.checked !== isStart) await saveSession({ startPlaceId: startCk.checked ? id : null });
        const aids = [];
        for (const u of movers) { const a = await mutate(u, `Deslocamento: ${p.name}`, x => moveIn(x, id)); a && aids.push(a); }
        if (movers.length) toast(`${movers.map(charName).join(', ')} em ${p.name}.`, { action: async () => { for (const a of aids) await undoAudit(ms.sid, a, true); } });
        s.close();
      } }, 'Salvar'))) });
}

function zoneSheet(id) {
  const g = clone(ms.gm); const z = g.map.zones[id];
  const lb = h('input', { class: 'in', value: z.label || '', maxlength: 60 });
  const bt = h('input', { class: 'in', value: z.bateria || '', maxlength: 80, placeholder: 'O que é a Bateria (material ou criatura)' });
  const rB = h('input', { type: 'range', min: 40, max: 300, value: z.rB, 'aria-label': 'Raio da Bruma' });
  const rZ = h('input', { type: 'range', min: 10, max: 200, value: z.rZ, 'aria-label': 'Raio da Zona volátil' });
  const seen = h('input', { type: 'checkbox', checked: !!z.seen });
  const s = sheet({ title: z.label || 'Zona de Caos', sub: 'Bateria ⊂ Zona volátil ⊂ Bruma', body: h('div', { class: 'stack' },
    h('p', { class: 'small muted' }, `${CHAOS.bruma.text} ${CHAOS.zona.text}`),
    field('Nome', lb), field('Bateria de caos', bt, 'Se a Bateria sair da Bruma, a Zona se parte e a criatura "enberna" [SD p.4].'),
    field('Raio da Bruma', rB), field('Raio da Zona volátil', rZ),
    h('label', { class: 'check' }, seen, 'Bruma avistada pelo grupo (aparece no mapa de quem está fora)'),
    h('p', { class: 'small muted' }, 'Quem está dentro não vê a Bruma no mapa. Recebe só a sensação de que a natureza está corrompida.'),
    h('div', { class: 'row between' },
      h('button', { class: 'btn ghost danger-t', onclick: async () => { const g2 = clone(ms.gm); delete g2.map.zones[id]; ms.gm = g2; await saveMap(g2); s.close(); } }, icon('trash', 18), 'Apagar'),
      h('button', { class: 'btn primary', onclick: async () => { z.label = lb.value.trim(); z.bateria = bt.value.trim(); z.rB = +rB.value; z.rZ = Math.min(+rZ.value, +rB.value - 5); z.seen = seen.checked; ms.gm = g; await saveMap(g); s.close(); } }, 'Salvar'))) });
}

// ------------------------------------------------------------ REGISTRO
let regFilter = 'tudo', regQ = '';
function viewRegistro(main) {
  const list = h('div', { class: 'stack' });
  const draw = () => {
    clear(list);
    let items = [];
    if (regFilter === 'tudo' || regFilter === 'todos') items.push(...ms.log);
    if (regFilter === 'tudo' || regFilter === 'alguns') items.push(...ms.gmlog.filter(e => e.vis === 'alguns'));
    if (regFilter === 'tudo' || regFilter === 'mestre') items.push(...ms.gmlog.filter(e => e.vis === 'mestre'));
    if (regFilter === 'alteracoes') items = ms.audit.map(a => ({ ...a, isAudit: true }));
    items = items.filter(e => !regQ || norm((e.text || e.label || '') + ' ' + (e.title || '')).includes(norm(regQ))).sort((a, b) => b.ts - a.ts);
    if (!items.length) list.appendChild(empty('Nada por aqui ainda.'));
    for (const e of items) {
      if (e.isAudit) list.appendChild(h('div', { class: 'card row between audit' + (e.undone ? ' undone' : '') }, h('span', null, h('small', { class: 'muted' }, fmtTime(e.ts) + ' · '), e.label), e.undone ? h('small', { class: 'muted' }, 'desfeito') : h('button', { class: 'btn ghost small', onclick: () => undo(e.id) }, icon('undo', 16), 'Desfazer')));
      else { const c = entryCard({ ...e, scope: '' }); c.querySelector('header').appendChild(h('span', { class: 'tag ' + (e.vis === 'mestre' ? 't-secret' : e.vis === 'alguns' ? 't-you' : 't-canon') }, e.vis === 'mestre' ? 'Só o Mestre' : e.vis === 'alguns' ? 'Para ' + (e.to || []).map(charName).join(', ') : 'Todos')); if (cap.tts) c.appendChild(h('button', { class: 'btn ghost small', onclick: () => cap.tts.speak(e.text, { language: 'pt-BR' }).catch(() => {}) }, icon('speaker', 16), 'Ouvir')); list.appendChild(c); }
    }
  };
  const q = h('input', { class: 'in', type: 'search', id: 'reg-q', placeholder: 'Procurar acontecimentos', value: regQ, oninput: e => { regQ = e.target.value; draw(); } });
  put(main, h('div', { class: 'row between' }, h('h2', { class: 'title-m' }, 'Registro'), h('button', { class: 'btn small', onclick: chronicle }, icon('book', 16), 'Gerar crônica')),
    seg([{ v: 'tudo', label: 'Tudo' }, { v: 'todos', label: 'Públicos' }, { v: 'alguns', label: 'Individuais' }, { v: 'mestre', label: 'Mestre' }, { v: 'alteracoes', label: 'Alterações' }], regFilter, v => { regFilter = v; draw(); }),
    h('label', { class: 'search' }, icon('search', 18), q), list);
  draw();
}

async function chronicle() {
  const entries = [...ms.log, ...ms.gmlog.filter(e => e.vis === 'alguns')].filter(e => e.kind !== 'sistema').sort((a, b) => a.ts - b.ts);
  if (!entries.length) return toast('Ainda não há acontecimentos para a crônica.');
  const ta = h('textarea', { class: 'in', id: 'chron', rows: 12 }, 'Escrevendo…');
  const s = sheet({ title: 'Crônica da sessão', sub: ms.session.name, wide: true, body: h('div', { class: 'stack' }, ta,
    h('div', { class: 'row end wrap' }, h('button', { class: 'btn', onclick: () => copyText(ta.value + '\n\n' + SIGN) }, icon('copy'), 'Copiar'),
      h('button', { class: 'btn primary', onclick: async () => { await writeLog(ms.sid, { text: ta.value.trim(), title: 'Crônica', kind: 'cronica', signed: true }); toast('Crônica publicada no diário de todos.'); s.close(); } }, 'Publicar para todos'))) });
  const plain = entries.map(e => `[${fmtDay(e.ts)} ${fmtTime(e.ts)}] ${e.title ? e.title + ': ' : ''}${e.text}`).join('\n');
  const ai = AI();
  if (ai) {
    try { ta.value = String(await ai.chronicle(plain, t => { ta.value = t; })).trim(); return; }
    catch { toast('Claude indisponível; montei a crônica a partir dos registros.'); }
  }
  ta.value = entries.map(e => `${e.title ? e.title + '. ' : ''}${e.text}`).join('\n\n');
}

// ------------------------------------------------------------ MAIS
let moreTab = 'sessao';
function viewMais(main) {
  main.appendChild(seg([{ v: 'sessao', label: 'Sessão' }, { v: 'ferramentas', label: 'Ferramentas' }, { v: 'bestiario', label: 'Bestiário' }, { v: 'codice', label: 'Códice' }], moreTab, v => { moreTab = v; paint(); }));
  ({ sessao: moreSessao, ferramentas: moreTools, bestiario: moreBestiary, codice: moreCodex })[moreTab](main);
}

function moreSessao(main) {
  const S = clone(ms.session);
  const save = async (label = 'Sessão salva.') => { const { map, startPlaceId, ...patch } = S; await saveSession(patch); toast(label); };
  const op = h('textarea', { class: 'in', id: 'opening', rows: 5, placeholder: 'O contexto que abre a campanha. Aparece na introdução de cada personagem.' }, S.opening || '');
  const raceIn = h('input', { class: 'in', id: 'race-in', placeholder: 'Nova raça (sua decisão)' });
  const resIn = h('input', { class: 'in', id: 'res-in', placeholder: 'Ex.: Moedas' });
  const rule = (k, label) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!S.rules[k], onchange: e => { S.rules[k] = e.target.checked; save('Regra atualizada.'); } }), label);
  put(main, 
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Estado'),
      seg([{ v: 'aberta', label: 'Aberta' }, { v: 'pausada', label: 'Pausada' }, { v: 'encerrada', label: 'Encerrada' }], S.status, v => { S.status = v; save(); }),
      h('p', { class: 'f-label' }, 'Modo'),
      seg([{ v: 'campanha', label: 'Campanha' }, { v: 'prisioneiros', label: 'One shot: Prisioneiros' }], S.mode, v => { S.mode = v; save(); }),
      h('p', { class: 'small muted' }, 'Nos prisioneiros, a Sanidade é o contador de corrupção e sofre dano durante toda a one shot [RS p.3].')),
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Abertura da campanha'), op,
      h('div', { class: 'row end wrap' }, h('button', { class: 'btn', onclick: () => { S.opening = op.value.trim(); save('Abertura salva.'); } }, 'Salvar'),
        h('button', { class: 'btn primary', onclick: async () => { S.opening = op.value.trim(); await save('Abertura salva.'); if (S.opening) { await writeLog(ms.sid, { text: S.opening, title: 'Abertura', kind: 'abertura', signed: true }); toast('Abertura publicada para todos.'); } } }, 'Publicar como narrativa'))),
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Dia e descanso'),
      h('p', { class: 'small' }, h('span', { class: 'tag t-contra' }, 'Contradição C1'), ' Um documento diz que a reserva volta no dia seguinte; o mais recente fala em descanso de 8 h (tudo) e de 4 h (metade, do tier mais baixo).'),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn', onclick: async () => { for (const u of Object.keys(ms.sheets)) await mutate(u, 'Descanso longo / novo dia', x => restFull(x)); S.day = (S.day || 1) + 1; await save(`Dia ${S.day}. Reservas restauradas.`); } }, icon('sun', 18), 'Novo dia ou descanso de 8 h'),
        h('button', { class: 'btn ghost', onclick: async () => { for (const u of Object.keys(ms.sheets)) await mutate(u, 'Descanso de 4 h', x => restHalf(x)); toast('Metade da reserva restaurada.'); } }, 'Descanso de 4 h'))),
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Raças liberadas'),
      h('p', { class: 'small muted' }, 'Humano está nos documentos. Qualquer outra raça é decisão sua e aparece como tal.'),
      h('div', { class: 'chips' }, h('span', { class: 'chip sel' }, 'Humano'), (S.races || []).map(r => h('button', { class: 'chip', onclick: () => { S.races = S.races.filter(x => x !== r); save(); } }, r, ' ×'))),
      h('div', { class: 'row' }, raceIn, h('button', { class: 'btn', onclick: () => { if (raceIn.value.trim()) { S.races = [...(S.races || []), raceIn.value.trim()]; save(); } } }, 'Liberar'))),
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Contadores de recurso ', tag('proposta')),
      h('p', { class: 'small muted' }, 'Os documentos não têm moeda nem economia. Se você decidir que existe, crie o contador aqui.'),
      h('div', { class: 'chips' }, (S.resources || []).map(r => h('button', { class: 'chip', onclick: () => { S.resources = S.resources.filter(x => x.key !== r.key); save(); } }, r.label, ' ×'))),
      h('div', { class: 'row' }, resIn, h('button', { class: 'btn', onclick: () => { const l = resIn.value.trim(); if (l) { S.resources = [...(S.resources || []), { key: norm(l).replace(/[^a-z0-9]+/g, '-'), label: l }]; save(); } } }, 'Criar'))),
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Fome e sede ', tag('proposta')),
      h('p', { class: 'small muted' }, 'O sistema de Zito não tem fome nem sede. Ligue só se decidir incluir.'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!S.survival.fome, onchange: e => { S.survival.fome = e.target.checked; save(); } }), 'Medidor de fome'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!S.survival.sede, onchange: e => { S.survival.sede = e.target.checked; save(); } }), 'Medidor de sede')),
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Pedidos aprovados automaticamente'),
      rule('autoSpend', 'Gastar dados da reserva'), rule('autoDefense', 'Fixar defesa'), rule('autoEquip', 'Equipar e desequipar'), rule('autoPoints', 'Distribuir pontos de level'), rule('autoUse', 'Usar habilidade ativa'), rule('autoPericia', 'Nova perícia ou aprimoramento')),
    platform.site ? backupCard() : null,
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Testar como jogador'),
      h('p', { class: 'small muted' }, platform.site ? 'Abre um jogador de teste em outra aba, como se fosse outro celular. Útil para ensaiar sozinho.' : 'Abre a visão do jogador nesta mesa, com uma ficha sua. Útil para ensaiar sozinho.'),
      platform.testLink ? h('a', { class: 'btn ghost', href: platform.testLink(ms.session.code), target: '_blank', rel: 'noopener' }, 'Abrir jogador de teste') : h('button', { class: 'btn ghost', onclick: () => { for (const u of ms.subs) u(); startPlayer(root, { code: ms.session.code }); } }, 'Entrar como jogador')));
}

function backupCard() {
  const file = h('input', { type: 'file', accept: 'application/json,.json', class: 'hide', id: 'backup-in', onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const r = await platform.importBackup(JSON.parse(await f.text())); toast('Backup restaurado.'); if (r.reload) setTimeout(() => location.reload(), 600); }
    catch (err) { toast(err && err.message ? err.message : 'Não consegui ler esse arquivo.'); }
  } });
  const warn = platform.storageWarning && platform.storageWarning();
  return h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Backup da campanha'),
    h('p', { class: 'small muted' }, 'A campanha fica guardada neste aparelho. Baixe um backup no fim de cada sessão. Para continuar em outro celular, restaure o arquivo lá: ele leva a sua chave de Mestre, e os convites continuam valendo.'),
    warn ? h('p', { class: 'note bad' }, 'O navegador recusou guardar os dados neste aparelho. Baixe o backup agora.') : null,
    h('div', { class: 'row wrap' },
      h('button', { class: 'btn', onclick: () => {
        const data = JSON.stringify(platform.exportSession(ms.sid), null, 1);
        const a = h('a', { href: URL.createObjectURL(new Blob([data], { type: 'application/json' })), download: `survival-or-dice-${ms.session.code}-${new Date().toISOString().slice(0, 10)}.json` });
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      } }, icon('copy', 18), 'Baixar backup'),
      h('label', { class: 'btn ghost', for: 'backup-in' }, 'Restaurar backup'), file));
}

function moreTools(main) {
  let lv = 1, step = 0, agi = 5, ter = 'normal', run = false, sorte = 50;
  const out1 = h('b', { class: 'big-n' }), out2 = h('b', { class: 'big-n' }), out3 = h('div');
  const calc = () => {
    const v = difficulty(lv, step); out1.textContent = v == null ? 'a definir' : String(v);
    const m = moveBudget(deslocamento(agi, 5), ter, run); out2.textContent = `${m.squares} quadrados`;
  };
  put(main, 
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Dificuldade'),
      h('div', { class: 'row between' }, h('span', null, 'Level'), stepper(1, { min: 1, max: 7, label: 'level', onChange: v => { lv = v; calc(); } })),
      seg(DIFF_STEPS.map(x => ({ v: x.k, label: x.name })), 0, v => { step = v; calc(); }),
      h('p', null, 'Alvo: ', out1), h('p', { class: 'small muted' }, 'Base do level + cerca de 4 por degrau [RF p.1]. Acima do level 7 a tabela ainda não existe. Quem usa o ponto forte passa com folga: suba o alvo.')),
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Deslocamento (humano)'),
      h('div', { class: 'row between' }, h('span', null, 'Agilidade'), stepper(5, { min: 0, max: 40, label: 'agilidade', onChange: v => { agi = v; calc(); } })),
      seg(TERRAIN.map(t => ({ v: t.k, label: t.name })), 'normal', v => { ter = v; calc(); }),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', onchange: e => { run = e.target.checked; calc(); } }), 'Correndo'),
      h('p', null, out2), h('p', { class: 'small muted' }, 'Base 5, +1 a cada 2 de Agilidade acima de 5. Correr dobra; em terreno difícil soma só metade [RF p.3–4].')),
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Sorte'),
      h('div', { class: 'row between' }, h('span', null, 'Sorte do personagem'), stepper(50, { min: 1, max: 100, label: 'sorte', onChange: v => { sorte = v; } })),
      h('button', { class: 'btn', onclick: () => { const r = (d(10) - 1) * 10 + (d(10) - 1) || 100; const L = luck(sorte, r); clear(out3); put(out3, h('p', null, h('b', { class: 'big-n' }, String(r)), ` ${L.label} · margem ${L.margin}`), h('p', null, L.effect)); } }, 'Rolar D100'), out3));
  calc();
}

async function moreBestiary(main) {
  main.appendChild(h('p', { class: 'note' }, icon('hidden', 16), platform.site ? ' Só o Mestre vê o bestiário. Ele fica no banco deste aparelho, com leitura bloqueada para os jogadores.' : ' Só o Mestre vê o bestiário. Ele fica no banco com leitura restrita ao dono da página.'));
  await ensureLore();
  const b = await getDoc(P.bestiary());
  if (!b) return main.appendChild(empty('Bestiário ainda não carregado no banco.'));
  const host = h('div', { class: 'stack' });
  main.appendChild(host);
  host.appendChild(h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Regras de criatura'), (b.regras || []).map(t => h('p', null, t))));
  const net = h('section', { class: 'card' }, h('h2', { class: 'card-t' }, icon('ant', 18), ' Formigas quimeras'));
  for (const cat of b.formigas || []) net.appendChild(h('div', { class: 'caste' }, h('div', { class: 'row between' }, h('b', null, cat.categoria), h('span', { class: 'muted' }, `level ${cat.level}`)), h('div', { class: 'chips' }, cat.castas.map(c => h('span', { class: 'chip' + (c.v === 'V1' ? ' v1' : c.v === 'V2' ? ' v2' : '') }, c.nome, ' ', h('small', null, c.v || 'V0'))))));
  net.appendChild(h('div', { class: 'vnet' }, (b.rede || []).map(r => h('div', { class: 'vrow' }, h('b', null, r.nivel), h('span', null, r.texto)))));
  host.appendChild(net);
  if (b.rainha) {
    const q = b.rainha;
    const grid = h('div', { class: 'queen-grid', 'aria-label': 'Rainha no grid: corpo 3 por 3, zona de ameaça 7 por 7' });
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) grid.appendChild(h('i', { class: x >= 2 && x <= 4 && y >= 2 && y <= 4 ? 'body' : 'threat' }));
    host.appendChild(h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'A Rainha'), h('div', { class: 'queen' }, grid, h('div', { class: 'stack tight' }, q.fatos.map(t => h('p', null, t))))));
  }
  if (b.neri) host.appendChild(h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Batedora Neri'), h('p', null, b.neri)));
  if (b.contradicoes) host.appendChild(h('section', { class: 'card' }, h('h2', { class: 'card-t' }, tag('contradicao')), b.contradicoes.map(t => h('p', { class: 'small' }, t))));
}

async function ensureLore() {
  if (!platform.seedCodex) return;
  if (await getDoc(P.codex()) && await getDoc(P.bestiary())) return;
  try { await platform.seedCodex(); } catch {}
}
async function moreCodex(main) {
  await ensureLore();
  const cdx = await getDoc(P.codex());
  if (!cdx) return main.appendChild(empty('O códice ainda não foi carregado no banco.'));
  const sections = String(cdx.bible || '').split(/\n(?=#{2,3} )/);
  let q = '';
  const list = h('div', { class: 'stack' });
  const draw = () => { clear(list); const hits = sections.filter(s => !q || norm(s).includes(norm(q))).slice(0, 12); for (const s of hits) list.appendChild(h('pre', { class: 'codex' }, s.trim())); if (!hits.length) list.appendChild(empty('Nada na bíblia sobre isso. Pode ser uma lacuna.')); };
  const inp = h('input', { class: 'in', type: 'search', id: 'codex-q', placeholder: 'Procurar na bíblia: Rainha, Sorte, Bruma…', oninput: e => { q = e.target.value; draw(); } });
  const askIn = h('input', { class: 'in', id: 'codex-ask', placeholder: 'Pergunte: o que acontece se a Bateria sair da Bruma?' });
  const ans = h('div', { class: 'answer', 'aria-live': 'polite' });
  const note = h('textarea', { class: 'in', id: 'codex-note', rows: 3, placeholder: 'Nova informação de lore (fica como nota até entrar na bíblia)' });
  put(main, 
    AI() ? h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Perguntar ao assistente'), askIn,
      h('button', { class: 'btn', onclick: async () => {
        if (!askIn.value.trim()) return; ans.textContent = 'Consultando…';
        try { ans.textContent = await AI().ask(cdx.bible, cdx.notes, askIn.value.trim(), t => { ans.textContent = t; }); }
        catch { ans.textContent = 'O assistente não respondeu agora.'; }
      } }, 'Perguntar'), ans) : null,
    h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Notas de lore do Mestre'),
      (cdx.notes || []).map(n => h('p', { class: 'small' }, h('span', { class: 'muted' }, fmtDay(n.ts) + ' · '), n.text)), note,
      h('button', { class: 'btn', onclick: async () => { if (!note.value.trim()) return; await write(P.codex(), { ...cdx, notes: [...(cdx.notes || []), { ts: now(), text: note.value.trim() }] }); toast('Nota guardada no códice.'); paint(); } }, 'Guardar nota')),
    h('label', { class: 'search' }, icon('search', 18), inp), list);
  draw();
}
