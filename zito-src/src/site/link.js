// Ligação entre os aparelhos da mesa. Cada sala é um canal de broadcast do
// Supabase Realtime ("sod-CODIGO"); nada é gravado no Supabase. O Mestre
// anuncia sua chave pública; cada jogador combina uma chave só sua com ele.
// Em teste, o mesmo protocolo roda sobre um retransmissor WebSocket local.
import { createClient } from '@supabase/supabase-js';
import { sharedKey, seal, open, fingerprint } from './crypto.js';

let sb = null;
export function initSupabase(url, anon) {
  if (!sb && url && anon) sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { params: { eventsPerSecond: 40 } } });
  return !!sb;
}

// ---- canal genérico: send(event, payload), on(event, fn), status(fn), close()
function supabaseChannel(name) {
  const ch = sb.channel(name, { config: { broadcast: { self: false, ack: false } } });
  const handlers = {};
  const statusFns = new Set();
  ch.on('broadcast', { event: '*' }, ({ event, payload }) => { (handlers[event] || []).forEach(f => f(payload)); });
  ch.subscribe(st => statusFns.forEach(f => f(st === 'SUBSCRIBED')));
  return {
    send: (event, payload) => ch.send({ type: 'broadcast', event, payload }).catch(() => {}),
    on: (event, fn) => { (handlers[event] = handlers[event] || []).push(fn); },
    status: fn => statusFns.add(fn),
    close: () => { try { sb.removeChannel(ch); } catch {} },
  };
}
function relayChannel(base, name) {
  const handlers = {};
  const statusFns = new Set();
  let ws, alive = true;
  const connect = () => {
    ws = new WebSocket(`${base}?ch=${encodeURIComponent(name)}`);
    ws.onopen = () => statusFns.forEach(f => f(true));
    ws.onclose = () => { statusFns.forEach(f => f(false)); if (alive) setTimeout(connect, 600); };
    ws.onmessage = ev => { const m = JSON.parse(ev.data); (handlers[m.event] || []).forEach(f => f(m.payload)); };
  };
  connect();
  window.__sodDrop = () => { try { ws.close(); } catch {} }; // só no modo de teste (retransmissor local)
  return {
    send: (event, payload) => { if (ws.readyState === 1) ws.send(JSON.stringify({ event, payload })); },
    on: (event, fn) => { (handlers[event] = handlers[event] || []).push(fn); },
    status: fn => statusFns.add(fn),
    close: () => { alive = false; try { ws.close(); } catch {} },
  };
}
function channel(name, relay) { return relay ? relayChannel(relay, name) : supabaseChannel(name); }
export const roomName = code => 'sod-' + String(code).toLowerCase();

// ---- lado do Mestre: recebe de todos, responde a cada um em particular
export function hostLink({ code, keys, relay, onMessage, onPeerGone }) {
  const ch = channel(roomName(code), relay);
  const peers = new Map(); // uid -> { key, pub, last }
  const fp = keys.uid.slice(0, 8);
  const beacon = () => ch.send('host', { pub: keys.pub, fp, code });
  ch.status(ok => { if (ok) beacon(); });
  const iv = setInterval(beacon, 4000);
  const gc = setInterval(() => { const now = Date.now(); for (const [uid, p] of peers) if (now - p.last > 16000) { peers.delete(uid); onPeerGone && onPeerGone(uid); } }, 4000);
  ch.on('hello', async ({ pub, uid }) => {
    if (!pub || !uid) return;
    if (await fingerprint(pub) !== uid) return; // identidade forjada
    const p = peers.get(uid);
    if (!p || p.pub !== pub) peers.set(uid, { key: await sharedKey(keys.priv, pub), pub, last: Date.now() });
    else p.last = Date.now();
    beacon();
  });
  ch.on('m', async ({ to, from, iv: ivv, ct }) => {
    if (to !== 'host' || !from) return;
    const p = peers.get(from);
    if (!p) { ch.send('who', { uid: from }); return; }
    p.last = Date.now();
    let obj;
    try { obj = await open(p.key, { iv: ivv, ct }); } catch { return; }
    onMessage(from, obj);
  });
  return {
    fp,
    async send(uid, obj) {
      const p = peers.get(uid); if (!p) return;
      ch.send('m', { to: uid, from: 'host', ...(await seal(p.key, obj)) });
    },
    connected: uid => peers.has(uid),
    close() { clearInterval(iv); clearInterval(gc); ch.close(); },
  };
}

// ---- lado do jogador: um "cano" com send/onMessage/onOpen/onClose
export function guestLink({ code, keys, relay, expectFp }) {
  const ch = channel(roomName(code), relay);
  let hostKey = null, hostPub = null, hostSeen = 0, sub = false, opened = false;
  const msgFns = new Set(), openFns = new Set(), closeFns = new Set();
  const hello = () => ch.send('hello', { pub: keys.pub, uid: keys.uid });
  const isOpen = () => sub && !!hostKey && Date.now() - hostSeen < 13000;
  const check = () => { const now = isOpen(); if (now && !opened) { opened = true; openFns.forEach(f => f()); } else if (!now && opened) { opened = false; closeFns.forEach(f => f()); } };
  ch.status(ok => { sub = ok; if (ok) hello(); check(); });
  ch.on('host', async ({ pub, fp }) => {
    if (expectFp && fp !== expectFp) return; // anúncio que não bate com o convite
    if (pub !== hostPub) { hostPub = pub; hostKey = await sharedKey(keys.priv, pub); hello(); }
    hostSeen = Date.now(); check();
  });
  ch.on('who', ({ uid }) => { if (uid === keys.uid) hello(); });
  ch.on('m', async ({ to, iv, ct }) => {
    if (to !== keys.uid || !hostKey) return;
    let obj; try { obj = await open(hostKey, { iv, ct }); } catch { return; }
    hostSeen = Date.now(); check();
    msgFns.forEach(f => f(obj));
  });
  const tick = setInterval(() => { if (sub) hello(); check(); }, 5000);
  return {
    async send(obj) { if (!hostKey) return false; ch.send('m', { to: 'host', from: keys.uid, ...(await seal(hostKey, obj)) }); return true; },
    onMessage: f => msgFns.add(f), onOpen: f => openFns.add(f), onClose: f => closeFns.add(f),
    isOpen, close() { clearInterval(tick); ch.close(); },
  };
}
