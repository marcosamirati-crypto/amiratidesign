// Servidor de TESTE. Reproduz o contrato das capacidades db/room/user da
// plataforma (mesmas regras de acesso declaradas na página) para testar o
// multiplayer com vários navegadores. Não faz parte do produto publicado.
import http from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { WebSocketServer } from 'ws';
import { RULES } from './rules.mjs';

const DIST = new URL('../dist/', import.meta.url).pathname;
const KIT = new URL('./', import.meta.url).pathname;
const store = new Map(); // path -> data
const LV = { view: 1, interact: 2, admin: 3, owner: 4 };
const ROLES = { master: { id: 'u-master', level: 'owner' }, p1: { id: 'u-p1', level: 'interact' }, p2: { id: 'u-p2', level: 'interact' }, p3: { id: 'u-p3', level: 'interact' }, viewer: { id: 'u-viewer', level: 'view' } };

function ruleFor(path, who) {
  // nível exigido = regra mais funda que casa; {self} casa só com o id do visitante
  const segs = path.split('/');
  let read = 'view', write = 'interact', depth = -1;
  let selfMatch = false;
  for (const r of RULES) {
    const rs = r.path ? r.path.split('/') : [];
    if (rs.length > segs.length) continue;
    let ok = true, usesSelf = false;
    for (let i = 0; i < rs.length; i++) {
      if (rs[i] === '{self}') { usesSelf = true; if (segs[i] !== who.id) { ok = false; break; } }
      else if (rs[i] !== segs[i]) { ok = false; break; }
    }
    if (!ok || rs.length < depth) continue;
    depth = rs.length;
    if (r.read) read = r.read;
    if (r.write) write = r.write;
    selfMatch = usesSelf;
  }
  return { read, write, selfMatch };
}
const can = (who, path, op) => { const r = ruleFor(path, who); const need = op === 'read' ? r.read : r.write; if (need === 'self') return false; return LV[who.level] >= LV[need]; };

const parity = (p, even) => { const n = p.split('/').length; return even ? n % 2 === 0 : n % 2 === 1; };
const snapDoc = (who, path) => { const ok = can(who, path, 'read') && store.has(path); return { id: path.split('/').pop(), exists: ok, data: ok ? store.get(path) : undefined }; };
function runQuery(who, q) {
  const prefix = q.path + '/';
  let docs = [];
  for (const [p, d] of store) if (p.startsWith(prefix) && !p.slice(prefix.length).includes('/') && can(who, p, 'read')) docs.push({ id: p.slice(prefix.length), data: d });
  for (const [f, op, v] of q.where || []) docs = docs.filter(x => { const a = x.data[f]; return op === '==' ? a === v : op === '!=' ? a !== v : op === '<' ? a < v : op === '<=' ? a <= v : op === '>' ? a > v : op === '>=' ? a >= v : op === 'in' ? v.includes(a) : op === 'array-contains' ? Array.isArray(a) && a.includes(v) : true; });
  if (q.orderBy) { const [f, dir] = q.orderBy; docs.sort((a, b) => { const x = a.data[f], y = b.data[f]; if (x === y) return 0; if (x === undefined) return 1; if (y === undefined) return -1; return (x < y ? -1 : 1) * (dir === 'desc' ? -1 : 1); }); }
  else docs.sort((a, b) => a.id < b.id ? -1 : 1);
  if (q.limit) docs = docs.slice(0, q.limit);
  return docs;
}
const merge = (a, b) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? merge(a[k], v) : v; return o; };

const clients = new Set();
const rooms = new Map(); // name -> Map(ws -> presence)
let peerN = 0;

function notify() {
  for (const c of clients) for (const [sid, s] of c.subs) {
    const payload = s.kind === 'doc' ? snapDoc(c.who, s.path) : runQuery(c.who, s);
    const key = JSON.stringify(payload);
    if (key !== s.last) { s.last = key; c.send({ t: 'snap', sid, payload }); }
  }
}
function peersOf(name) { const r = rooms.get(name); if (!r) return []; return [...r.entries()].map(([ws, pres]) => ({ peer: ws.peer, by: ws.who.id, presence: pres, kind: 'viewer', guest: false })); }
function broadcastPeers(name) { const r = rooms.get(name); if (!r) return; for (const ws of r.keys()) ws.send({ t: 'peers', room: name, peers: peersOf(name) }); }

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/kick') { const as = u.searchParams.get('as'); let n = 0; for (const c of clients) if (c.as === as) { c.terminate(); n++; } res.end('kicked ' + n); return; }
  if (u.pathname === '/dump') { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(Object.fromEntries(store), null, 1)); return; }
  let file = u.pathname === '/' ? join(DIST, 'index.html') : u.pathname.startsWith('/testkit/') ? join(KIT, u.pathname.slice(9)) : join(DIST, u.pathname);
  if (!existsSync(file)) { res.statusCode = 404; return res.end('404'); }
  let body = readFileSync(file);
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css' }[extname(file)] || 'application/octet-stream';
  if (file.endsWith('index.html')) body = body.toString().replace('<script src="app.js"></script>', '<script src="/testkit/runtime.js"></script><script src="app.js"></script>').replace(/<link rel="(preconnect|stylesheet)" href="https:\/\/fonts[^>]+>/g, '');
  res.setHeader('content-type', type + '; charset=utf-8');
  res.end(body);
});

const wss = new WebSocketServer({ server });
wss.on('connection', (raw, req) => {
  const as = new URL(req.url, 'http://x').searchParams.get('as') || 'viewer';
  const ws = raw; ws.as = as; ws.who = ROLES[as] || ROLES.viewer; ws.subs = new Map(); ws.peer = 'peer' + (++peerN); ws.rooms = new Set();
  ws.send = (o => m => o.call(ws, JSON.stringify(m)))(ws.send);
  clients.add(ws);
  ws.on('message', buf => {
    const m = JSON.parse(buf);
    const reply = (ok, data) => ws.send({ t: 'res', rid: m.rid, ok, data });
    try {
      if (m.op === 'get') return reply(true, snapDoc(ws.who, m.path));
      if (m.op === 'set' || m.op === 'update' || m.op === 'delete') {
        if (!parity(m.path, true) || !can(ws.who, m.path, 'write')) return reply(false, { code: 'invalid_argument', message: 'write refused' });
        if (m.op === 'set') store.set(m.path, m.data);
        if (m.op === 'update') { if (!store.has(m.path)) return reply(false, { code: 'invalid_argument', message: 'missing' }); store.set(m.path, merge(store.get(m.path), m.data)); }
        if (m.op === 'delete') store.delete(m.path);
        reply(true); notify(); return;
      }
      if (m.op === 'query') return reply(true, runQuery(ws.who, m.q));
      if (m.op === 'sub') { ws.subs.set(m.sid, { ...m.q, kind: m.kind, path: m.path || m.q.path, last: null }); notify(); return; }
      if (m.op === 'unsub') { ws.subs.delete(m.sid); return; }
      if (m.op === 'join') { if (!rooms.has(m.room)) rooms.set(m.room, new Map()); rooms.get(m.room).set(ws, {}); ws.rooms.add(m.room); reply(true, { peer: ws.peer }); broadcastPeers(m.room); return; }
      if (m.op === 'presence') { const r = rooms.get(m.room); if (r && r.has(ws)) { r.set(ws, { ...r.get(ws), ...m.patch }); broadcastPeers(m.room); } return reply(true); }
      if (m.op === 'emit') { const r = rooms.get(m.room); if (r) for (const o of r.keys()) o.send({ t: 'msg', room: m.room, topic: m.topic, data: m.data, by: ws.who.id, peer: ws.peer, mine: o === ws }); return reply(true); }
      if (m.op === 'leave') { const r = rooms.get(m.room); if (r) { r.delete(ws); broadcastPeers(m.room); } return reply(true); }
    } catch (e) { reply(false, { code: 'invalid_argument', message: String(e) }); }
  });
  ws.on('close', () => { clients.delete(ws); for (const name of ws.rooms) { const r = rooms.get(name); if (r) { r.delete(ws); broadcastPeers(name); } } });
});
const PORT = +process.env.PORT || 8787;
server.listen(PORT, () => console.log('testkit on', PORT));
