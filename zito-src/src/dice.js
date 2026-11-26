// Bandeja de dados: testes 2DA + valor + bônus + reserva, crítico encadeado,
// erro crítico, trava após o veredito do Mestre, Sorte em D100 e defesa fixa.
import { h, put, icon, sheet, seg, stepper, toast, clear } from './ui.js';
import { ATTRS, DERIVED, derive, daFor, rollTest, luck, d, SIDES, TIERS, PERICIA_BONUS } from './lore.js';

const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function dieEl(tier, value, cls = '') {
  const el = h('span', { class: `die ${tier} ${cls}`, role: 'img', 'aria-label': `${tier.toUpperCase()}${value != null ? ' ' + value : ''}${cls.includes('spent') ? ' gasto' : ''}` });
  if (tier === 'd6' && value && value <= 6) {
    const pos = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }[value];
    const grid = h('span', { class: 'pips' });
    for (let i = 1; i <= 9; i++) grid.appendChild(h('i', { class: pos.includes(i) ? 'on' : '' }));
    el.appendChild(grid);
  } else el.appendChild(h('b', null, value == null ? '' : String(value)));
  return el;
}

function tumble(host, tier, finals) {
  return new Promise(res => {
    clear(host);
    const els = finals.map(() => dieEl(tier, 1, 'rolling'));
    els.forEach(e => host.appendChild(e));
    if (reduce()) { els.forEach((e, i) => e.replaceWith(dieEl(tier, finals[i], 'landed'))); return res(); }
    let n = 0;
    const s = SIDES[tier];
    const iv = setInterval(() => {
      n++;
      host.querySelectorAll('.die').forEach((e, i) => e.replaceWith(dieEl(tier, n > 9 ? finals[i] : 1 + Math.floor(Math.random() * s), n > 9 ? 'landed' : 'rolling')));
      if (n > 9) { clearInterval(iv); res(); }
    }, 70);
  });
}

// opts: { sheetData, onSpend(tier,n), onDefense(obj), broadcast(obj) }
export function openRoller(opts) {
  const sh = opts.sheetData;
  const a = sh.attrs;
  const der = derive(a);
  const da = daFor(sh.level || 1);
  const reserve = { ...(sh.reserve || {}) };
  let mode = 'teste';
  let target = { k: 'ataque', label: 'Ataque', v: der.ataque };
  let pericia = null;
  let bonus = 0;
  let pick = { tier: null, n: 0 };
  let locked = false;
  let last = null;

  const body = h('div', { class: 'stack roller' });
  const s = sheet({ title: 'Rolar', sub: `Dado de ação: 2${da.toUpperCase()}`, body });

  const options = [
    ...DERIVED.map(x => ({ k: x.k, label: x.name, v: der[x.k] })),
    ...ATTRS.map(x => ({ k: x.k, label: x.name, v: a[x.k] })),
  ];

  const render = () => {
    clear(body);
    body.appendChild(seg([{ v: 'teste', label: 'Teste' }, { v: 'defesa', label: 'Defesa fixa' }, { v: 'sorte', label: 'Sorte D100' }], mode, v => { mode = v; last = null; locked = false; render(); }));
    if (mode === 'sorte') return renderLuck();
    if (mode === 'teste') {
      const chips = h('div', { class: 'chips' });
      for (const o of options) chips.appendChild(h('button', { type: 'button', class: 'chip' + (o.k === target.k ? ' sel' : ''), onclick: () => { target = o; render(); } }, `${o.label} ${o.v}`));
      put(body, h('p', { class: 'f-label' }, 'Somar'), chips);
      const per = (sh.pericias || []).filter(p => p && p.name);
      if (per.length) {
        const pc = h('div', { class: 'chips' }, h('button', { type: 'button', class: 'chip' + (!pericia ? ' sel' : ''), onclick: () => { pericia = null; render(); } }, 'Sem perícia'));
        for (const p of per) pc.appendChild(h('button', { type: 'button', class: 'chip' + (pericia && pericia.name === p.name ? ' sel' : ''), onclick: () => { pericia = p; render(); } }, `${p.name} +${PERICIA_BONUS[p.lvl] || 0}`));
        put(body, h('p', { class: 'f-label' }, 'Perícia'), pc);
      }
    } else {
      body.appendChild(h('p', { class: 'muted' }, 'Rola uma vez. O resultado dos dados fica fixo até seu turno voltar e vale contra todos os ataques. A cada ataque você escolhe: esquivar, bloquear ou contra-atacar.'));
    }
    const bon = stepper(bonus, { min: -20, max: 40, label: 'bônus', onChange: v => { bonus = v; } });
    put(body, h('div', { class: 'row between' }, h('span', { class: 'f-label' }, 'Bônus de habilidade ou situação'), bon));

    // reserva: até um grupo completo (5 dados do mesmo tier) por teste [RS p.2, RF p.5]
    const res = h('div', { class: 'reserve-pick' });
    for (const t of TIERS) {
      const left = (reserve[t] || 0) - (pick.tier === t ? pick.n : 0);
      if (!(reserve[t] > 0)) continue;
      const row = h('div', { class: 'rp-row' }, h('span', { class: 'rp-t' }, t.toUpperCase()));
      for (let i = 0; i < reserve[t]; i++) {
        const used = pick.tier === t && i < pick.n;
        row.appendChild(h('button', {
          type: 'button', class: 'rp-die' + (used ? ' used' : ''), 'aria-pressed': used, 'aria-label': `Usar ${t}`, disabled: locked || (pick.tier && pick.tier !== t && pick.n > 0),
          onclick: () => { if (pick.tier !== t) pick = { tier: t, n: 0 }; pick.n = used ? i : Math.min(5, i + 1); render(); },
        }, dieEl(t, null)));
      }
      row.appendChild(h('span', { class: 'muted small' }, `${left} livres`));
      res.appendChild(row);
    }
    if (res.childNodes.length) put(body, h('p', { class: 'f-label' }, 'Dados da reserva neste teste (até um grupo)'), res);
    else put(body, h('p', { class: 'muted' }, 'Reserva vazia hoje.'));

    const tray = h('div', { class: 'tray', 'aria-live': 'polite' });
    const out = h('div', { class: 'roll-out' });
    put(body, tray, out);
    const go = h('button', { class: 'btn primary big', onclick: () => doRoll(tray, out) }, icon('roll', 22), mode === 'defesa' ? 'Rolar defesa' : 'Rolar');
    body.appendChild(go);
    if (last) showResult(tray, out, true);
  };

  async function doRoll(tray, out) {
    const extra = pick.tier ? Array(pick.n).fill(pick.tier) : [];
    const value = mode === 'defesa' ? 0 : target.v;
    const pb = mode === 'teste' && pericia ? (PERICIA_BONUS[pericia.lvl] || 0) : 0;
    last = rollTest({ da, value, bonus: bonus + pb, extra });
    last.label = mode === 'defesa' ? 'Defesa' : target.label + (pericia ? ` + ${pericia.name}` : '');
    if (pick.n) { opts.onSpend && opts.onSpend(pick.tier, pick.n); reserve[pick.tier] -= pick.n; }
    pick = { tier: null, n: 0 };
    await tumble(tray, da, last.base);
    showResult(tray, out, false);
  }

  function showResult(tray, out, redraw) {
    if (redraw) { clear(tray); last.base.forEach(v => tray.appendChild(dieEl(da, v, 'landed'))); }
    clear(out);
    const r = last;
    const parts = [`${r.base[0]} + ${r.base[1]}`];
    if (r.chain.length) parts.push(r.critKind === 'critico' ? `crítico ${r.chain.map(p => p.join('+')).join(', ')}` : `erro crítico −(${r.chain[0].join('+')})`);
    if (r.value) parts.push(`${r.value} valor`);
    if (r.bonus) parts.push(`${r.bonus} bônus`);
    if (r.extraRolls.length) parts.push(r.extraRolls.map(x => `${x.v} (${x.t})`).join(' + '));
    put(out, 
      h('div', { class: 'total' + (r.critKind ? ' ' + r.critKind : '') }, h('span', { class: 'total-n' }, String(mode === 'defesa' ? r.total : r.total)), h('span', null, r.label)),
      h('p', { class: 'muted' }, parts.join(' · ')),
      r.critKind === 'critico' ? h('p', { class: 'note good' }, 'Crítico. Os dois dados no máximo: rolou de novo e somou.') : null,
      r.critKind === 'erro' ? h('p', { class: 'note bad' }, r.seriousHarm ? 'Erro crítico com resultado negativo: consequência física séria.' : 'Erro crítico: rolou de novo e subtraiu.') : null,
    );
    if (mode === 'defesa') {
      const dice = r.total - r.bonus;
      put(out, h('div', { class: 'def-grid' },
        h('div', null, h('b', null, String(dice + der.esquiva + r.bonus)), h('span', null, 'Esquiva')),
        h('div', null, h('b', null, String(dice + der.bloqueio + r.bonus)), h('span', null, 'Bloqueio')),
        h('div', null, h('b', null, String(dice + der.contra + r.bonus)), h('span', null, 'Contra-Ataque'))));
      if (!locked) out.appendChild(h('button', { class: 'btn', onclick: () => { locked = true; opts.onDefense && opts.onDefense({ dice: dice + r.bonus, esquiva: dice + der.esquiva + r.bonus, bloqueio: dice + der.bloqueio + r.bonus, contra: dice + der.contra + r.bonus, ts: Date.now() }); toast('Defesa fixa enviada ao Mestre.'); render(); } }, icon('shield'), 'Fixar até meu turno'));
    } else if (!locked) {
      const more = h('div', { class: 'row wrap' });
      for (const t of TIERS) if ((reserve[t] || 0) > 0) more.appendChild(h('button', {
        class: 'btn ghost small', onclick: () => {
          const v = d(SIDES[t]); r.extraRolls.push({ t, v }); r.total += v; reserve[t] -= 1;
          opts.onSpend && opts.onSpend(t, 1); showResult(tray, out, false);
        },
      }, `+1 ${t.toUpperCase()}`));
      put(out, h('p', { class: 'f-label' }, 'Enquanto o Mestre não disser se acertou, você pode somar dados da reserva.'), more,
        h('button', { class: 'btn', onclick: () => { locked = true; showResult(tray, out, false); } }, 'O Mestre revelou: travar'));
    } else out.appendChild(h('p', { class: 'note' }, 'Número travado.'));
    if (!redraw && opts.broadcast) opts.broadcast({ kind: mode, label: r.label, total: r.total, base: r.base, crit: r.critKind, da });
  }

  function renderLuck() {
    const sorte = sh.sorte;
    body.appendChild(h('p', { class: 'muted' }, `Sua Sorte é ${sorte}. Abaixo dela é sorte; acima, azar. Quanto mais longe, maior o efeito.`));
    const tray = h('div', { class: 'tray' });
    const out = h('div', { class: 'roll-out' });
    const go = h('button', { class: 'btn primary big', onclick: async () => {
      const tens = d(10) - 1, units = d(10) - 1;
      const v = tens * 10 + units || 100;
      await tumble(tray, 'd10', [tens, units]);
      clear(out);
      const L = luck(sorte, v);
      put(out, 
        h('div', { class: 'total ' + (L.good === true ? 'critico' : L.good === false ? 'erro' : '') }, h('span', { class: 'total-n' }, String(v)), h('span', null, `${L.label} · margem ${L.margin}`)),
        h('p', null, L.effect));
      opts.broadcast && opts.broadcast({ kind: 'sorte', label: 'Sorte', total: v, verdict: L.label, da: 'd100' });
    } }, icon('sorte', 22), 'Rolar D100');
    put(body, tray, out, go);
  }

  render();
  return s;
}
