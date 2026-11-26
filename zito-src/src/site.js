// Entrada do site aberto. Qualquer pessoa entra numa mesa pelo código; quem
// toca em "Sou o Mestre" passa a hospedar as próprias mesas neste aparelho.
import { h, clear } from './ui.js';
import { cap } from './rt.js';
import { platform } from './platform.js';
import { initSite, siteReady, becomeMaster, hostSession, connectGuest, inviteLink, lastRole, forgetRole, exportSession, importBackup, storageProblem, site } from './site/runtime.js';
import { startPlayer } from './player.js';
import { startMaster } from './master.js';

const host = document.getElementById('app');
function parseHash() {
  const raw = (location.hash || '').replace(/^#/, '');
  let m = /^mesa-([A-Za-z0-9]{4})$/.exec(raw);
  if (m) return { code: m[1].toUpperCase(), fp: null };
  m = /^([A-Za-z0-9]{4})(?:\.([a-z0-9]{8}))?$/.exec(raw);
  return m ? { code: m[1].toUpperCase(), fp: m[2] || null } : { code: '', fp: null };
}
function splash(text) {
  clear(host);
  host.appendChild(h('main', { class: 'splash' }, h('p', { class: 'kicker' }, 'O RPG do Zito'), h('h1', { class: 'title-xl' }, 'Survival', h('br'), h('span', { class: 'or' }, 'or'), ' Dice'), h('p', { class: 'muted' }, text)));
}

Object.assign(platform, {
  site: true,
  hostSession,
  inviteLink,
  connect: connectGuest,
  toMaster: () => { becomeMaster(); history.replaceState(null, '', location.pathname + location.search); startMaster(host); },
  toPlayer: () => { forgetRole(); startPlayer(host, {}); },
  exportSession,
  importBackup,
  testLink: code => `${location.origin}${location.pathname}?perfil=teste${Date.now().toString(36).slice(-3)}${site.relay ? '&relay=' + encodeURIComponent(site.relay) : ''}#${code}.${site.keys.uid.slice(0, 8)}`,
  storageWarning: storageProblem,
  async seedCodex() {
    const r = await fetch('/api/zito/codex', { cache: 'no-store' });
    if (!r.ok) throw new Error('codex');
    const j = await r.json();
    await cap.db.doc('gm/codex').set({ bible: j.bible, notes: [], version: j.version || '1.0', updatedAt: Date.now() });
    await cap.db.doc('gm/bestiario').set(j.bestiario);
  },
});

if (site.relay) window.__sod = { cap, site }; // gancho de teste, só com retransmissor local

async function boot() {
  splash('Abrindo a mesa…');
  await initSite();
  if (!siteReady()) { splash('O servidor da mesa não respondeu. Tente de novo em instantes.'); return; }
  const { code, fp } = parseHash();
  if (code) startPlayer(host, { code, fp });
  else if (lastRole() === 'mestre') platform.toMaster();
  else startPlayer(host, {});
  window.addEventListener('hashchange', () => { const p = parseHash(); if (p.code && !platform.inGame) startPlayer(host, p); });
}
boot();
