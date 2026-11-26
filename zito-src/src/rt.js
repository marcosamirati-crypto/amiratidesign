// Camada de runtime: capacidades da plataforma (db, room, user, dictation,
// sample, tts) e o mapa de caminhos do banco. Tudo o que é estado oficial
// mora no banco compartilhado; nada de multiplayer simulado em localStorage.

export const cap = { db: null, room: null, user: null, dictation: null, sample: null, tts: null };
export const me = { id: null, isOwner: false, ready: false };

const use = name => {
  const c = window.claude;
  if (!c || typeof c.use !== 'function') return Promise.resolve(null);
  return Promise.race([
    c.use(name).catch(() => null),
    new Promise(r => setTimeout(() => r(null), 12000)),
  ]);
};

export async function initRuntime() {
  const [db, user, room, dictation, sample, tts] = await Promise.all(
    ['db', 'user', 'room', 'dictation', 'sample', 'tts'].map(use));
  Object.assign(cap, { db, user, room, dictation, sample, tts });
  if (user) {
    try { me.id = await user.id(); } catch { me.id = null; }
    try { me.isOwner = !!(await user.isOwner()); } catch { me.isOwner = false; }
  }
  me.ready = true;
  return cap;
}

// ---------- caminhos ----------
// sessions/{sid}                      público: sessão, mapa conhecido pelo grupo
// sessions/{sid}/roster/{uid}         público: quem está na mesa
// sessions/{sid}/log/{eid}            público: acontecimentos para todos
// pc/{uid}/s/{sid}                    ficha oficial (só o Mestre escreve; só o dono lê)
// pc/{uid}/s/{sid}/inbox/{eid}        acontecimentos individuais
// req/{uid}                           pedido de entrada + rascunho (o jogador escreve)
// req/{uid}/q/{rid}                   ações pedidas pelo jogador
// req/{uid}/layout/{sid}              arrumação da mochila (só organização)
// gm/{sid}                            segredos do Mestre, mapa completo
// gm/{sid}/log/{eid}                  notas só do Mestre
// gm/{sid}/audit/{aid}                histórico de alterações (desfazer)
// gm/codex, gm/bestiario              lore completa e bestiário (só o Mestre lê)
export const P = {
  session: sid => `sessions/${sid}`,
  sessions: () => 'sessions',
  roster: sid => `sessions/${sid}/roster`,
  rosterDoc: (sid, uid) => `sessions/${sid}/roster/${uid}`,
  log: sid => `sessions/${sid}/log`,
  sheet: (uid, sid) => `pc/${uid}/s/${sid}`,
  inbox: (uid, sid) => `pc/${uid}/s/${sid}/inbox`,
  req: uid => `req/${uid}`,
  reqs: () => 'req',
  queue: uid => `req/${uid}/q`,
  layout: (uid, sid) => `req/${uid}/layout/${sid}`,
  gm: sid => `gm/${sid}`,
  gmLog: sid => `gm/${sid}/log`,
  audit: sid => `gm/${sid}/audit`,
  codex: () => 'gm/codex',
  bestiary: () => 'gm/bestiario',
};

export const doc = p => cap.db.doc(p);
export const col = p => cap.db.collection(p);

export async function getDoc(p) {
  const s = await doc(p).get();
  return s.exists ? s.data() : null;
}

// Escrita com uma tentativa extra em falha transitória
export async function write(p, data, mode = 'set') {
  const ref = doc(p);
  try {
    return await ref[mode](data);
  } catch (e) {
    if (e && e.code === 'unavailable') {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
      return ref[mode](data);
    }
    throw e;
  }
}

export const uid8 = () => {
  const a = new Uint8Array(6); crypto.getRandomValues(a);
  return Array.from(a, b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
};
export const newCode = () => {
  const al = 'ACDEFHJKLMNPQRTUVWXY3479';
  const a = new Uint8Array(4); crypto.getRandomValues(a);
  return Array.from(a, b => al[b % al.length]).join('');
};
export const now = () => Date.now();

// Sala em tempo real por sessão (presença e momentos efêmeros)
let named = null;
export async function joinRoom(code) {
  if (!cap.room) return null;
  try {
    if (named) { try { await named.leave(); } catch {} }
    named = await cap.room.join('mesa-' + code.toLowerCase());
    return named;
  } catch { named = null; return null; }
}
export const roomNow = () => named;

// Assina um listener com tempo limite de carregamento
export function watch(ref, onData, { onSlow, onError } = {}) {
  let t = setTimeout(() => onSlow && onSlow(), 10000);
  const un = ref.onSnapshot(s => {
    if (!s.metadata || !s.metadata.fromCache) { clearTimeout(t); t = null; }
    onData(s);
  }, e => { clearTimeout(t); onError && onError(e); });
  return () => { clearTimeout(t); un(); };
}
