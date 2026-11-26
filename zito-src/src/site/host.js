// O aparelho do Mestre é o servidor da mesa: guarda o banco, aplica as
// regras de acesso (as mesmas da versão no Claude) e empurra as mudanças em
// tempo real para cada jogador, que só recebe o que pode ver.
import { RULES } from './rules.js';

const LV = { view: 1, interact: 2, admin: 3, owner: 4 };
const OPEN_TOPICS = new Set(['roll', 'ping']);

function ruleFor(path, uid) {
  const segs = path.split('/');
  let read = 'view', write = 'interact', depth = -1;
  for (const r of RULES) {
    const rs = r.path ? r.path.split('/') : [];
    if (rs.length > segs.length || rs.length < depth) continue;
    let ok = true;
    for (let i = 0; i < rs.length; i++) {
      if (rs[i] === '{self}') { if (segs[i] !== uid) { ok = false; break; } }
      else if (rs[i] !== segs[i]) { ok = false; break; }
    }
    if (!ok) continue;
    depth = rs.length;
    if (r.read) read = r.read;
    if (r.write) write = r.write;
  }
  return { read, write };
}
const merge = (a, b) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? merge(a[k], v) : v; return o; };
const even = p => p.split('/').length % 2 === 0;

export class Host {
  constructor({ ownerUid, storageKey }) {
    this.owner = ownerUid;
    this.key = storageKey;
    this.store = new Map();
    this.clients = new Map(); // uid -> { send, subs: Map, recent: Map, rooms: Set }
    this.rooms = new Map(); // name -> Map(uid -> presence)
    this.persistError = null;
    try { const raw = localStorage.getItem(storageKey); if (raw) for (const [k, v] of Object.entries(JSON.parse(raw))) this.store.set(k, v); } catch (e) { this.persistError = e; }
    this._flushT = null; this._saveT = null;
  }
  level(uid) { return uid === this.owner ? 'owner' : 'interact'; }
  can(uid, path, op) { const r = ruleFor(path, uid); const need = op === 'read' ? r.read : r.write; return LV[this.level(uid)] >= LV[need]; }
  snapDoc(uid, path) { const ok = this.can(uid, path, 'read') && this.store.has(path); return { id: path.split('/').pop(), exists: ok, data: ok ? this.store.get(path) : undefined }; }
  query(uid, q) {
    const prefix = q.path + '/';
    let docs = [];
    for (const [p, d] of this.store) if (p.startsWith(prefix) && !p.slice(prefix.length).includes('/') && this.can(uid, p, 'read')) docs.push({ id: p.slice(prefix.length), data: d });
    for (const [f, op, v] of q.where || []) docs = docs.filter(x => { const a = x.data[f]; return op === '==' ? a === v : op === '!=' ? a !== v : op === '<' ? a < v : op === '<=' ? a <= v : op === '>' ? a > v : op === '>=' ? a >= v : op === 'in' ? v.includes(a) : op === 'array-contains' ? Array.isArray(a) && a.includes(v) : true; });
    if (q.orderBy) { const [f, dir] = q.orderBy; docs.sort((a, b) => { const x = a.data[f], y = b.data[f]; if (x === y) return 0; if (x === undefined) return 1; if (y === undefined) return -1; return (x < y ? -1 : 1) * (dir === 'desc' ? -1 : 1); }); }
    else docs.sort((a, b) => (a.id < b.id ? -1 : 1));
    if (q.limit) docs = docs.slice(0, q.limit);
    return docs;
  }
  attach(uid, send) {
    let c = this.clients.get(uid);
    if (!c) { c = { send, subs: new Map(), recent: new Map(), rooms: new Set() }; this.clients.set(uid, c); }
    else c.send = send;
    return c;
  }
  detach(uid) {
    const c = this.clients.get(uid); if (!c) return;
    for (const name of c.rooms) { const r = this.rooms.get(name); if (r) { r.delete(uid); this.peers(name); } }
    c.rooms.clear(); c.subs.clear();
  }
  save() {
    clearTimeout(this._saveT);
    this._saveT = setTimeout(() => {
      try { localStorage.setItem(this.key, JSON.stringify(Object.fromEntries(this.store))); this.persistError = null; }
      catch (e) { this.persistError = e; }
    }, 300);
  }
  notify() { clearTimeout(this._flushT); this._flushT = setTimeout(() => this.flush(), 25); }
  flush() {
    for (const [uid, c] of this.clients) {
      const items = [];
      for (const [sid, s] of c.subs) {
        const payload = s.kind === 'doc' ? this.snapDoc(uid, s.path) : this.query(uid, s.q);
        const key = JSON.stringify(payload);
        if (key !== s.last) { s.last = key; s.seq++; items.push({ sid, payload, seq: s.seq }); }
      }
      if (items.length) c.send({ t: 'batch', items });
    }
  }
  peers(name) {
    const r = this.rooms.get(name); if (!r) return;
    const list = [...r.entries()].map(([uid, presence]) => ({ peer: uid, by: uid, presence, kind: 'viewer', guest: uid !== this.owner }));
    for (const uid of r.keys()) { const c = this.clients.get(uid); c && c.send({ t: 'peers', room: name, peers: list }); }
  }
  handle(uid, m) {
    const c = this.clients.get(uid); if (!c) return;
    const reply = (ok, data) => { const res = { t: 'res', rid: m.rid, ok, data }; if (m.rid) { c.recent.set(m.rid, res); if (c.recent.size > 300) c.recent.delete(c.recent.keys().next().value); } c.send(res); };
    if (m.rid && c.recent.has(m.rid)) return c.send(c.recent.get(m.rid)); // pedido repetido: mesma resposta
    try {
      switch (m.op) {
        case 'get': return reply(true, this.snapDoc(uid, m.path));
        case 'set': case 'update': case 'delete': {
          if (!even(m.path) || !this.can(uid, m.path, 'write')) return reply(false, { code: 'invalid_argument', message: 'write refused' });
          if (m.op === 'set') this.store.set(m.path, m.data);
          if (m.op === 'update') { if (!this.store.has(m.path)) return reply(false, { code: 'invalid_argument', message: 'missing' }); this.store.set(m.path, merge(this.store.get(m.path), m.data)); }
          if (m.op === 'delete') this.store.delete(m.path);
          reply(true); this.save(); this.notify(); return;
        }
        case 'query': return reply(true, this.query(uid, m.q));
        case 'sub': c.subs.set(m.sid, { kind: m.kind, path: m.path, q: m.q, last: null, seq: 0 }); this.notify(); return;
        case 'unsub': c.subs.delete(m.sid); return;
        case 'check': { // o jogador confere se perdeu alguma atualização
          let stale = false;
          for (const [sid, seq] of Object.entries(m.subs || {})) { const s = c.subs.get(sid); if (s && s.seq !== seq) { s.last = null; stale = true; } }
          for (const sid of Object.keys(m.subs || {})) if (!c.subs.has(sid)) c.send({ t: 'resub', sid });
          if (stale) this.notify(); return;
        }
        case 'join': { if (!this.rooms.has(m.room)) this.rooms.set(m.room, new Map()); this.rooms.get(m.room).set(uid, this.rooms.get(m.room).get(uid) || {}); c.rooms.add(m.room); reply(true, { peer: uid }); this.peers(m.room); return; }
        case 'presence': { const r = this.rooms.get(m.room); if (r && r.has(uid)) { r.set(uid, { ...r.get(uid), ...m.patch }); this.peers(m.room); } return reply(true); }
        case 'emit': {
          if (uid !== this.owner && !OPEN_TOPICS.has(m.topic)) return reply(false, { code: 'not_permitted' });
          const r = this.rooms.get(m.room);
          if (r) for (const o of r.keys()) { const oc = this.clients.get(o); oc && oc.send({ t: 'msg', room: m.room, topic: m.topic, data: m.data, by: uid, mine: o === uid }); }
          return reply(true);
        }
        case 'leave': { const r = this.rooms.get(m.room); if (r) { r.delete(uid); this.peers(m.room); } c.rooms.delete(m.room); return reply(true); }
        case 'hi': return reply(true, { owner: uid === this.owner });
      }
    } catch (e) { reply(false, { code: 'invalid_argument', message: String(e) }); }
  }
  // backup da campanha
  exportSession(sid) {
    const out = {};
    for (const [p, d] of this.store) if (p === `sessions/${sid}` || p.startsWith(`sessions/${sid}/`) || p.startsWith('pc/') && p.includes(`/s/${sid}`) || p.startsWith('req/') || p === `gm/${sid}` || p.startsWith(`gm/${sid}/`) || p === 'gm/codex' || p === 'gm/bestiario') out[p] = d;
    return out;
  }
  importEntries(obj) { for (const [p, d] of Object.entries(obj || {})) if (typeof p === 'string' && even(p) && d && typeof d === 'object') this.store.set(p, d); this.save(); this.notify(); }
}
