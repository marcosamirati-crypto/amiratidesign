// Ponto de entrada. Decide o papel pela permissão da plataforma, nunca por
// código de sala: o dono da página é o Mestre.
import { h, clear } from './ui.js';
import { initRuntime, cap, me } from './rt.js';
import { startPlayer } from './player.js';
import { startMaster } from './master.js';

const host = document.getElementById('app');
const codeFromHash = () => { const m = /^#mesa-([A-Za-z0-9]{4})$/.exec(location.hash || ''); return m ? m[1].toUpperCase() : ''; };

function splash(text) {
  clear(host);
  host.appendChild(h('main', { class: 'splash' }, h('p', { class: 'kicker' }, 'O RPG do Zito'), h('h1', { class: 'title-xl' }, 'Survival', h('br'), h('span', { class: 'or' }, 'or'), ' Dice'), h('p', { class: 'muted' }, text)));
}

async function boot() {
  splash('Abrindo a mesa…');
  await initRuntime();
  if (!cap.db) {
    splash('Esta mesa precisa do banco compartilhado do Claude. Abra a página pelo link do Claude, com sua conta conectada. Se você é jogador, peça ao Mestre para compartilhar a página com você.');
    return;
  }
  if (!me.id) {
    splash('Não consegui identificar sua conta nesta página. Entre no Claude e abra o link de novo.');
    return;
  }
  if (me.isOwner) startMaster(host);
  else startPlayer(host, { code: codeFromHash() });
}

window.addEventListener('error', e => { console.error(e.error || e.message); });
boot();
