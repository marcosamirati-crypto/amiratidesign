// Runtime do site aberto (marcosamirati.com/zito): ninguém precisa de conta.
// O aparelho do Mestre hospeda a mesa; os jogadores se ligam a ele pelo
// Supabase Realtime do portfólio, com criptografia ponta a ponta.
import { cap, me } from '../rt.js';
import { deviceKeys, importKeys } from './crypto.js';
import { Host } from './host.js';
import { makeClient, loopback } from './client.js';
import { hostLink, guestLink, initSupabase } from './link.js';
import { webDictation, webTTS } from './speech.js';
import { apiAI } from '../ai.js';

const qs = new URLSearchParams(location.search);
export const site = { profile: (qs.get('perfil') || '').replace(/[^a-z0-9-]/gi, '').slice(0, 20), relay: qs.get('relay') || '', keys: null, host: null, link: null, client: null, cfg: {} };
const K = k => 'sod.' + k + (site.profile ? '.' + site.profile : '');

export async function initSite() {
  site.keys = await deviceKeys(K('keys'));
  me.id = site.keys.uid; me.ready = true;
  try { site.cfg = await (await fetch('/api/zito/config', { cache: 'no-store' })).json(); } catch { site.cfg = {}; }
  if (!site.relay) initSupabase(site.cfg.url, site.cfg.anon);
  cap.dictation = webDictation(); cap.tts = webTTS(); cap.ai = site.cfg.ai ? apiAI() : null;
  return site.cfg;
}
export const siteReady = () => !!(site.relay || (site.cfg && site.cfg.url));

function closeLink() { if (site.link) { site.link.close(); site.link = null; } if (site.client && site.client.close) site.client.close(); }

export function becomeMaster() {
  if (!site.host) site.host = new Host({ ownerUid: site.keys.uid, storageKey: K('host') });
  closeLink();
  const c = makeClient(loopback(site.host, site.keys.uid), { uid: site.keys.uid, owner: true });
  site.client = c; cap.db = c.db; cap.room = c.room; cap.user = c.user; me.isOwner = true;
  try { localStorage.setItem(K('role'), 'mestre'); } catch {}
}

export function hostSession(code) {
  if (site.link && site.link.code === code) return site.link;
  if (site.link) { site.link.close(); site.link = null; }
  const h = site.host;
  site.hostState = null;
  const l = hostLink({ code, keys: site.keys, relay: site.relay, onMessage: (from, obj) => { h.attach(from, o => l.send(from, o)); h.handle(from, obj); }, onPeerGone: uid => h.detach(uid),
    onStatus: st => { site.hostState = st; linkFns.forEach(f => { try { f(st); } catch {} }); } });
  l.code = code; site.link = l;
  return l;
}
// o Mestre acompanha se o aparelho dele está alcançável pelos jogadores
const linkFns = new Set();
export const onLinkState = fn => { linkFns.add(fn); if (site.hostState) fn(site.hostState); return () => linkFns.delete(fn); };
export const linkState = () => site.hostState || null;

const WHY = {
  config: 'O site está sem a configuração de conexão. Avise o Amirati.',
  recusado: 'O serviço de conexão recusou a entrada na sala.',
  tempo: 'O serviço de conexão não respondeu a tempo. Verifique a internet e tente de novo.',
  caiu: 'A conexão com o serviço caiu. Tente de novo.',
  rede: 'Não consegui alcançar o serviço de conexão por esta rede. Tente outra rede (4G, por exemplo).',
  outro: 'Uma mesa com esse código respondeu, mas não é a do seu convite. Peça o link de novo ao Mestre.',
  mestre: 'Entrei na sala, mas o celular do Mestre não respondeu. A página da mesa precisa estar aberta na tela dele.',
};
export const connectProblem = () => site.lastFail || null;

export function connectGuest(code, fp) {
  closeLink();
  site.lastFail = null;
  if (!siteReady()) { site.lastFail = { text: WHY.config, detail: '' }; return Promise.resolve(false); }
  const l = guestLink({ code, keys: site.keys, relay: site.relay, expectFp: fp || null });
  l.code = code; site.link = l;
  const c = makeClient(l, { uid: site.keys.uid, owner: false });
  site.client = c; cap.db = c.db; cap.room = c.room; cap.user = c.user; me.isOwner = false;
  return new Promise(res => {
    if (l.isOpen()) return res(true);
    const t = setTimeout(() => { const w = l.why(); site.lastFail = { text: WHY[w.k], detail: w.detail }; res(false); }, 10000);
    l.onOpen(() => { clearTimeout(t); res(true); });
  });
}

export const inviteLink = code => `${location.origin}${location.pathname}#${code}.${site.keys.uid.slice(0, 8)}`;
export const lastRole = () => { try { return localStorage.getItem(K('role')); } catch { return null; } };
export const forgetRole = () => { try { localStorage.removeItem(K('role')); } catch {} };

export function exportSession(sid) {
  return { formato: 'survival-or-dice/backup', versao: 1, criadoEm: new Date().toISOString(), chaveDoMestre: JSON.parse(localStorage.getItem(K('keys')) || 'null'), dados: site.host.exportSession(sid) };
}
export async function importBackup(obj) {
  if (!obj || obj.formato !== 'survival-or-dice/backup') throw new Error('Arquivo não é um backup do Survival or Dice.');
  site.host.importEntries(obj.dados);
  if (obj.chaveDoMestre && obj.chaveDoMestre.pub !== site.keys.pub) {
    // o aparelho novo assume a identidade do Mestre, para os convites antigos continuarem valendo
    site.keys = await importKeys(obj.chaveDoMestre, K('keys'));
    me.id = site.keys.uid;
    return { reload: true };
  }
  return { reload: false };
}
export const storageProblem = () => site.host && site.host.persistError;
