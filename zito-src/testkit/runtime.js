// Runtime de TESTE: implementa window.claude.use() com o mesmo contrato das
// capacidades da plataforma, falando com o servidor de teste por WebSocket.
// Reconecta sozinho e refaz as assinaturas, como a plataforma faz.
(function () {
  const as = new URLSearchParams(location.search).get('as') || 'viewer';
  const ids = { master: 'u-master', p1: 'u-p1', p2: 'u-p2', p3: 'u-p3', viewer: 'u-viewer' };
  let ws, open = false, rid = 0, sidN = 0;
  const pending = new Map(), subs = new Map(), queue = [], roomHandlers = new Map(), connHandlers = new Set();
  const joined = new Map();
  function connect() {
    ws = new WebSocket(`ws://${location.host}/?as=${as}`);
    ws.onopen = () => {
      open = true; connHandlers.forEach(f => f(true));
      for (const [sid, s] of subs) ws.send(JSON.stringify({ op: 'sub', sid, kind: s.kind, path: s.path, q: s.q }));
      for (const [name, r] of joined) { ws.send(JSON.stringify({ op: 'join', room: name, rid: ++rid })); if (r._pres) ws.send(JSON.stringify({ op: 'presence', room: name, patch: r._pres, rid: ++rid })); }
      while (queue.length) ws.send(queue.shift());
    };
    ws.onclose = () => { open = false; connHandlers.forEach(f => f(false)); setTimeout(connect, 600); };
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data);
      if (m.t === 'res') { const p = pending.get(m.rid); if (p) { pending.delete(m.rid); m.ok ? p.res(m.data) : p.rej(m.data); } }
      else if (m.t === 'snap') { const s = subs.get(m.sid); if (s) s.deliver(m.payload); }
      else if (m.t === 'peers') { const r = joined.get(m.room); if (r) r._peers(m.peers); }
      else if (m.t === 'msg') { const r = joined.get(m.room); if (r) r._msg(m); }
    };
  }
  const call = (o) => new Promise((res, rej) => { o.rid = ++rid; pending.set(o.rid, { res, rej }); const s = JSON.stringify(o); open ? ws.send(s) : queue.push(s); });
  connect();
  const meta = { fromCache: false, hasPendingWrites: false };
  const mkDoc = d => Object.freeze({ id: d.id, exists: d.exists, data: () => d.data, metadata: meta });
  const segs = p => p.split('/').length;
  function docRef(path) {
    if (segs(path) % 2) throw new TypeError('document path needs even segments: ' + path);
    return {
      id: path.split('/').pop(), path,
      get: () => call({ op: 'get', path }).then(mkDoc),
      set: data => call({ op: 'set', path, data: JSON.parse(JSON.stringify(data)) }),
      update: data => call({ op: 'update', path, data: JSON.parse(JSON.stringify(data)) }),
      delete: () => call({ op: 'delete', path }),
      onSnapshot(next, err) { const sid = 's' + (++sidN); subs.set(sid, { kind: 'doc', path, deliver: p => next(mkDoc(p)) }); if (open) ws.send(JSON.stringify({ op: 'sub', sid, kind: 'doc', path })); return () => { subs.delete(sid); open && ws.send(JSON.stringify({ op: 'unsub', sid })); }; },
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
        subs.set(sid, { kind: 'query', path, q: { ...q, path }, deliver: list => { const s = qsnap(list, prev); prev = list; next(s); } });
        if (open) ws.send(JSON.stringify({ op: 'sub', sid, kind: 'query', path, q: { ...q, path } }));
        return () => { subs.delete(sid); open && ws.send(JSON.stringify({ op: 'unsub', sid })); };
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
    return Object.assign(q, { path, doc: id => docRef(path + '/' + (id || Math.random().toString(36).slice(2, 12))), add: async data => { const r = docRef(path + '/' + Math.random().toString(36).slice(2, 12)); await r.set(data); return r; } });
  }
  const db = { doc: docRef, collection: colRef };
  const user = { id: async () => ids[as], isOwner: async () => as === 'master', canEdit: async () => as === 'master', can: async () => as !== 'viewer', me: async () => ({ id: ids[as], name: as }), profiles: async l => Object.fromEntries(l.map(i => [i, { name: i }])) };
  function namedRoom(name) {
    let peers = [], hs = new Set(), ms = new Map();
    const r = {
      name, _pres: null,
      _peers: p => { peers = p.map(x => ({ ...x, isMe: x.by === ids[as], sameTab: false })); hs.forEach(f => f({ peers, joined: [], left: [], updated: [] })); },
      _msg: m => { (ms.get(m.topic) || []).forEach(f => f({ topic: m.topic, data: m.data, by: m.by, peer: m.peer, isMe: m.mine, sameTab: m.mine, kind: 'viewer', guest: false })); },
      emit: (topic, data) => call({ op: 'emit', room: name, topic, data }),
      on: (topic, fn) => { if (!ms.has(topic)) ms.set(topic, []); ms.get(topic).push(fn); return () => {}; },
      presence: patch => { r._pres = { ...(r._pres || {}), ...patch }; return call({ op: 'presence', room: name, patch }); },
      peers: () => peers,
      onPeers: fn => { hs.add(fn); setTimeout(() => fn({ peers, joined: peers, left: [], updated: [] }), 0); return () => hs.delete(fn); },
      connected: () => open,
      onConnection: fn => { connHandlers.add(fn); setTimeout(() => fn(open), 0); return () => connHandlers.delete(fn); },
      leave: () => { joined.delete(name); return call({ op: 'leave', room: name }); },
    };
    return r;
  }
  const room = Object.assign(namedRoom('lobby'), { join: async name => { if (joined.has(name)) return joined.get(name); const r = namedRoom(name); joined.set(name, r); await call({ op: 'join', room: name }); return r; } });
  const caps = { db, user, room, dictation: null, sample: null, tts: null };
  window.claude = { use: async name => caps[name] ?? null };
  window.__testkit = { as, kick: () => ws.close() };
})();
