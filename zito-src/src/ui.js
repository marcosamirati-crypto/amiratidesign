// Componentes de interface. Todo texto vindo do banco, de outros jogadores
// ou do Claude entra por textContent (função h), nunca como HTML.

export function h(tag, props, ...kids) {
  const el = tag === 'frag' ? document.createDocumentFragment() : document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v; // só para SVG/markup estático escrito aqui
    else if (k in el && typeof v !== 'string' && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  add(el, kids);
  // campos só com placeholder ganham nome acessível
  if ((tag === 'input' || tag === 'textarea') && !el.hasAttribute('aria-label') && el.getAttribute('placeholder')) el.setAttribute('aria-label', el.getAttribute('placeholder'));
  return el;
}
function add(el, kids) {
  for (const k of kids) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) add(el, k);
    else if (k instanceof Node) el.appendChild(k);
    else el.appendChild(document.createTextNode(String(k)));
  }
}
// append que ignora null/false e achata arrays (Element.append escreveria "null")
export const put = (el, ...kids) => { add(el, kids); return el; };
export const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
export const $ = (s, r = document) => r.querySelector(s);
export const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtTime = ts => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export const fmtDay = ts => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

// ---------- ícones (traço único, estilo caderno de campo) ----------
const P = {
  vida: '<path d="M3 13h4l2-5 3 9 2.5-6 1.5 2H21"/>',
  sanidade: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  bem: '<path d="M12 20v-8"/><path d="M12 12c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5z"/><path d="M12 14.5c0-3-2.3-5-5.5-5 0 3 2.3 5 5.5 5z"/>',
  die: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/>',
  dice: '<rect x="2.5" y="8" width="11" height="11" rx="2.2"/><path d="M9 5.2 13.6 3l6.4 3.6v7.6l-4.6 2.3"/><circle cx="6" cy="11.5" r="1" fill="currentColor"/><circle cx="10" cy="15.5" r="1" fill="currentColor"/>',
  sorte: '<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="M18.5 5.5l-13 13"/>',
  desloc: '<path d="M3 21h18M3 15h18M3 9h18M9 3v18M15 3v18"/><path d="M5.5 18l5-5 3 3 5-5" stroke-width="2"/>',
  carga: '<path d="M8 8a4 4 0 0 1 8 0"/><path d="M5 8h14l1.5 12h-17z"/>',
  local: '<path d="M12 3l6 9H6z"/><path d="M12 12v9M8 21h8"/>',
  xp: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  bag: '<path d="M7 8V6a5 5 0 0 1 10 0v2"/><rect x="4" y="8" width="16" height="13" rx="3"/><path d="M4 13h16"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  sheet: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  hud: '<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="2"/>',
  mesa: '<circle cx="8" cy="9" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3 19c.6-3 2.6-5 5-5s4.4 2 5 5M13.5 18.5c.4-2.4 1.6-3.8 3-3.8s2.7 1.4 3.2 3.8"/>',
  narrar: '<path d="M4 20c4-1 6-3 8-6l6-8a2 2 0 0 0-3-2l-6 8c-2 3-4 4-5 8z"/><path d="M13 7l3 2"/>',
  log: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  hidden: '<path d="M3 3l18 18"/><path d="M10.6 5.6A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.6M6.4 6.5C3.9 8.2 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4-.9"/>',
  chaos: '<path d="M12 12m-1.5 0a1.5 1.5 0 1 0 3 0a3 3 0 1 0-6 0a4.5 4.5 0 1 0 9 0a6 6 0 1 0-12 0"/>',
  ant: '<ellipse cx="12" cy="6.5" rx="2" ry="2"/><ellipse cx="12" cy="11.5" rx="2.2" ry="2.6"/><ellipse cx="12" cy="17.5" rx="3" ry="3.6"/><path d="M10 11l-5-3M14 11l5-3M10 12.5l-5 1M14 12.5l5 1M10 14l-4 4M14 14l4 4M11 4.8L9 2M13 4.8L15 2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  speaker: '<path d="M4 9.5h4l5-4v13l-5-4H4z"/><path d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  roll: '<path d="M12 2.5l8.5 5v9L12 21.5 3.5 16.5v-9z"/><path d="M3.5 7.5L12 12.5l8.5-5M12 12.5v9"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
};
export function icon(name, size = 20, cls = '') {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', size); s.setAttribute('height', size);
  s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.7'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('aria-hidden', 'true');
  if (cls) s.setAttribute('class', cls);
  s.innerHTML = P[name] || '';
  return s;
}

// ---------- etiquetas de origem da informação ----------
const TAGS = {
  canone: ['Cânone', 't-canon'],
  lacuna: ['A definir pelo Mestre', 't-lacuna'],
  proposta: ['Proposta', 't-prop'],
  interp: ['Interpretação visual', 't-interp'],
  contradicao: ['Contradição nos documentos', 't-contra'],
  segredo: ['Só o Mestre vê', 't-secret'],
};
export const tag = (k, title) => h('span', { class: 'tag ' + TAGS[k][1], title }, TAGS[k][0]);

// ---------- medidor em células (cada ponto é um quadrado do grid) ----------
export function cells(cur, max, tone, { big = false, label = '' } = {}) {
  max = Math.max(0, Math.round(max || 0));
  cur = Math.max(0, Math.round(cur || 0));
  const wrap = h('div', { class: 'cells ' + tone + (big ? ' big' : ''), role: 'meter', 'aria-label': label || tone, 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': cur });
  const n = Math.min(max, 40);
  const per = max > 40 ? max / 40 : 1;
  for (let i = 0; i < n; i++) {
    const filled = (i + 1) * per <= cur + 0.0001 || (per > 1 && i * per < cur);
    wrap.appendChild(h('i', { class: filled ? 'on' : '' }));
  }
  if (cur > max) wrap.appendChild(h('b', { class: 'over' }, '+' + (cur - max)));
  return wrap;
}

// ---------- toast ----------
let toastHost;
export function toast(msg, { action, label = 'Desfazer', ms, tone = '' } = {}) {
  ms = ms || (action ? 7000 : 3600);
  if (!toastHost) { toastHost = h('div', { class: 'toasts', 'aria-live': 'polite' }); document.body.appendChild(toastHost); }
  const t = h('div', { class: 'toast ' + tone }, h('span', null, msg));
  if (action) t.appendChild(h('button', { class: 'toast-act', onclick: () => { action(); t.remove(); } }, label));
  toastHost.appendChild(t);
  while (toastHost.children.length > 3) toastHost.firstChild.remove();
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

// ---------- folha inferior (modal) ----------
export function sheet({ title, sub, body, wide = false, onClose }) {
  const back = h('div', { class: 'scrim' });
  const closeBtn = h('button', { class: 'icon-btn', 'aria-label': 'Fechar' }, icon('close'));
  const panel = h('section', { class: 'sheet' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('header', { class: 'sheet-head' },
      h('div', null, h('h2', null, title), sub ? h('p', { class: 'muted' }, sub) : null),
      closeBtn),
    h('div', { class: 'sheet-body' }, body));
  back.appendChild(panel);
  document.body.appendChild(back);
  document.body.classList.add('locked');
  requestAnimationFrame(() => back.classList.add('in'));
  const close = () => {
    back.classList.remove('in');
    document.body.classList.remove('locked');
    setTimeout(() => back.remove(), 220);
    document.removeEventListener('keydown', onKey);
    onClose && onClose();
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  closeBtn.onclick = close;
  back.addEventListener('click', e => { if (e.target === back) close(); });
  setTimeout(() => { const f = panel.querySelector('input,textarea,button:not(.icon-btn)'); f && f.focus({ preventScroll: true }); }, 60);
  return { close, panel, body: panel.querySelector('.sheet-body') };
}

export function ask(text, { ok = 'Confirmar', cancel = 'Cancelar', danger = false, detail } = {}) {
  return new Promise(res => {
    let done = false;
    const s = sheet({
      title: text,
      body: h('div', { class: 'stack' },
        detail ? h('p', null, detail) : null,
        h('div', { class: 'row end' },
          h('button', { class: 'btn ghost', onclick: () => { done = true; s.close(); res(false); } }, cancel),
          h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), onclick: () => { done = true; s.close(); res(true); } }, ok))),
      onClose: () => { if (!done) res(false); },
    });
  });
}

// ---------- controles ----------
export function seg(options, value, onChange, { name = 'seg' } = {}) {
  const wrap = h('div', { class: 'seg', role: 'radiogroup' });
  const paint = v => wrap.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', b.dataset.v === String(v)));
  for (const o of options) {
    const b = h('button', { type: 'button', role: 'radio', 'data-v': String(o.v), onclick: () => { paint(o.v); onChange(o.v); } }, o.label);
    wrap.appendChild(b);
  }
  paint(value);
  return wrap;
}

export function stepper(value, { min = -999, max = 999, onChange, label }) {
  let v = value;
  const out = h('output', { class: 'step-v' }, String(v));
  const set = n => { v = Math.max(min, Math.min(max, n)); out.textContent = String(v); onChange(v); sync(); };
  const minus = h('button', { type: 'button', class: 'step-b', 'aria-label': 'Diminuir ' + (label || ''), onclick: () => set(v - 1) }, icon('minus', 18));
  const plus = h('button', { type: 'button', class: 'step-b', 'aria-label': 'Aumentar ' + (label || ''), onclick: () => set(v + 1) }, icon('plus', 18));
  const sync = () => { minus.disabled = v <= min; plus.disabled = v >= max; };
  sync();
  const el = h('div', { class: 'stepper' }, minus, out, plus);
  el.setValue = n => { v = n; out.textContent = String(v); sync(); };
  el.setBounds = (a, b) => { min = a; max = b; sync(); };
  return el;
}

export const field = (label, input, hint) => h('label', { class: 'field' }, h('span', { class: 'f-label' }, label), input, hint ? h('span', { class: 'f-hint' }, hint) : null);

export function empty(text, action) {
  return h('div', { class: 'empty' }, h('p', null, text), action || null);
}

export function copyText(text) {
  try { return navigator.clipboard.writeText(text).then(() => toast('Copiado.'), () => toast('Não consegui copiar. Selecione o texto.')); }
  catch { toast('Não consegui copiar. Selecione o texto.'); }
}

// Não repinta a tela enquanto a pessoa digita num campo
export function isTyping(container) {
  const a = document.activeElement;
  if (!a || !container || !container.contains(a)) return false;
  if (a.tagName === 'TEXTAREA' || a.tagName === 'SELECT') return true;
  return a.tagName === 'INPUT' && !['checkbox', 'radio', 'range', 'button'].includes(a.type);
}
export function deferWhileTyping(container, repaint) {
  if (!isTyping(container)) return false;
  const a = document.activeElement;
  if (!a._deferred) { a._deferred = true; a.addEventListener('blur', () => { a._deferred = false; setTimeout(repaint, 0); }, { once: true }); }
  return true;
}
