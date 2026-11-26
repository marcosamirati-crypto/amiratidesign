// O mesmo contrato de banco/sala/usuário que a página usa no Claude, aqui
// falando com o aparelho do Mestre. Reenvia pedidos sem resposta, refaz as
// assinaturas ao reconectar e confere se perdeu alguma atualização.
export function makeClient(pipe, { uid, owner }) {
  let rid = 0, sidN = 0;
  const pending = new Map(), subs = new Map(), connFns = new Set(), joined = new Map();
  let open = pipe.isOpen();
  const rawSend = o => pipe.send(o);
  const call = o => new Promise((res, rej) => { o.rid = uid.slice(0, 4) + Date.now().toString(36) + (++rid); pending.set(o.rid, { o, res, rej, t: Date.now() }); if (open) rawSend(o); });
  pipe.onMessage(m => {
    if (m.t === 'res') { const p = pending.get(m.rid); if (p) { pending.delete(m.rid); m.ok ? p.res(m.data) : p.rej(m.data); } }
    else if (m.t === 'batch') for (const it of m.items) { const s = subs.get(it.sid); if (s) { s.seq = it.seq; s.deliver(it.payload); } }
    else if (m.t === 'peers') { const r = joined.get(m.room); r && r._peers(m.peers); }
    else if (m.t === 'msg') { const r = joined.get(m.room); r && r._msg(m); }
    else if (m.t === 'resub') { const s = subs.get(m.sid); s && rawSend({ op: 'sub', sid: m.sid, kind: s.kind, path: s.path, q: s.q }); }
  });
  const resync = () => {
    for (const [sid, s] of subs) rawSend({ op: 'sub', sid, kind: s.kind, path: s.path, q: s.q });
    for (const [name, r] of joined) { rawSend({ op: 'join', room: name, rid: 'j' + Date.now() + name }); if (r._pres) rawSend({ op: 'presence', room: name, patch: r._pres, rid: 'p' + Date.now() + name }); }
    for (const p of pending.values()) rawSend(p.o);
  };
  pipe.onOpen(() => { open = true; resync(); connFns.forEach(f => f(true)); });
  pipe.onClose(() => { open = false; connFns.forEach(f => f(false)); });
  const timers = [
    setInterval(() => { if (!open) return; const now = Date.now(); for (const p of pending.values()) if (now - p.t > 4500) { p.t = now; rawSend(p.o); } }, 1500),
    setInterval(() => { if (!open || !subs.size) return; const m = {}; for (const [sid, s] of subs) m[sid] = s.seq; rawSend({ op: 'check', subs: m }); }, 8000),
  ];

  const meta = { fromCache: false, hasPendingWrites: false };
  const mkDoc = d => Object.freeze({ id: d.id, exists: d.exists, data: () => d.data, metadata: meta });
  const segs = p => p.split('/').length;
  const clone = v => JSON.parse(JSON.stringify(v));
  function docRef(path) {
    if (segs(path) % 2) throw new TypeError('document path needs even segments: ' + path);
    return {
      id: path.split('/').pop(), path,
      get: () => call({ op: 'get', path }).then(mkDoc),
      set: data => call({ op: 'set', path, data: clone(data) }),
      update: data => call({ op: 'update', path, data: clone(data) }),
      delete: () => call({ op: 'delete', path }),
      onSnapshot(next) { const sid = 's' + (++sidN); subs.set(sid, { kind: 'doc', path, seq: 0, deliver: p => next(mkDoc(p)) }); if (open) rawSend({ op: 'sub', sid, kind: 'doc', path }); return () => { subs.delete(sid); open && rawSend({ op: 'unsub', sid }); }; },
      collection: sub => colRef(path + '/' + sub),
    };
  }
  function query(path, q) {
    return {
      where: (f, op, v) => query(path, { ...q, where: [...(q.where || []), [f, op, v]] }),
      orderBy: (f, dir = 'asc') => query(path, { ...q, orderBy: [f, dir] }),
      limit: n => query(path, { ...q, limit: n }),
      get: () => call({ op: 'query', q: { ...q, path } }).then(list => qsnap(list, [])),
      onSnapshot(next) {
        const sid = 's' + (++sidN); let prev = [];
        const s = { kind: 'query', path, q: { ...q, path }, seq: 0, deliver: list => { const snap = qsnap(list, prev); prev = list; next(snap); } };
        subs.set(sid, s);
        if (open) rawSend({ op: 'sub', sid, kind: 'query', path, q: s.q });
        return () => { subs.delete(sid); open && rawSend({ op: 'unsub', sid }); };
      },
    };
  }
  function qsnap(list, prev) {
    const docs = list.map(d => mkDoc({ id: d.id, exists: true, data: d.data }));
    const pids = new Map(prev.map(d => [d.id, JSON.stringify(d.data)]));
    const changes = list.filter(d => !pids.has(d.id) || pids.get(d.id) !== JSON.stringify(d.data)).map(d => ({ type: pids.has(d.id) ? 'modified' : 'added', doc: mkDoc({ id: d.id, exists: true, data: d.data }) }));
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => changes, metadata: meta };
  }
  function colRef(path) {
    if (segs(path) % 2 === 0) throw new TypeError('collection path needs odd segments: ' + path);
    const q = query(path, {});
    const rnd = () => Math.random().toString(36).slice(2, 12);
    return Object.assign(q, { path, doc: id => docRef(path + '/' + (id || rnd())), add: async data => { const r = docRef(path + '/' + rnd()); await r.set(data); return r; } });
  }
  const db = { doc: docRef, collection: colRef };
  const user = { id: async () => uid, isOwner: async () => owner, canEdit: async () => owner, can: async () => true, me: async () => ({ id: uid }), profiles: async l => Object.fromEntries(l.map(i => [i, { name: '' }])) };
  function namedRoom(name) {
    let peers = [], hs = new Set(), ms = new Map();
    const r = {
      name, _pres: null,
      _peers: p => { peers = p.map(x => ({ ...x, isMe: x.by === uid, sameTab: x.by === uid })); hs.forEach(f => f({ peers, joined: [], left: [], updated: [] })); },
      _msg: m => { (ms.get(m.topic) || []).forEach(f => f({ topic: m.topic, data: m.data, by: m.by, peer: m.by, isMe: m.mine, sameTab: m.mine, kind: 'viewer', guest: false })); },
      emit: (topic, data) => call({ op: 'emit', room: name, topic, data }),
      on: (topic, fn) => { if (!ms.has(topic)) ms.set(topic, []); ms.get(topic).push(fn); return () => {}; },
      presence: patch => { r._pres = { ...(r._pres || {}), ...patch }; return call({ op: 'presence', room: name, patch }); },
      peers: () => peers,
      onPeers: fn => { hs.add(fn); setTimeout(() => fn({ peers, joined: peers, left: [], updated: [] }), 0); return () => hs.delete(fn); },
      connected: () => open,
      onConnection: fn => { connFns.add(fn); setTimeout(() => fn(open), 0); return () => connFns.delete(fn); },
      leave: () => { joined.delete(name); return call({ op: 'leave', room: name }); },
    };
    return r;
  }
  const room = Object.assign(namedRoom('lobby'), { join: async name => { if (joined.has(name)) return joined.get(name); const r = namedRoom(name); joined.set(name, r); call({ op: 'join', room: name }).catch(() => {}); return r; } });
  return { db, user, room, close: () => timers.forEach(clearInterval) };
}

// Cano de volta para o próprio Mestre (sem rede, sem criptografia)
export function loopback(host, uid) {
  const msgFns = new Set(), openFns = new Set();
  const pipe = {
    send: o => { queueMicrotask(() => host.handle(uid, o)); return true; },
    onMessage: f => msgFns.add(f), onOpen: f => { openFns.add(f); }, onClose: () => {}, isOpen: () => true,
  };
  host.attach(uid, o => queueMicrotask(() => msgFns.forEach(f => f(o))));
  return pipe;
}
