// Experiência do jogador: entrada imersiva, criação de personagem, HUD de
// sobrevivência, ficha, mochila, mapa e diário. O jogador nunca escreve o
// estado oficial: ele envia pedidos (req/...) que o Mestre aplica.
import { h, put, icon, clear, toast, sheet, seg, stepper, field, tag, cells, empty, norm, fmtTime, fmtDay, deferWhileTyping } from './ui.js';
import { cap, me, P, doc, col, write, getDoc, watch, joinRoom, roomNow, now, uid8 } from './rt.js';
import { ATTRS, ATTR_NAME, BASE_SPREAD, derive, DERIVED, carga, deslocamento, RACE_BASE, reserveFor, daFor, TIERS, xpProgress, XP_TABLE, PERICIA_BONUS, PERICIA_EXAMPLES, minMaxNotes, zeroAttrs, d, INTRO, SIGN, CHAOS } from './lore.js';
import { portraitSVG, defaultPortrait, SKIN, HAIR, HAIR_COLOR, BUILD, MARK, BEARD, CLOTH } from './portrait.js';
import { openRoller, dieEl } from './dice.js';
import { mountMist } from './mist.js';
import { platform } from './platform.js';
import { renderMap, insideZone } from './map.js';

const LS = 'sod.player.';
const lsGet = k => { try { return JSON.parse(localStorage.getItem(LS + k)); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch {} };

let root;
const st = { sid: null, session: null, sheet: null, roster: {}, log: [], inbox: [], layout: null, view: 'hud', unsub: [], unread: 0, peers: [], booted: false, lastVida: null };

export function startPlayer(host, { code, fp } = {}) {
  root = host;
  platform.inGame = false;
  st.fp = fp || null;
  screenEnter(code || '');
}

// ------------------------------------------------------------ entrada
function screenEnter(prefill) {
  clear(root);
  const cvs = h('canvas', { class: 'mist-cvs', 'aria-hidden': 'true' });
  const input = h('input', { id: 'room-code', class: 'code-in', maxlength: 4, autocomplete: 'off', autocapitalize: 'characters', spellcheck: false, placeholder: 'K7QX', value: prefill, 'aria-label': 'Código da sala' });
  const err = h('p', { class: 'err', role: 'alert' });
  const btn = h('button', { class: 'btn primary big', type: 'submit' }, 'Entrar na mesa');
  const last = lsGet('last');
  const form = h('form', { class: 'enter-form', onsubmit: async e => {
    e.preventDefault();
    const code = input.value.trim().toUpperCase();
    if (code.length !== 4) { err.textContent = 'O código tem 4 letras. Ele aparece no celular do Mestre.'; return; }
    btn.disabled = true; btn.textContent = 'Procurando a mesa…'; err.textContent = '';
    try {
      if (platform.connect) {
        const fp = (last && last.code === code && last.fp) || (prefill === code ? st.fp : null);
        const ok = await platform.connect(code, fp);
        if (!ok) { err.textContent = 'Não encontrei essa mesa. Confira o código e se o celular do Mestre está com a página aberta.'; return; }
        st.fp = fp;
      }
      const snap = await col(P.sessions()).where('code', '==', code).limit(1).get();
      if (snap.empty) { err.textContent = 'Nenhuma mesa com esse código. Confira com o Mestre.'; return; }
      const sdoc = snap.docs[0];
      const s = sdoc.data();
      if (s.status === 'encerrada') { err.textContent = 'Essa sessão foi encerrada pelo Mestre.'; return; }
      lsSet('last', { code, sid: sdoc.id, name: s.name, fp: st.fp || null });
      await openSession(sdoc.id, s);
    } catch (ex) {
      err.textContent = 'Não consegui falar com o servidor agora. Tente de novo em instantes.';
    } finally { btn.disabled = false; btn.textContent = 'Entrar na mesa'; }
  } },
    h('label', { class: 'f-label', for: 'room-code' }, 'Código da sala'), input, btn, err);

  const scr = h('main', { class: 'enter' }, cvs,
    h('div', { class: 'enter-inner' },
      h('p', { class: 'kicker' }, 'O RPG do Zito'),
      h('h1', { class: 'title-xl' }, 'Survival', h('br'), h('span', { class: 'or' }, 'or'), ' Dice'),
      h('div', { class: 'intro-lines' }, INTRO.map(t => h('p', null, t)), h('p', { class: 'sign' }, SIGN)),
      form,
      last && last.code !== prefill ? h('button', { class: 'linkish', onclick: () => { input.value = last.code; form.requestSubmit(); } }, `Voltar para ${last.name || 'a última mesa'} (${last.code})`) : null,
      platform.toMaster ? h('button', { class: 'linkish gm-link', onclick: () => { scr._stop && scr._stop(); platform.toMaster(); } }, 'Sou o Mestre: criar ou abrir uma mesa') : null,
    ));
  root.appendChild(scr);
  const stop = mountMist(cvs, { blobs: 14, particles: 30 });
  scr._stop = stop;
  if (prefill && prefill.length === 4) setTimeout(() => form.requestSubmit(), 50);
}

async function openSession(sid, session) {
  st.sid = sid; st.session = session;
  const existing = await getDoc(P.sheet(me.id, sid));
  if (existing) return enterGame();
  const req = await getDoc(P.req(me.id));
  if (req && req.sid === sid && req.draft && req.draft.sent) return screenWaiting();
  screenName();
}

// ------------------------------------------------------------ criação
function draftGet() {
  const d0 = lsGet('draft.' + st.sid) || {};
  return Object.assign({ playerName: '', charName: '', race: 'Humano', tendencia: '', aparencia: '', historia: '', base: {}, attrs: {}, free: {}, sorte: null, sorteRolls: 0, pericias: ['', ''], portrait: defaultPortrait(), step: 0 }, d0);
}
function draftSave(dr) { lsSet('draft.' + st.sid, dr); }

function shell(title, sub, body, { step, total, back } = {}) {
  clear(root);
  const prog = step != null ? h('div', { class: 'prog', role: 'img', 'aria-label': `Passo ${step + 1} de ${total}` }, Array.from({ length: total }, (_, i) => h('i', { class: i <= step ? 'on' : '' }))) : null;
  root.appendChild(h('main', { class: 'flow' },
    h('header', { class: 'flow-head' },
      back ? h('button', { class: 'icon-btn', 'aria-label': 'Voltar', onclick: back }, icon('undo')) : h('span'),
      prog, h('span', { class: 'flow-room' }, st.session ? st.session.name : '')),
    h('h1', { class: 'title-l' }, title), sub ? h('p', { class: 'lead' }, sub) : null, body));
  window.scrollTo(0, 0);
}

function screenName() {
  const dr = draftGet();
  const inp = h('input', { id: 'player-name', class: 'in big', value: dr.playerName, maxlength: 40, autocomplete: 'given-name', placeholder: 'Como a mesa te chama' });
  const go = h('button', { class: 'btn primary big', onclick: () => {
    if (!inp.value.trim()) { inp.focus(); return toast('Escreva seu nome de jogador.'); }
    dr.playerName = inp.value.trim(); draftSave(dr); screenCreate(0);
  } }, 'Criar personagem');
  shell('Quem joga?', 'Seu nome de jogador. O nome do personagem vem depois.', h('div', { class: 'stack' }, field('Nome do jogador', inp), go));
}

const STEPS = ['Identidade', 'Atributos', 'Sorte', 'Perícias', 'Aparência', 'Revisão'];

function screenCreate(i) {
  const dr = draftGet(); dr.step = i; draftSave(dr);
  const nav = (n) => screenCreate(n);
  const next = (ok = true) => h('button', { class: 'btn primary big', onclick: () => { if (ok === true || ok()) nav(i + 1); } }, i === STEPS.length - 2 ? 'Revisar ficha' : 'Continuar');
  const back = () => (i === 0 ? screenName() : nav(i - 1));
  const T = { step: i, total: STEPS.length, back };
  const races = ['Humano', ...((st.session && st.session.races) || [])];

  if (i === 0) {
    const nm = h('input', { id: 'char-name', class: 'in big', value: dr.charName, maxlength: 60, placeholder: 'Nome do personagem' });
    const rc = seg(races.map(r => ({ v: r, label: r })), dr.race, v => { dr.race = v; draftSave(dr); });
    const td = h('input', { id: 'char-tend', class: 'in', value: dr.tendencia, maxlength: 60, placeholder: 'Como combinar com o Mestre' });
    nm.oninput = () => { dr.charName = nm.value; draftSave(dr); };
    td.oninput = () => { dr.tendencia = td.value; draftSave(dr); };
    return shell('Identidade', null, h('div', { class: 'stack' },
      field('Nome do personagem', nm),
      h('div', { class: 'field' }, h('span', { class: 'f-label' }, 'Raça ', tag('canone')), rc,
        h('span', { class: 'f-hint' }, races.length > 1 ? 'Humano está nos documentos. As outras foram liberadas pelo Mestre.' : 'Os documentos de Zito descrevem só a raça Humano para personagens.')),
      h('div', { class: 'field' }, h('span', { class: 'f-label' }, 'Tendência ', tag('lacuna')), td, h('span', { class: 'f-hint' }, 'O campo existe na ficha, mas os valores ainda não foram definidos.')),
      next(() => { if (!dr.charName.trim()) { toast('Dê um nome ao personagem.'); return false; } return true; })), T);
  }

  if (i === 1) return stepAttrs(dr, next, T);

  if (i === 2) {
    const tray = h('div', { class: 'tray big' });
    const out = h('div', { class: 'luck-out' }, dr.sorte ? h('b', { class: 'luck-n' }, String(dr.sorte)) : h('span', { class: 'muted' }, 'Ainda não rolada'));
    const roll = h('button', { class: 'btn primary big', onclick: async () => {
      roll.disabled = true;
      const tens = d(10) - 1, units = d(10) - 1;
      const v = tens * 10 + units || 100;
      clear(tray); put(tray, dieEl('d10', tens, 'rolling'), dieEl('d10', units, 'rolling'));
      await new Promise(r => setTimeout(r, 650));
      clear(tray); put(tray, dieEl('d10', tens, 'landed'), dieEl('d10', units, 'landed'));
      dr.sorte = v; dr.sorteRolls = (dr.sorteRolls || 0) + 1; draftSave(dr);
      // registra a rolagem no pedido para o Mestre ver quantas vezes rolou
      try { await write(P.req(me.id), { sid: st.sid, ts: now(), kind: 'join', draft: { ...dr, sent: false } }); } catch {}
      clear(out); put(out, h('b', { class: 'luck-n' }, String(v)));
      roll.disabled = false; roll.textContent = 'Rolar de novo';
    } }, icon('sorte', 22), dr.sorte ? 'Rolar de novo' : 'Rolar D100');
    return shell('Sorte', 'Um número fixo de 1 a 100, rolado agora com dois D10. Na sessão, um D100 abaixo dele é sorte; acima, azar.', h('div', { class: 'stack' },
      tray, out, roll,
      dr.sorteRolls > 1 ? h('p', { class: 'note' }, `O Mestre vê que você rolou ${dr.sorteRolls} vezes.`) : null,
      next(() => { if (!dr.sorte) { toast('Role a Sorte antes de seguir.'); return false; } return true; })), T);
  }

  if (i === 3) {
    const list = h('div', { class: 'stack' });
    const sug = h('div', { class: 'chips' }, PERICIA_EXAMPLES.map(p => h('button', { type: 'button', class: 'chip', title: p.note, onclick: () => {
      const k = dr.pericias.findIndex(x => !x); if (k < 0) return toast('Você já tem 2 perícias.'); dr.pericias[k] = p.name; draftSave(dr); screenCreate(3);
    } }, p.name)));
    dr.pericias.forEach((p, k) => {
      const inp = h('input', { id: 'per-' + k, class: 'in', value: p, maxlength: 40, placeholder: `Perícia ${k + 1}` });
      inp.oninput = () => { dr.pericias[k] = inp.value.trim(); draftSave(dr); };
      list.appendChild(field(`Perícia ${k + 1} · nível 1 (+${PERICIA_BONUS[1]})`, inp));
    });
    return shell('Perícias', 'Você começa com 2. Cada uma tem níveis 1, 2 e 3 (+5, +10, +15), somados só no teste daquela perícia.', h('div', { class: 'stack' },
      list,
      h('div', { class: 'field' }, h('span', { class: 'f-label' }, 'Exemplos dos documentos ', tag('canone')), sug,
        h('span', { class: 'f-hint' }, 'A lista completa ainda não existe. Escreva o que combinar com o Mestre. Trespassar é limitante: sobe uma vez a cada 5 levels.')),
      h('div', { class: 'card soft' }, h('p', null, h('b', null, 'Habilidades. '), 'Não existem classes. O Mestre entrega sua primeira árvore no level 1, vinda de uma profissão, de uma armadura ou de um contato com o caos: uma habilidade passiva e uma ativa.')),
      next(() => { if (dr.pericias.filter(Boolean).length !== 2) { toast('Escolha as 2 perícias.'); return false; } return true; })), T);
  }

  if (i === 4) return stepLook(dr, next, T);

  if (i === 5) {
    const a = dr.attrs; const der = derive(a);
    const send = h('button', { class: 'btn primary big', onclick: async () => {
      send.disabled = true; send.textContent = 'Enviando…';
      try {
        await write(P.req(me.id), { sid: st.sid, ts: now(), kind: 'join', draft: { ...dr, sent: true } });
        roomNow() && roomNow().emit('ping', { kind: 'join', sid: st.sid }).catch(() => {});
        screenWaiting();
      } catch (e) { send.disabled = false; send.textContent = 'Enviar ao Mestre'; toast(e && e.code === 'invalid_argument' ? 'Sua conta não pode escrever nesta mesa. Peça ao Mestre acesso de Contribuidor ou Editor.' : 'Não foi possível enviar. Tente de novo.'); }
    } }, 'Enviar ao Mestre');
    return shell('Revisão', 'O Mestre recebe a ficha e confirma sua entrada.', h('div', { class: 'stack' },
      h('div', { class: 'review-top' }, h('div', { class: 'pt-l', html: portraitSVG(dr.portrait, { level: 1 }) }),
        h('div', null, h('h2', { class: 'title-m' }, dr.charName), h('p', { class: 'muted' }, `${dr.race} · Level 1 · jogado por ${dr.playerName}`), h('p', null, `Sorte ${dr.sorte}`))),
      attrTable(a),
      h('div', { class: 'grid3' }, statBox('Vida', der.vida), statBox('Sanidade', der.sanidade), statBox('Bem-Estar', der.bemEstar)),
      h('p', null, h('b', null, 'Perícias: '), dr.pericias.filter(Boolean).join(', ')),
      send), T);
  }
}

function stepAttrs(dr, next, T) {
  const keys = ATTRS.map(x => x.k);
  if (!dr.base || Object.keys(dr.base).length !== 7) dr.base = {};
  const used = () => Object.values(dr.base);
  const pool = () => { const left = [...BASE_SPREAD]; for (const v of used()) { const k = left.indexOf(v); if (k >= 0) left.splice(k, 1); } return left; };
  let picked = null;
  dr.free = dr.free || {};
  const spent = () => keys.reduce((n, k) => n + (dr.free[k] || 0), 0);
  const body = h('div', { class: 'stack' });
  const render = () => {
    clear(body);
    for (const k of keys) dr.attrs[k] = (dr.base[k] || 0) + (dr.free[k] || 0);
    draftSave(dr);
    const complete = Object.keys(dr.base).length === 7;
    const chips = h('div', { class: 'chips pool', role: 'group', 'aria-label': 'Valores a posicionar' });
    pool().forEach((v, idx) => chips.appendChild(h('button', { type: 'button', class: 'chip num' + (picked && picked.idx === idx ? ' sel' : ''), onclick: () => { picked = { v, idx }; render(); } }, String(v))));
    put(body, 
      h('p', { class: 'muted' }, complete ? 'Valores travados. Agora distribua os 8 pontos soltos do level 1, sem limite por atributo.' : picked ? `Toque no atributo que recebe ${picked.v}.` : 'Toque num valor e depois no atributo. 9, 7, 5, 5, 5, 5 e 3 são fixos: depois de colocados, não se reorganizam.'),
      complete ? null : chips);
    const list = h('div', { class: 'attr-pick' });
    for (const x of ATTRS) {
      const has = dr.base[x.k] != null;
      const row = h('div', { class: 'ap-row' + (has ? ' set' : '') },
        h('button', { type: 'button', class: 'ap-name', disabled: has && complete, onclick: () => {
          if (complete) return;
          if (has) { delete dr.base[x.k]; dr.free[x.k] = 0; picked = null; draftSave(dr); return render(); }
          if (!picked) return toast('Escolha um valor primeiro.');
          dr.base[x.k] = picked.v; picked = null; draftSave(dr); render();
        } }, h('b', null, x.name), h('small', null, x.covers)),
        h('span', { class: 'ap-base' }, has ? String(dr.base[x.k]) : '–'));
      if (complete) {
        row.appendChild(stepper(dr.free[x.k] || 0, { min: 0, max: (dr.free[x.k] || 0) + (8 - spent()), label: x.name, onChange: v => { dr.free[x.k] = v; draftSave(dr); render(); } }));
        row.appendChild(h('b', { class: 'ap-total' }, String(dr.attrs[x.k])));
      }
      list.appendChild(row);
    }
    body.appendChild(list);
    if (complete && Object.keys(dr.base).length) body.appendChild(h('button', { class: 'linkish', onclick: () => { dr.base = {}; dr.free = {}; draftSave(dr); render(); } }, 'Recomeçar a distribuição'));
    if (complete) {
      const der = derive(dr.attrs);
      put(body, 
        h('p', { class: 'points-left' + (spent() === 8 ? ' done' : '') }, `${8 - spent()} de 8 pontos soltos`),
        h('div', { class: 'grid3' }, statBox('Vida', der.vida, '2 × Res'), statBox('Sanidade', der.sanidade, '2 × FM'), statBox('Bem-Estar', der.bemEstar, 'Res + FM')),
        h('div', { class: 'grid3' }, DERIVED.slice(0, 3).map(x => statBox(x.name, der[x.k], x.f))),
        h('div', { class: 'grid3' }, DERIVED.slice(3).map(x => statBox(x.name, der[x.k], x.f)), statBox('Deslocamento', deslocamento(dr.attrs.agi, RACE_BASE[dr.race] || 5), RACE_BASE[dr.race] ? 'base 5' : 'base a definir')),
        minMaxNotes(dr.attrs).map(t => h('p', { class: 'note warn' }, t, ' As criaturas caçam quem não se equilibra.')));
    }
    body.appendChild(next(() => {
      if (Object.keys(dr.base).length !== 7) { toast('Posicione os 7 valores.'); return false; }
      if (spent() !== 8) { toast(`Faltam ${8 - spent()} pontos.`); return false; }
      return true;
    }));
  };
  render();
  shell('Atributos', null, body, T);
}

function stepLook(dr, next, T) {
  const pv = h('div', { class: 'pt-xl' });
  const paint = () => { pv.innerHTML = portraitSVG(dr.portrait, { level: 1 }); draftSave(dr); };
  const swatches = (key, arr) => h('div', { class: 'swatches', role: 'radiogroup' }, arr.map((c, k) => h('button', { type: 'button', role: 'radio', 'aria-checked': dr.portrait[key] === k, 'aria-label': `Cor ${k + 1}`, style: { background: c }, onclick: e => { dr.portrait[key] = k; e.currentTarget.parentNode.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-checked', j === k)); paint(); } })));
  const opts = (key, arr) => seg(arr.map((t, k) => ({ v: k, label: t })), dr.portrait[key], v => { dr.portrait[key] = v; paint(); });
  const ap = h('textarea', { id: 'char-look', class: 'in', rows: 3, maxlength: 600, placeholder: 'Como as pessoas te reconhecem de longe' }, dr.aparencia);
  const hi = h('textarea', { id: 'char-story', class: 'in', rows: 4, maxlength: 1500, placeholder: 'De onde você vem, o que deixou para trás' }, dr.historia);
  ap.oninput = () => { dr.aparencia = ap.value; draftSave(dr); };
  hi.oninput = () => { dr.historia = hi.value; draftSave(dr); };
  paint();
  shell('Aparência', null, h('div', { class: 'stack' },
    h('div', { class: 'look-grid' }, pv,
      h('div', { class: 'stack tight' },
        h('span', { class: 'f-label' }, 'Retrato de campo ', tag('proposta', 'Miniatura proposta pela plataforma; usa só traços humanos genéricos')),
        h('span', { class: 'f-label' }, 'Pele'), swatches('skin', SKIN),
        h('span', { class: 'f-label' }, 'Cabelo'), opts('hair', HAIR), swatches('hairColor', HAIR_COLOR),
        h('span', { class: 'f-label' }, 'Porte'), opts('build', BUILD),
        h('span', { class: 'f-label' }, 'Barba'), opts('beard', BEARD),
        h('span', { class: 'f-label' }, 'Marca'), opts('mark', MARK),
        h('span', { class: 'f-label' }, 'Roupa'), swatches('cloth', CLOTH))),
    field('Aparência (ficha)', ap), field('História pessoal', hi),
    next()), T);
}

function screenWaiting() {
  shell('A ficha está com o Mestre', 'Assim que ele confirmar, sua jornada começa.', h('div', { class: 'stack center' },
    h('div', { class: 'waiting' }, h('span', { class: 'dot-pulse' }), h('span', null, 'Esperando o Mestre')),
    h('button', { class: 'linkish', onclick: async () => { const r = await getDoc(P.req(me.id)); if (r) await write(P.req(me.id), { ...r, draft: { ...r.draft, sent: false } }); screenCreate(5); } }, 'Corrigir algo na ficha')));
  const un = doc(P.sheet(me.id, st.sid)).onSnapshot(s => { if (s.exists) { un(); screenIntro(s.data()); } }, () => {});
  roomNow() || joinRoom(st.session.code);
}

// ------------------------------------------------------------ introdução personalizada (ETAPA 4)
export function composeIntro(sh, session, placeName) {
  const a = sh.attrs;
  const sorted = ATTRS.slice().sort((x, y) => a[y.k] - a[x.k]);
  const hi = sorted[0], lo = sorted[sorted.length - 1];
  const r = reserveFor(sh.level || 1);
  const resv = TIERS.filter(t => r[t]).map(t => `${r[t]}${t.toUpperCase()}`).join(' e ');
  const p = [];
  p.push(`Você é ${sh.charName}, da raça ${sh.race}.${sh.aparencia ? ' ' + sh.aparencia.split(/(?<=[.!?])\s/)[0] : ''}`);
  p.push(`Seu ponto forte é ${hi.name}: ${hi.covers}. Seu ponto fraco é ${lo.name}, e as criaturas caçam quem não se equilibra.`);
  p.push(`Todo dia você acorda com ${resv} na reserva. É isso que faz de você alguém fora do comum.`);
  if (session && session.opening) p.push(session.opening);
  p.push('Você sabe o que todo mundo sabe: quem enxerga a névoa roxa de longe ainda está fora dela.');
  p.push(placeName ? `Sua jornada começa em ${placeName}.` : 'O Mestre vai dizer onde você está quando a primeira cena abrir.');
  return p;
}

function screenIntro(sh) {
  st.sheet = sh;
  const map = (st.session && st.session.map) || {};
  const pl = sh.placeId && ((map.places || {})[sh.placeId] || (sh.knownPlaces || {})[sh.placeId]);
  const paras = composeIntro(sh, st.session, pl && pl.name);
  const cvs = h('canvas', { class: 'mist-cvs soft', 'aria-hidden': 'true' });
  const speak = cap.tts ? h('button', { class: 'btn ghost', onclick: () => cap.tts.speak(paras.join(' ') + ' Zito.', { language: 'pt-BR', voice: 'rounded', rate: 0.95 }).catch(() => {}) }, icon('speaker'), 'Ouvir') : null;
  clear(root);
  root.appendChild(h('main', { class: 'intro-screen' }, cvs,
    h('div', { class: 'intro-card' },
      h('div', { class: 'pt-xl', html: portraitSVG(sh.portrait, { level: sh.level }) }),
      h('h1', { class: 'title-l' }, sh.charName),
      h('div', { class: 'narrative' }, paras.map(t => h('p', null, t)), h('p', { class: 'sign' }, SIGN)),
      h('div', { class: 'row' }, speak, h('button', { class: 'btn primary big', onclick: () => { cvs._stop && cvs._stop(); enterGame(); } }, 'Entrar na sessão')))));
  cvs._stop = mountMist(cvs, { blobs: 8, particles: 12, strength: 0.7 });
}

// ------------------------------------------------------------ jogo
async function enterGame() {
  for (const u of st.unsub) u(); st.unsub = [];
  st.booted = false;
  platform.inGame = true;
  clear(root);
  const app = h('div', { class: 'app player' });
  root.appendChild(app);
  st.app = app;
  const sid = st.sid;
  const on = (ref, fn) => st.unsub.push(watch(ref, fn, { onSlow: () => banner('Os dados da mesa estão demorando. Verifique a conexão.'), onError: () => banner('A conexão com a mesa caiu. Recarregue a página.') }));
  on(doc(P.session(sid)), s => { if (s.exists) { st.session = s.data(); paint(); } });
  on(doc(P.sheet(me.id, sid)), s => { if (s.exists) { const prev = st.sheet; st.sheet = s.data(); flashChanges(prev, st.sheet); paint(); } });
  on(col(P.roster(sid)), q => { st.roster = Object.fromEntries(q.docs.map(x => [x.id, x.data()])); paint(); });
  on(col(P.log(sid)).orderBy('ts', 'desc').limit(80), q => { notifyNew(q, 'log'); st.log = q.docs.map(x => ({ id: x.id, ...x.data(), scope: 'todos' })); paint(); });
  on(col(P.inbox(me.id, sid)).orderBy('ts', 'desc').limit(80), q => { notifyNew(q, 'inbox'); st.inbox = q.docs.map(x => ({ id: x.id, ...x.data(), scope: 'voce' })); paint(); });
  on(doc(P.layout(me.id, sid)), s => { st.layout = s.exists ? s.data() : null; if (st.view === 'bag') paint(); });
  const room = await joinRoom(st.session.code);
  if (room) {
    room.presence({ role: 'jogador', uid: me.id, sid, name: st.sheet ? st.sheet.charName : '' }).catch(() => {});
    room.onPeers(c => { st.peers = c.peers; paintTop(); });
    room.on('roll', m => { if (m.sameTab || !m.data) return; const r = st.roster[m.by]; if (r) toast(`${r.charName}: ${m.data.label} = ${m.data.total}`); });
    room.onConnection(ok => {
      st.conn = ok; paintTop();
      if (platform.site) { const b = st.app && st.app.querySelector('.banner'); if (!ok) banner('Sem contato com o celular do Mestre. Seus pedidos seguem quando ele voltar.'); else if (b) b.remove(); }
    });
  }
  setTimeout(() => { st.booted = true; }, 2500);
}

function banner(t) { if (!st.app) return; let b = st.app.querySelector('.banner'); if (!b) { b = h('div', { class: 'banner', role: 'status' }); st.app.prepend(b); } b.textContent = t; }

function notifyNew(q, kind) {
  if (!st.booted) return;
  for (const c of q.docChanges()) if (c.type === 'added') {
    const e = c.doc.data();
    st.unread++;
    toast(kind === 'inbox' ? `Só para você: ${e.title || e.text.slice(0, 60)}` : (e.title || e.text.slice(0, 70)));
  }
}

function flashChanges(prev, cur) {
  if (!prev || !st.booted) return;
  if (cur.vida < prev.vida) document.body.classList.add('hit'), setTimeout(() => document.body.classList.remove('hit'), 700);
  if (cur.level > prev.level) toast(`Level ${cur.level}. Você ganhou ${cur.pendingPoints - (prev.pendingPoints || 0)} pontos para distribuir.`, { ms: 8000 });
}

const TABS = [['hud', 'HUD', 'hud'], ['sheet', 'Ficha', 'sheet'], ['bag', 'Mochila', 'bag'], ['map', 'Mapa', 'map'], ['diary', 'Diário', 'book']];

function paint() {
  if (!st.app || !st.sheet || !st.session) return;
  const app = st.app;
  if (deferWhileTyping(app, paint)) return;
  const scrollY = window.scrollY;
  clear(app);
  const sh = st.sheet;
  const z = zeroAttrs(sh.attrs);
  const pos = placePos(sh.placeId);
  const zones = (st.session.map && st.session.map.zones) || {};
  let inside = null;
  for (const zz of Object.values(zones)) { const w = insideZone(zz, pos); if (w === 'zona' || (w && !inside)) inside = w; }
  // Gm also may flag the place itself as inside a zone (master-only zones are not public): the master can set condition
  if (sh.chaosInside) inside = sh.chaosInside;
  app.className = 'app player' + (inside ? ' inside-' + inside : '') + (st.session.mode === 'prisioneiros' ? ' mode-pris' : '');
  app.appendChild(topBar());
  if (platform.site && st.conn === false) app.prepend(h('div', { class: 'banner', role: 'status' }, 'Sem contato com o celular do Mestre. Seus pedidos seguem quando ele voltar.'));
  const main = h('main', { class: 'view' });
  app.appendChild(main);
  if (st.session.status === 'pausada') main.appendChild(h('p', { class: 'note' }, 'O Mestre pausou a sessão.'));
  if (z.length) main.appendChild(h('div', { class: 'death' }, h('h2', null, 'Insuficiência existencial'), h('p', null, `${z.join(', ')} chegou a zero. Pela regra, o personagem morre.`), h('p', { class: 'muted' }, 'Só o Mestre pode mudar isso.')));
  ({ hud: viewHud, sheet: viewSheet, bag: viewBag, map: viewMap, diary: viewDiary })[st.view](main, sh, inside);
  app.appendChild(h('nav', { class: 'tabbar', 'aria-label': 'Seções' }, TABS.map(([k, l, ic]) => h('button', { class: 'tab' + (st.view === k ? ' on' : ''), 'aria-current': st.view === k ? 'page' : null, onclick: () => { st.view = k; if (k === 'diary') st.unread = 0; paint(); window.scrollTo(0, 0); } }, icon(ic, 22), h('span', null, l), k === 'diary' && st.unread ? h('i', { class: 'badge' }, String(st.unread)) : null))));
  if (inside === 'zona') { const c = h('canvas', { class: 'zone-particles', 'aria-hidden': 'true' }); app.appendChild(c); mountMist(c, { blobs: 0, particles: 18, particleAlpha: 0.22 }); }
  window.scrollTo(0, scrollY);
}

function placePos(pid) {
  if (!pid) return null;
  const pub = (st.session.map && st.session.map.places) || {};
  return pub[pid] || (st.sheet.knownPlaces || {})[pid] || null;
}

function topBar() {
  const sh = st.sheet;
  const pl = placePos(sh.placeId);
  const online = (st.peers || []).some(p => p.presence && p.presence.role === 'mestre');
  const t = h('header', { class: 'topbar' },
    h('div', { class: 'pt-s', html: portraitSVG(sh.portrait, { level: sh.level, corrupt: corruptLevel(sh) }) }),
    h('div', { class: 'tb-id' },
      h('h1', { class: 'tb-name' }, sh.charName),
      h('p', { class: 'tb-sub' }, `${sh.race} · Level ${sh.level}`),
      h('p', { class: 'tb-place' }, icon('local', 14), pl ? pl.name : 'Local a definir pelo Mestre')),
    h('span', { class: 'conn' + (st.conn === false ? ' off' : online ? ' gm' : ''), title: online ? 'Mestre conectado' : 'Mestre fora da sala' }, h('i'), online ? 'Mestre na mesa' : 'Mesa'));
  st.top = t;
  return t;
}
function paintTop() { if (st.top && st.sheet) { const n = topBar(); st.top.replaceWith(n); } }
const corruptLevel = sh => (st.session && st.session.mode === 'prisioneiros') ? Math.max(0, 1 - sh.sanidade / Math.max(1, derive(sh.attrs).sanidade)) : (sh.conditions || []).some(c => c.tone === 'chaos') ? 0.4 : 0;

function vital(label, ic, cur, max, tone, note) {
  const crit = max > 0 && cur / max <= 0.25;
  return h('div', { class: 'vital ' + tone + (crit ? ' crit' : '') },
    h('div', { class: 'v-head' }, icon(ic, 18), h('span', { class: 'v-label' }, label), note ? h('small', { class: 'v-note' }, note) : null, h('span', { class: 'v-num' }, h('b', null, String(cur)), `/${max}`)),
    cells(cur, max, tone, { big: true, label }),
    crit ? h('p', { class: 'v-crit' }, `${label} crítica`) : null);
}

function viewHud(main, sh, inside) {
  const der = derive(sh.attrs);
  const pris = st.session.mode === 'prisioneiros';
  if (inside) main.appendChild(h('p', { class: 'inside-note' }, icon('chaos', 16), CHAOS.inside));
  main.appendChild(h('section', { class: 'vitals', 'aria-label': 'Status' },
    vital('Vida', 'vida', sh.vida, der.vida, 'vida'),
    vital('Sanidade', 'sanidade', sh.sanidade, der.sanidade, 'san', pris ? 'contador de corrupção' : null),
    vital('Bem-Estar', 'bem', sh.bemEstar, der.bemEstar, 'bem')));
  const surv = st.session.survival || {};
  if (surv.fome || surv.sede) main.appendChild(h('section', { class: 'vitals small' },
    surv.fome ? vital('Fome', 'carga', sh.fome ?? 10, 10, 'bem', 'proposta do Mestre') : null,
    surv.sede ? vital('Sede', 'bem', sh.sede ?? 10, 10, 'san', 'proposta do Mestre') : null));

  const da = daFor(sh.level);
  const full = reserveFor(sh.level);
  const resv = h('div', { class: 'reserve' });
  for (const t of TIERS) if (full[t]) {
    const g = h('div', { class: 'r-group' }, h('span', { class: 'r-t' }, t.toUpperCase()));
    for (let i = 0; i < full[t]; i++) g.appendChild(dieEl(t, t === 'd6' ? 6 : SIDE_LABEL[t], i < (sh.reserve[t] || 0) ? '' : 'spent'));
    resv.appendChild(g);
  }
  main.appendChild(h('section', { class: 'card dice-card' },
    h('div', { class: 'row between' }, h('h2', { class: 'card-t' }, 'Reserva de hoje'), h('span', { class: 'da' }, 'DA ', h('b', null, '2' + da.toUpperCase()))),
    resv,
    h('button', { class: 'btn primary big', onclick: () => openRoller({ sheetData: sh, onSpend: (tier, n) => request('spend', { tier, n }), onDefense: v => request('defense', v), broadcast: data => roomNow() && roomNow().emit('roll', { ...data, sid: st.sid }).catch(() => {}) }) }, icon('roll', 22), 'Rolar dados')));

  if (sh.defense) main.appendChild(h('section', { class: 'card def' },
    h('div', { class: 'row between' }, h('h2', { class: 'card-t' }, icon('shield', 18), 'Defesa fixa até seu turno'), h('small', { class: 'muted' }, fmtTime(sh.defense.ts))),
    h('div', { class: 'def-grid' }, h('div', null, h('b', null, String(sh.defense.esquiva)), h('span', null, 'Esquiva')), h('div', null, h('b', null, String(sh.defense.bloqueio)), h('span', null, 'Bloqueio')), h('div', null, h('b', null, String(sh.defense.contra)), h('span', null, 'Contra')))));

  const dl = deslocamento(sh.attrs.agi, RACE_BASE[sh.race] || 5);
  main.appendChild(h('section', { class: 'quick' },
    quick('sorte', 'Sorte', String(sh.sorte)),
    quick('desloc', 'Deslocamento', `${dl} / ${dl * 2}`, 'anda / corre'),
    quick('carga', 'Carga', `${carga(sh.attrs.for)} kg`, 'confortável')));

  const res = (st.session.resources || []).filter(r => r && r.key);
  if (res.length) main.appendChild(h('section', { class: 'quick' }, res.map(r => quick('bag', r.label, String((sh.resources || {})[r.key] || 0), 'definido pelo Mestre'))));

  if ((sh.conditions || []).length) main.appendChild(h('section', { class: 'conds' }, h('h2', { class: 'card-t' }, 'Condições'), h('div', { class: 'chips' }, sh.conditions.map(c => h('span', { class: 'cond ' + (c.tone || ''), title: c.note }, c.name)))));

  const habs = sh.habilidades || [];
  main.appendChild(h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Habilidades', sh.arvore ? h('small', { class: 'muted' }, ` · árvore ${sh.arvore}`) : null),
    habs.length ? habs.map(hb => h('div', { class: 'hab' }, h('div', null, h('b', null, hb.name), h('small', { class: 'muted' }, ` ${hb.tipo || ''}`)),
      hb.tipo === 'ativa' ? h('div', { class: 'uses', 'aria-label': `${hb.usos} de ${hb.usosMax} usos` }, Array.from({ length: hb.usosMax || 0 }, (_, i) => h('i', { class: i < hb.usos ? 'on' : '' }))) : null,
      hb.tipo === 'ativa' && hb.usos > 0 ? h('button', { class: 'btn ghost small', onclick: () => request('use', { habId: hb.id, name: hb.name }) }, 'Usar') : null))
      : h('p', { class: 'muted' }, 'O Mestre entrega sua primeira árvore no level 1: uma passiva e uma ativa, com 3 a 5 usos por dia.')));

  const lastMsg = [...st.log, ...st.inbox].sort((a, b) => b.ts - a.ts)[0];
  if (lastMsg) main.appendChild(entryCard(lastMsg, true));
}
const SIDE_LABEL = { d8: 8, d10: 10, d12: 12, d20: 20 };
const quick = (ic, l, v, sub) => h('div', { class: 'q' }, icon(ic, 18), h('span', { class: 'q-l' }, l), h('b', { class: 'q-v' }, v), sub ? h('small', null, sub) : null);
const statBox = (l, v, f) => h('div', { class: 'stat' }, h('b', null, String(v)), h('span', null, l), f ? h('small', null, f) : null);

function attrTable(a) {
  return h('div', { class: 'attrs' }, ATTRS.map(x => h('div', { class: 'attr' + ((a[x.k] || 0) <= 0 ? ' zero' : '') }, h('span', { class: 'a-n' }, x.name), h('small', null, x.covers), h('b', { class: 'a-v' }, String(a[x.k] ?? '–')))));
}

async function request(kind, payload) {
  try {
    await doc(`${P.queue(me.id)}/r${now().toString(36)}${uid8().slice(0, 3)}`).set({ sid: st.sid, ts: now(), kind, payload });
    roomNow() && roomNow().emit('ping', { kind, sid: st.sid }).catch(() => {});
  } catch { toast('Pedido não enviado. Verifique a conexão.'); }
}

function viewSheet(main, sh) {
  const der = derive(sh.attrs);
  const xp = xpProgress(sh.xp || 0);
  put(main, 
    h('section', { class: 'sheet-hero' }, h('div', { class: 'pt-l', html: portraitSVG(sh.portrait, { level: sh.level }) }),
      h('div', null, h('h2', { class: 'title-m' }, sh.charName), h('p', { class: 'muted' }, `${sh.race}${sh.tendencia ? ' · ' + sh.tendencia : ''} · jogado por ${sh.playerName}`),
        h('div', { class: 'xp' }, h('div', { class: 'xp-bar' }, h('i', { style: { width: Math.round(xp.pct * 100) + '%' } })), h('small', null, xp.next ? `${sh.xp} / ${xp.next} XP para o level ${xp.lv + 1}` : `${sh.xp} XP`)))),
    attrTable(sh.attrs),
    h('div', { class: 'grid3' }, DERIVED.map(x => statBox(x.name, der[x.k], x.f)), statBox('Pontos', 39 + 8 * sh.level - (sh.pendingPoints || 0), 'nos atributos')));
  if (sh.pendingPoints > 0) main.appendChild(pointsCard(sh));
  main.appendChild(h('section', { class: 'card' }, h('h2', { class: 'card-t' }, 'Perícias'),
    (sh.pericias || []).map(p => h('div', { class: 'row between' }, h('span', null, p.name), h('b', null, `nível ${p.lvl} · +${PERICIA_BONUS[p.lvl] || 0}`))),
    sh.pendingPericias > 0 ? periciaPick(sh) : null));
  main.appendChild(h('details', { class: 'card' }, h('summary', null, 'Tabela de XP'), h('div', { class: 'xp-table' }, Object.entries(XP_TABLE).map(([l, v]) => h('div', { class: +l === sh.level ? 'on' : '' }, h('span', null, `Level ${l}`), h('b', null, String(v)))))));
  if (sh.aparencia || sh.historia) main.appendChild(h('section', { class: 'card' }, sh.aparencia ? [h('h2', { class: 'card-t' }, 'Aparência'), h('p', null, sh.aparencia)] : null, sh.historia ? [h('h2', { class: 'card-t' }, 'História'), h('p', null, sh.historia)] : null));
}

function pointsCard(sh) {
  if (!st.alloc || st.alloc._for !== sh.pendingPoints) st.alloc = { _for: sh.pendingPoints };
  const alloc = st.alloc; let left = sh.pendingPoints - Object.entries(alloc).filter(([k]) => k !== '_for').reduce((a, [, b]) => a + b, 0);
  const out = h('b', null, String(left));
  const send = h('button', { class: 'btn primary', disabled: left !== 0, onclick: () => { const a = {}; for (const x of ATTRS) a[x.k] = alloc[x.k] || 0; request('points', { alloc: a }); send.disabled = true; send.textContent = 'Enviado ao Mestre'; } }, 'Enviar ao Mestre');
  return h('section', { class: 'card hl' }, h('h2', { class: 'card-t' }, 'Pontos novos: ', out),
    ATTRS.map(x => h('div', { class: 'row between' }, h('span', null, x.name), stepper(alloc[x.k] || 0, { min: 0, max: sh.pendingPoints, label: x.name, onChange: v => { alloc[x.k] = v; left = sh.pendingPoints - ATTRS.reduce((a, y) => a + (alloc[y.k] || 0), 0); out.textContent = String(left); send.disabled = left !== 0; } }))),
    h('p', { class: 'muted small' }, 'Sem limite por atributo. A ficha se desbalanceia naturalmente.'), send);
}

function periciaPick(sh) {
  const inp = h('input', { id: 'new-per', class: 'in', placeholder: 'Nova perícia ou uma que já tem' });
  return h('div', { class: 'stack tight' }, h('p', { class: 'note' }, `Você tem ${sh.pendingPericias} ponto de perícia.`), inp,
    h('button', { class: 'btn', onclick: () => { if (inp.value.trim()) { request('pericia', { name: inp.value.trim() }); toast('Pedido enviado ao Mestre.'); } } }, 'Pedir ao Mestre'));
}

// ------------------------------------------------------------ mochila
const SLOTS = 24;
function viewBag(main, sh) {
  const inv = sh.inv || [];
  const layout = reconcile(inv, (st.layout && st.layout.slots) || {});
  const w = inv.reduce((n, i) => n + (i.weight ? i.weight * (i.qty || 1) : 0), 0);
  const hasW = inv.some(i => i.weight);
  const cg = carga(sh.attrs.for);
  main.appendChild(h('section', { class: 'bag-head' },
    h('div', { class: 'pt-m', html: portraitSVG(sh.portrait, { level: sh.level }) }),
    h('div', null, h('h2', { class: 'title-m' }, 'Mochila'),
      hasW ? h('div', { class: 'load' + (w > cg ? ' over' : '') }, h('div', { class: 'xp-bar' }, h('i', { style: { width: Math.min(100, (w / cg) * 100) + '%' } })), h('small', null, `${w.toFixed(1)} de ${cg} kg confortáveis`)) : h('small', { class: 'muted' }, `Carga confortável: ${cg} kg. Os itens ainda não têm peso definido.`))));
  const eq = inv.filter(i => i.equipped);
  main.appendChild(h('section', null, h('h2', { class: 'card-t' }, 'Equipado'), eq.length ? h('div', { class: 'eq-row' }, eq.map(i => itemTile(i, i.qty, () => itemSheet(i, sh)))) : h('p', { class: 'muted' }, 'Nada equipado.')));
  let moving = null;
  const grid = h('div', { class: 'slots', role: 'list', 'aria-label': 'Espaços da mochila' });
  const save = async () => { try { await write(P.layout(me.id, st.sid), { slots: layout, ts: now() }); } catch { toast('Não consegui salvar a arrumação.'); } };
  const drawGrid = () => {
    clear(grid);
    for (let k = 0; k < SLOTS; k++) {
      const cell = layout[k];
      const it = cell && inv.find(i => i.id === cell.id);
      const slot = h('div', { class: 'slot' + (moving != null && moving === k ? ' lift' : '') + (moving != null && moving !== k ? ' target' : ''), 'data-k': k, role: 'listitem' });
      if (it) slot.appendChild(itemTile(it, cell.qty, () => {
        if (moving != null) return dropAt(k);
        itemSheet(it, sh, { split: cell.qty > 1 ? () => split(k) : null, move: () => { moving = k; drawGrid(); toast('Toque no espaço de destino.'); } });
      }));
      else slot.appendChild(h('button', { class: 'slot-empty', 'aria-label': `Espaço ${k + 1}`, onclick: () => { if (moving != null) dropAt(k); } }));
      grid.appendChild(slot);
    }
  };
  const dropAt = k => {
    const from = moving; moving = null;
    if (from === k) return drawGrid();
    const a = layout[from], b = layout[k];
    if (b && a && b.id === a.id) { b.qty += a.qty; delete layout[from]; }
    else { layout[k] = a; if (b) layout[from] = b; else delete layout[from]; }
    drawGrid(); save();
  };
  const split = k => {
    const c = layout[k]; const free = [...Array(SLOTS).keys()].find(i => !layout[i]);
    if (free == null) return toast('Sem espaço livre para dividir.');
    const half = Math.floor(c.qty / 2); c.qty -= half; layout[free] = { id: c.id, qty: half }; drawGrid(); save();
  };
  // arrastar e soltar (ponteiro)
  let drag = null;
  grid.addEventListener('pointerdown', e => { const s = e.target.closest('.slot'); if (!s || !layout[+s.dataset.k]) return; drag = { k: +s.dataset.k, x: e.clientX, y: e.clientY, t: setTimeout(() => { drag && (drag.on = true, s.classList.add('lift')); }, e.pointerType === 'mouse' ? 0 : 280) }; });
  grid.addEventListener('pointerup', e => { if (!drag) return; clearTimeout(drag.t); const dd = drag; drag = null; if (!dd.on) return; const tgt = document.elementFromPoint(e.clientX, e.clientY); const s = tgt && tgt.closest('.slot'); if (s) { moving = dd.k; dropAt(+s.dataset.k); } else drawGrid(); });
  grid.addEventListener('pointercancel', () => { if (drag) clearTimeout(drag.t); drag = null; drawGrid(); });
  drawGrid();
  put(main, h('section', null, h('div', { class: 'row between' }, h('h2', { class: 'card-t' }, 'Espaços'), h('small', { class: 'muted' }, 'Só organização. A regra de peso é em quilos.')), grid));
  if (!inv.length) main.appendChild(empty('Mochila vazia. O Mestre entrega os itens conforme a história.'));
}

function reconcile(inv, slots) {
  const out = {};
  const left = Object.fromEntries(inv.filter(i => !i.equipped).map(i => [i.id, i.qty || 1]));
  for (const [k, c] of Object.entries(slots)) {
    if (!c || left[c.id] == null || left[c.id] <= 0 || +k >= SLOTS) continue;
    const q = Math.min(c.qty, left[c.id]); out[k] = { id: c.id, qty: q }; left[c.id] -= q;
  }
  for (const [id, q] of Object.entries(left)) if (q > 0) {
    const here = Object.entries(out).find(([, c]) => c.id === id);
    if (here) { here[1].qty += q; continue; }
    const free = [...Array(SLOTS).keys()].find(i => !out[i]);
    if (free != null) out[free] = { id, qty: q };
  }
  return out;
}

function itemTile(it, qty, onTap) {
  const ini = (it.name || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return h('button', { class: 'item' + (it.important ? ' imp' : '') + (it.equipped ? ' eq' : ''), onclick: onTap, 'aria-label': `${it.name}, ${qty}` },
    h('span', { class: 'item-tag' }, h('i', { class: 'hole' }), h('b', null, ini)),
    h('span', { class: 'item-n' }, it.name), qty > 1 ? h('span', { class: 'qty' }, '×' + qty) : null);
}

function itemSheet(it, sh, { split, move } = {}) {
  const row = (l, v, t) => v ? h('div', { class: 'kv' }, h('span', null, l, t ? [' ', tag(t)] : null), h('b', null, String(v))) : null;
  const rules = st.session.rules || {};
  const s = sheet({ title: it.name, sub: it.cat || 'Item', body: h('div', { class: 'stack' },
    it.desc ? h('p', null, it.desc) : h('p', { class: 'muted' }, 'Sem descrição.'),
    h('div', { class: 'kvs' }, row('Quantidade', it.qty), row('Peso', it.weight != null ? it.weight + ' kg' : null, 'proposta'), row('Raridade', it.rarity, 'proposta'), row('Conservação', it.cond, 'proposta'), row('Propriedades', it.props), row('Requisitos', it.reqs)),
    it.important ? h('p', { class: 'note' }, 'Item importante.') : null,
    h('div', { class: 'row wrap' },
      h('button', { class: 'btn', onclick: () => { request(it.equipped ? 'unequip' : 'equip', { itemId: it.id, name: it.name }); toast(rules.autoEquip === false ? 'Pedido enviado ao Mestre.' : (it.equipped ? 'Desequipando…' : 'Equipando…')); s.close(); } }, it.equipped ? 'Desequipar' : 'Equipar'),
      move ? h('button', { class: 'btn ghost', onclick: () => { s.close(); move(); } }, 'Mover') : null,
      split ? h('button', { class: 'btn ghost', onclick: () => { s.close(); split(); } }, 'Dividir pilha') : null)) });
}

// ------------------------------------------------------------ mapa
function viewMap(main, sh, inside) {
  const pub = st.session.map || {};
  const places = {};
  for (const [k, p] of Object.entries(pub.places || {})) places[k] = { ...p, known: true };
  for (const [k, p] of Object.entries(sh.knownPlaces || {})) if (!places[k]) places[k] = { ...p, known: true, mine: true };
  const tokens = Object.values(st.roster).map(r => ({ placeId: r.placeId, portrait: r.portrait, level: r.level, name: r.charName }));
  const box = h('div', { class: 'map-box' });
  put(main, h('h2', { class: 'title-m' }, 'Mapa'), box);
  renderMap(box, { places, links: (pub.links || []).filter(l => places[l.a] && places[l.b]), zones: pub.zones || {}, tokens, viewerPlaceId: sh.placeId, onTapPlace: id => { const p = places[id]; sheet({ title: p.name, body: h('div', { class: 'stack' }, p.desc ? h('p', null, p.desc) : h('p', { class: 'muted' }, 'Sem descrição.'), p.mine ? h('p', { class: 'note' }, 'Só você conhece este lugar.') : null) }); } });
  if (inside) main.appendChild(h('p', { class: 'inside-note' }, icon('chaos', 16), CHAOS.inside));
  main.appendChild(h('p', { class: 'muted small' }, 'Mapa esquemático montado pelo Mestre. As distâncias não são oficiais.'));
  if (!Object.keys(places).length) main.appendChild(empty('Nenhum lugar descoberto ainda.'));
}

// ------------------------------------------------------------ diário
function viewDiary(main) {
  let q = '';
  const list = h('div', { class: 'stack' });
  const draw = () => {
    clear(list);
    const all = [...st.log, ...st.inbox].sort((a, b) => b.ts - a.ts).filter(e => !q || norm(e.text + ' ' + e.title).includes(norm(q)));
    if (!all.length) list.appendChild(empty(q ? 'Nada encontrado.' : 'Os acontecimentos da mesa aparecem aqui.'));
    let day = '';
    for (const e of all) { const dd = fmtDay(e.ts); if (dd !== day) { day = dd; list.appendChild(h('p', { class: 'day' }, dd)); } list.appendChild(entryCard(e)); }
  };
  const s = h('input', { id: 'diary-q', class: 'in', type: 'search', placeholder: 'Procurar no diário', oninput: e => { q = e.target.value; draw(); } });
  put(main, h('h2', { class: 'title-m' }, 'Diário'), h('label', { class: 'search' }, icon('search', 18), s), list);
  draw();
}

export function entryCard(e, compact = false) {
  const narrative = e.signed || e.kind === 'cronica' || e.kind === 'abertura';
  return h('article', { class: 'entry' + (narrative ? ' narr' : '') + (compact ? ' compact' : '') },
    h('header', null, h('span', { class: 'e-time' }, fmtTime(e.ts)), e.scope === 'voce' ? h('span', { class: 'tag t-you' }, 'Só para você') : null, e.title ? h('b', null, e.title) : null),
    h('div', { class: narrative ? 'narrative' : '' }, String(e.text).split(/\n+/).map(t => h('p', null, t)), e.signed ? h('p', { class: 'sign' }, SIGN) : null));
}
