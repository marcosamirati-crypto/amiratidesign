// Cartografia provisória. Não existe mapa original na lore [Bíblia §11]:
// posições são esquemáticas, escolhidas pelo Mestre. A Bruma só é desenhada
// para quem está fora dela [RS p.3, SD p.4].
import { esc } from './ui.js';
import { portraitSVG } from './portrait.js';

export const W = 1000, H = 700;
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function insideZone(zone, pos) {
  if (!zone || !pos) return null;
  const d = dist(zone, pos);
  if (d <= (zone.rZ || 0)) return 'zona';
  if (d <= (zone.rB || 0)) return 'bruma';
  return null;
}

let n = 0;
export function renderMap(host, o) {
  const id = 'm' + (++n);
  const places = o.places || {};
  const zones = o.zones || {};
  const links = o.links || [];
  const viewerPos = o.viewerPlaceId && places[o.viewerPlaceId];
  const master = !!o.master;
  // enquadra os lugares conhecidos para o mapa caber no celular
  const pts = Object.values(places).map(p => [p.x, p.y, 0]).concat(Object.values(zones).map(z => [z.x, z.y, z.rB || 0]));
  let vb = [0, 0, W, H];
  if (pts.length && o.fit !== false) {
    const pad = master ? 160 : 110, minW = master ? 560 : 380;
    let x0 = Math.min(...pts.map(p => p[0] - p[2])) - pad, x1 = Math.max(...pts.map(p => p[0] + p[2])) + pad;
    let y0 = Math.min(...pts.map(p => p[1] - p[2])) - pad, y1 = Math.max(...pts.map(p => p[1] + p[2])) + pad;
    let w = Math.max(minW, x1 - x0), hh = Math.max(minW * 0.7, y1 - y0);
    if (w / hh > W / H) hh = w * H / W; else w = hh * W / H;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    vb = [cx - w / 2, cy - hh / 2, w, hh].map(v => Math.round(v));
  }
  let s = `<svg viewBox="${vb.join(' ')}" class="map-svg" role="img" aria-label="Mapa provisório">
<defs>
<pattern id="${id}g" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="currentColor" stroke-opacity=".06"/></pattern>
<pattern id="${id}G" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="currentColor" stroke-opacity=".12"/></pattern>
<radialGradient id="${id}b"><stop offset="0" stop-color="#D7CCF6" stop-opacity=".55"/><stop offset=".6" stop-color="#D7CCF6" stop-opacity=".32"/><stop offset="1" stop-color="#EEE7D8" stop-opacity="0"/></radialGradient>
</defs>
<rect x="${vb[0] - 100}" y="${vb[1] - 100}" width="${vb[2] + 200}" height="${vb[3] + 200}" fill="url(#${id}g)"/><rect x="${vb[0] - 100}" y="${vb[1] - 100}" width="${vb[2] + 200}" height="${vb[3] + 200}" fill="url(#${id}G)"/>`;

  // zonas de caos
  for (const [zid, z] of Object.entries(zones)) {
    const inside = viewerPos ? insideZone(z, viewerPos) : null;
    if (!master && inside) continue; // por dentro a Bruma é imperceptível
    s += `<g class="zone" data-zone="${esc(zid)}">
<circle cx="${z.x}" cy="${z.y}" r="${z.rB}" fill="url(#${id}b)"/>
<circle cx="${z.x}" cy="${z.y}" r="${z.rB}" fill="none" stroke="#D7CCF6" stroke-opacity=".35" stroke-dasharray="2 9"/>`;
    if (master || o.showZona) {
      let seed = (z.x * 13 + z.y * 7) | 0;
      const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
      for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * z.rZ; s += `<circle cx="${(z.x + Math.cos(a) * r).toFixed(1)}" cy="${(z.y + Math.sin(a) * r).toFixed(1)}" r="1.6" fill="#B9A3F2" opacity="${master ? 0.7 : 0.25}"/>`; }
      if (master) s += `<circle cx="${z.x}" cy="${z.y}" r="${z.rZ}" fill="none" stroke="#9B7FE6" stroke-opacity=".6" stroke-dasharray="1 5"/>
<path d="M${z.x} ${z.y}m-7 0a7 7 0 1 0 14 0a3.5 3.5 0 1 0-7 0" fill="none" stroke="#9B7FE6" stroke-width="2.2"/>
<text x="${z.x}" y="${z.y - z.rB - 8}" class="m-zone">${esc(z.label || 'Bruma caótica')}${z.seen ? '' : ' · não avistada'}</text>`;
    }
    s += '</g>';
  }
  // caminhos
  for (const l of links) {
    const a = places[l.a], b = places[l.b];
    if (a && b) s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="m-link"/>`;
  }
  // trilhas percorridas (Mestre)
  for (const t of o.trails || []) {
    const pts = (t.ids || []).map(i => places[i]).filter(Boolean);
    if (pts.length > 1) s += `<polyline points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" class="m-trail"/>`;
  }
  // locais
  for (const [pid, p] of Object.entries(places)) {
    const hid = master && !p.known;
    s += `<g class="place${hid ? ' hidden' : ''}${o.selected === pid ? ' sel' : ''}" data-place="${esc(pid)}" tabindex="0" role="button" aria-label="${esc(p.name)}">
<circle cx="${p.x}" cy="${p.y}" r="22" fill="transparent"/>
<path d="M${p.x} ${p.y - 14}l9 13h-18z" class="m-mark"/><path d="M${p.x} ${p.y - 1}v11" class="m-stake"/>
<text x="${p.x}" y="${p.y + 28}" class="m-label">${esc(p.name)}${hid ? ' (oculto)' : ''}</text></g>`;
  }
  // fichas no mapa
  const byPlace = {};
  for (const t of o.tokens || []) if (t.placeId && places[t.placeId]) (byPlace[t.placeId] = byPlace[t.placeId] || []).push(t);
  for (const [pid, list] of Object.entries(byPlace)) {
    const p = places[pid];
    list.forEach((t, i) => {
      const x = p.x + 16 + i * 22, y = p.y - 46;
      s += portraitSVG(t.portrait, { level: t.level }).replace('<svg viewBox', `<svg x="${x}" y="${y}" width="32" height="32" viewBox`).replace('role="img" aria-label="Retrato de campo"', `role="img" aria-label="${esc(t.name)}"`);
    });
  }
  s += '</svg>';
  host.innerHTML = s;
  const svg = host.querySelector('svg');

  const toWorld = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 }; };
  let drag = null;
  svg.addEventListener('pointerdown', e => {
    const g = e.target.closest('[data-place]');
    if (g && o.editable) { drag = { id: g.dataset.place, g, moved: false, start: toWorld(e) }; svg.setPointerCapture(e.pointerId); }
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const w = toWorld(e);
    if (!drag.moved && Math.hypot(w.x - drag.start.x, w.y - drag.start.y) < 8) return;
    drag.moved = true;
    drag.g.setAttribute('transform', `translate(${w.x - places[drag.id].x} ${w.y - places[drag.id].y})`);
  });
  svg.addEventListener('pointerup', e => {
    if (drag) {
      const w = toWorld(e);
      const d0 = drag; drag = null;
      if (d0.moved) { o.onMovePlace && o.onMovePlace(d0.id, Math.round(Math.max(20, Math.min(W - 20, w.x))), Math.round(Math.max(40, Math.min(H - 20, w.y)))); return; }
      o.onTapPlace && o.onTapPlace(d0.id); return;
    }
    const g = e.target.closest('[data-place]');
    if (g) return o.onTapPlace && o.onTapPlace(g.dataset.place);
    const z = e.target.closest('[data-zone]');
    if (z && o.onTapZone) return o.onTapZone(z.dataset.zone);
    if (o.onTapEmpty) { const w = toWorld(e); o.onTapEmpty(Math.round(w.x), Math.round(w.y)); }
  });
  svg.addEventListener('keydown', e => { const g = e.target.closest('[data-place]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); o.onTapPlace && o.onTapPlace(g.dataset.place); } });
  return svg;
}
