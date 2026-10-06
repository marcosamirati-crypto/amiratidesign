import * as THREE from 'three';
import { CENA, MODOS, OBRA, OCULOS_PADRAO, ORDEM_MODOS, TEMPO } from './config.js';
import { Obra, Captura } from './obra.js';
import { Mundo } from './mundo.js';
import { Cabeca } from './cabeca.js';
import { Estereo } from './estereo.js';
import { Hud } from './hud.js';

THREE.ColorManagement.enabled = false; // tudo é tratado "como está", sem conversão de cor

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const lerPref = (k, d) => { try { const v = localStorage.getItem('osipova.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const gravarPref = (k, v) => { try { localStorage.setItem('osipova.' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// espera uma promessa, mas desiste depois de um tempo (alguns navegadores nunca respondem)
const comLimite = (p, ms = 1200) => Promise.race([Promise.resolve(p).catch(() => {}), espera(ms)]);

const params = new URLSearchParams(location.search);
const S = {
  fase: 'splash',        // splash | prerolagem | tocando | fim
  modo: ORDEM_MODOS.includes(params.get('modo')) ? params.get('modo') : lerPref('modo', 'orbita'),
  vr: false,
  pronto: false,
  escala: 1,
};
if (!ORDEM_MODOS.includes(S.modo)) S.modo = 'orbita';

document.title = OBRA.titulo;
$('#creditos').textContent = OBRA.creditos;

// ── renderizador ───────────────────────────────────────────────────
const canvas = $('#tela');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('#aviso').textContent = 'Este navegador não conseguiu abrir o 3D (WebGL). Tente o Chrome ou o Safari atualizados.';
  throw e;
}
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setClearColor(0x000000, 1);

const cam = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
cam.position.set(0, CENA.olho, 0);

const obra = new Obra(OBRA.video);
const cabeca = new Cabeca(canvas);
let captura, mundo, hud, estereo;

// ── ajustes do óculos ──────────────────────────────────────────────
const ajustes = { ...OCULOS_PADRAO, ...lerPref('oculos', {}) };
function aplicarAjustes() {
  estereo?.ajustar(ajustes);
  $('#aj-dist').value = ajustes.distorcao;
  $('#aj-sep').value = ajustes.separacao;
  $('#aj-zoom').value = ajustes.zoom;
}
for (const [id, chave] of [['#aj-dist', 'distorcao'], ['#aj-sep', 'separacao'], ['#aj-zoom', 'zoom']]) {
  $(id).addEventListener('input', (e) => { ajustes[chave] = Number(e.target.value); gravarPref('oculos', ajustes); estereo?.ajustar(ajustes); });
}
$('#aj-zerar').addEventListener('click', () => { Object.assign(ajustes, OCULOS_PADRAO); gravarPref('oculos', ajustes); aplicarAjustes(); });
aplicarAjustes();

// ── tamanho da tela ────────────────────────────────────────────────
function redimensionar() {
  const w = window.innerWidth, h = window.innerHeight;
  const teto = S.vr ? 2.2 : 2;
  renderer.setPixelRatio(Math.max(0.6, Math.min(window.devicePixelRatio || 1, teto) * S.escala));
  renderer.setSize(w, h, false);
  const bw = renderer.domElement.width, bh = renderer.domElement.height;
  estereo?.redimensionar(bw, bh);
  cam.aspect = w / h;
  cam.fov = h > w ? 84 : 66;
  cam.updateProjectionMatrix();
  mundo?.setPixelScale(bh / 720);
  verGirar();
}
window.addEventListener('resize', redimensionar);
window.addEventListener('orientationchange', () => setTimeout(redimensionar, 250));

function verGirar() {
  const retrato = window.innerHeight > window.innerWidth;
  $('#girar').hidden = !(S.vr && S.fase !== 'splash' && retrato);
}

// ── modos ──────────────────────────────────────────────────────────
function marcarModo() {
  for (const b of $$('.modo')) b.setAttribute('aria-checked', String(b.dataset.modo === S.modo));
  $('#nome-modo').textContent = MODOS[S.modo].nome;
}
function definirModo(m) { S.modo = m; gravarPref('modo', m); marcarModo(); }
function trocarModo() { definirModo(ORDEM_MODOS[(ORDEM_MODOS.indexOf(S.modo) + 1) % ORDEM_MODOS.length]); }
for (const b of $$('.modo')) b.addEventListener('click', () => definirModo(b.dataset.modo));
marcarModo();

// ── tela cheia / sensores ──────────────────────────────────────────
function pedirTelaCheia() {
  const el = document.documentElement;
  try {
    const p = el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.();
    return Promise.resolve(p).catch(() => {});
  } catch { return Promise.resolve(); }
}
async function travarPaisagem() { try { await screen.orientation.lock('landscape'); } catch { /* não é suportado */ } }
function alternarTelaCheia() {
  if (document.fullscreenElement) document.exitFullscreen?.(); else pedirTelaCheia();
}
let wake = null;
async function manterAcordado() { try { wake = await navigator.wakeLock?.request('screen'); } catch { /* ok */ } }

// ── controles ──────────────────────────────────────────────────────
function tocando() { return obra.tocando; }
function alternarPausa() {
  if (S.fase === 'fim') return rever();
  if (S.fase !== 'tocando') return;
  if (tocando()) obra.pausar(); else obra.tocar().catch(() => {});
}
function pular() {
  captura.zerar();
  obra.ir(TEMPO.danca_in - 0.5);
  if (S.fase === 'tocando' && !tocando()) obra.tocar().catch(() => {});
}
function rever() {
  captura.zerar();
  obra.ir(0);
  S.fase = 'tocando';
  $('#fim').hidden = true;
  hud?.mensagem(null);
  obra.tocar().catch(() => {});
}
async function sair() {
  obra.pausar();
  S.fase = 'splash';
  S.vr = false;
  document.body.classList.remove('vr');
  hud?.mensagem(null);
  $('#fim').hidden = true;
  $('#controles').hidden = true;
  $('#splash').classList.remove('some');
  try { screen.orientation.unlock(); } catch { /* ok */ }
  if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* ok */ } }
  obra.ir(0);
  captura.zerar();
  redimensionar();
}
function acao(id) {
  switch (id) {
    case 'pausa': alternarPausa(); break;
    case 'centro': cabeca.recentrar(); break;
    case 'modo': trocarModo(); break;
    case 'pular': if (S.fase === 'fim') rever(); else pular(); break;
    case 'rever': rever(); break;
    case 'tela': alternarTelaCheia(); break;
    case 'sair': sair(); break;
  }
}
for (const b of $$('#controles button, #fim button')) b.addEventListener('click', () => acao(b.dataset.acao));

// toque simples na tela: mostra/esconde os controles (celular) ou pausa (óculos)
let ocultaEm = 0;
function mostrarControles() {
  $('#controles').classList.remove('escondido');
  ocultaEm = performance.now() + 3500;
}
let toque = null;
canvas.addEventListener('pointerdown', (e) => { toque = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  if (!toque) return;
  const perto = Math.hypot(e.clientX - toque.x, e.clientY - toque.y) < 10;
  const curto = performance.now() - toque.t < 500;
  toque = null;
  if (!perto || !curto || S.fase === 'splash') return;
  if (S.vr) { if (S.fase === 'tocando' || S.fase === 'fim') alternarPausa(); } else mostrarControles();
});
window.addEventListener('keydown', (e) => {
  if (S.fase === 'splash') return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'enter' || k === 'mediaplaypause') { e.preventDefault(); alternarPausa(); }
  else if (k === 'r') cabeca.recentrar();
  else if (k === 'm') trocarModo();
  else if (k === 's') pular();
  else if (k === 'f') alternarTelaCheia();
  else if (k === 'escape') { /* o navegador sai da tela cheia sozinho */ }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && obra.video && tocando()) obra.pausar();
  else if (!document.hidden && S.fase === 'tocando' && !S.vr) { mostrarControles(); $('#controles').classList.remove('escondido'); }
});

// ── entrar ─────────────────────────────────────────────────────────
async function entrar(vr) {
  if (!S.pronto || S.fase !== 'splash') return;
  // estes três precisam ser chamados já no toque, antes de qualquer espera
  const permissao = Cabeca.pedirPermissao();
  const cheia = pedirTelaCheia();
  const destravar = obra.destravar();   // libera o áudio do vídeo (o iPhone exige isso no toque)

  S.vr = vr;
  document.body.classList.toggle('vr', vr);
  const ok = await comLimite(permissao, 4000);
  cabeca.iniciar();
  if (ok === false) $('#aviso').textContent = 'Sem acesso ao movimento do celular: arraste o dedo na tela para olhar ao redor.';
  await comLimite(cheia);
  if (vr) await comLimite(travarPaisagem());
  await comLimite(destravar, 2500);
  manterAcordado();

  $('#splash').classList.add('some');
  obra.ir(0);
  captura.zerar();
  redimensionar();

  if (vr) {
    await prerolagem();
  } else {
    cabeca.recentrar();
    S.fase = 'tocando';
    try { await obra.tocar(); } catch (e) { console.warn(e); }
    $('#controles').hidden = false;
    mostrarControles();
  }
}

async function prerolagem() {
  S.fase = 'prerolagem';
  verGirar();
  for (let n = 6; n > 0; n--) {
    hud.mensagem([
      { t: 'COLOQUE O CELULAR NO ÓCULOS', s: 58, w: 600 },
      { t: 'Olhe para a frente e fique parado', s: 44, w: 300, a: 0.8 },
      { t: String(n), s: 190, w: 200, c: '#bcd4ff' },
    ], true);
    await espera(1000);
    if (S.fase !== 'prerolagem') return;
  }
  hud.mensagem(null);
  cabeca.recentrar();
  S.fase = 'tocando';
  try { await obra.tocar(); } catch (e) { console.warn(e); }
  hud.mostrarDica(12, performance.now() / 1000);
}

function aoTerminar() {
  S.fase = 'fim';
  if (S.vr) {
    hud.mensagem([{ t: 'FIM', s: 150, w: 200 }]);
    hud.mostrarDica(60, performance.now() / 1000);
  } else {
    $('#fim').hidden = false;
    $('#controles').classList.remove('escondido');
  }
}

// ── laço principal ─────────────────────────────────────────────────
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
let ultimoMs = performance.now();
let ultimoT = 0;
let somaDt = 0, nQuadros = 0, ajustesDeQualidade = 0;

function tick(agoraMs) {
  const dt = Math.min(0.1, (agoraMs - ultimoMs) / 1000);
  ultimoMs = agoraMs;
  const agora = agoraMs / 1000;
  if (!mundo) return;

  // vídeo → buffer de quadros
  obra.sondar();
  const t = obra.tempo;
  if (t < ultimoT - 0.3) captura.zerar();
  ultimoT = t;
  if (obra.novoQuadro) {
    obra.novoQuadro = false;
    if (t >= TEMPO.danca_in - 0.08 && t <= TEMPO.cartao_in) captura.empurrar();
  }
  mundo.atualizar(t, S.modo, agora);

  // para onde você está olhando
  let q;
  if (S.fase === 'splash') {
    _e.set(0.03, Math.sin(agora * 0.12) * 0.28, 0, 'YXZ');
    q = _q.setFromEuler(_e);
  } else q = cabeca.atualizar();

  // menu 3D e mensagens (só no modo óculos)
  hud.grupo.visible = S.vr && S.fase !== 'splash';
  if (hud.grupo.visible) {
    hud.atualizar(q, cam.position, dt, agora, {
      pausado: !tocando(),
      nomeModo: MODOS[S.modo].nome,
      fase: S.fase,
      menuLiberado: S.fase === 'tocando' || S.fase === 'fim',
    });
  }

  if (S.vr && S.fase !== 'splash') estereo.desenhar(mundo.scene, q, cam.position);
  else { cam.quaternion.copy(q); renderer.render(mundo.scene, cam); }

  // controles do celular somem sozinhos
  if (!S.vr && S.fase === 'tocando' && performance.now() > ocultaEm) $('#controles').classList.add('escondido');
  $('#controles').classList.toggle('pausado', !tocando());

  // qualidade adaptativa: se estiver pesado, diminui um pouco a resolução
  if (S.fase !== 'splash' && tocando()) {
    somaDt += dt; nQuadros++;
    if (nQuadros >= 90) {
      if (somaDt / nQuadros > 1 / 40 && ajustesDeQualidade < 4 && S.escala > 0.55) {
        S.escala *= 0.85; ajustesDeQualidade++; redimensionar();
      }
      somaDt = 0; nQuadros = 0;
    }
  }
}

// ── começo: carrega a obra ─────────────────────────────────────────
const btnPov = $('#btn-pov'), btnVr = $('#btn-vr');
(async () => {
  try {
    await obra.carregar((p) => {
      const pct = p < 0 ? null : Math.round(p * 100);
      $('.rot', btnPov).textContent = pct == null ? 'Carregando…' : `Carregando… ${pct}%`;
      $('.progresso', btnPov).style.width = (pct ?? 40) + '%';
    });
  } catch (e) {
    console.error(e);
    $('#aviso').textContent = 'Não consegui carregar o vídeo. Verifique a internet e recarregue a página.';
    return;
  }
  await document.fonts.ready;
  captura = new Captura(renderer, obra.textura);
  mundo = new Mundo(obra.textura, captura);
  estereo = new Estereo(renderer);
  hud = new Hud(mundo.scene, (id) => acao(id));
  hud.recarregarFonte();
  aplicarAjustes();
  redimensionar();
  obra.video.addEventListener('ended', aoTerminar);

  S.pronto = true;
  $('.rot', btnPov).textContent = 'Ver no celular';
  btnPov.classList.add('pronto');
  btnPov.disabled = false;
  btnVr.disabled = false;
  btnPov.addEventListener('click', () => entrar(false));
  btnVr.addEventListener('click', () => entrar(true));
  renderer.setAnimationLoop(tick);
  if (params.get('auto') === 'pov') entrar(false);
})();

// para testes e ajustes
window.__osipova = { S, obra, cabeca, acao, definirModo, get mundo() { return mundo; }, get captura() { return captura; }, get hud() { return hud; }, get estereo() { return estereo; }, entrar, redimensionar };
