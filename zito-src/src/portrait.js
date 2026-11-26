// Retrato de campo (PROPOSTA P4). Miniatura humana desenhada a partir das
// escolhas do jogador. Só traços humanos genéricos: a lore documenta apenas
// a raça Humano. Moldura = face de um dado de marfim; o grid de 1 m ao fundo.

export const SKIN = ['#F2D5BF', '#DDAE8C', '#B98361', '#8E5B3C', '#65412B', '#40291C'];
export const HAIR_COLOR = ['#17110E', '#3A2517', '#6B4226', '#A9773F', '#C8C1B4', '#7B3022'];
export const HAIR = ['raspado', 'curto', 'crespo', 'longo', 'preso', 'tranças'];
export const BUILD = ['esguio', 'médio', 'robusto'];
export const MARK = ['nenhuma', 'cicatriz', 'pintura'];
export const BEARD = ['nenhuma', 'curta', 'cheia'];
export const CLOTH = ['#5B4A3A', '#3E4A3C', '#4A3F52', '#6A3B2E', '#2F3A44'];

export const defaultPortrait = () => ({ skin: 3, hair: 2, hairColor: 0, build: 1, mark: 0, beard: 0, cloth: 0 });

const ix = (v, arr) => { const n = Math.round(+v); return Number.isFinite(n) && n >= 0 && n < arr.length ? n : 0; };

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

let uid = 0;
export function portraitSVG(raw = {}, { level = 1, corrupt = 0, ring = false } = {}) {
  const p = {
    skin: SKIN[ix(raw.skin, SKIN)], hair: HAIR[ix(raw.hair, HAIR)], hc: HAIR_COLOR[ix(raw.hairColor, HAIR_COLOR)],
    build: ix(raw.build, BUILD), mark: MARK[ix(raw.mark, MARK)], beard: BEARD[ix(raw.beard, BEARD)], cloth: CLOTH[ix(raw.cloth, CLOTH)],
  };
  const id = 'pt' + (++uid);
  const skinDk = shade(p.skin, -0.22), skinLt = shade(p.skin, 0.12);
  const hcLt = shade(p.hc, 0.18);
  const sw = [17, 21, 25][p.build]; // meia largura dos ombros
  const neck = [4.2, 5, 6][p.build];
  const lv = Math.max(1, Math.min(6, Math.round(+level) || 1));
  const pips = { 1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[28, 28], [50, 50], [72, 72]], 4: [[30, 30], [70, 30], [30, 70], [70, 70]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[30, 26], [70, 26], [30, 50], [70, 50], [30, 74], [70, 74]] }[lv];
  const c = Math.max(0, Math.min(1, +corrupt || 0));

  let hairBack = '', hairFront = '';
  const hc = p.hc;
  switch (p.hair) {
    case 'curto':
      hairFront = `<path d="M37 41c0-10 6-16 13-16s13 6 13 16c-3-4-7-6-13-6s-10 2-13 6z" fill="${hc}"/>`; break;
    case 'crespo':
      hairBack = `<circle cx="50" cy="35" r="17" fill="${hc}"/><circle cx="38" cy="38" r="9" fill="${hc}"/><circle cx="62" cy="38" r="9" fill="${hc}"/>`;
      hairFront = `<path d="M38 36c2-6 7-9 12-9s10 3 12 9c-4-2-8-3-12-3s-8 1-12 3z" fill="${hcLt}" opacity=".35"/>`; break;
    case 'longo':
      hairBack = `<path d="M35 40c0-12 7-17 15-17s15 5 15 17v20c0 3-3 4-5 2V47H40v15c-2 2-5 1-5-2z" fill="${hc}"/>`;
      hairFront = `<path d="M37 42c1-9 6-14 13-14s12 5 13 14c-5-5-9-7-13-7s-8 2-13 7z" fill="${hc}"/>`; break;
    case 'preso':
      hairBack = `<circle cx="50" cy="21" r="6" fill="${hc}"/>`;
      hairFront = `<path d="M37 41c0-10 6-15 13-15s13 5 13 15c-4-5-8-7-13-7s-9 2-13 7z" fill="${hc}"/>`; break;
    case 'tranças':
      hairBack = `<path d="M37 42v18M41 44v19M59 44v19M63 42v18" stroke="${hc}" stroke-width="3.4" stroke-linecap="round" fill="none"/>`;
      hairFront = `<path d="M37 41c0-10 6-15 13-15s13 5 13 15c-4-4-8-6-13-6s-9 2-13 6z" fill="${hc}"/><path d="M43 29v6M50 27v7M57 29v6" stroke="${hcLt}" stroke-width="1" opacity=".5"/>`; break;
    default: // raspado
      hairFront = `<path d="M37.5 40c1-8 6-13 12.5-13s11.5 5 12.5 13c-3-3-7-4.5-12.5-4.5S40.5 37 37.5 40z" fill="${hc}" opacity=".45"/>`;
  }
  let beard = '';
  if (p.beard === 'curta') beard = `<path d="M40.5 47c1 6 5 9.5 9.5 9.5s8.5-3.5 9.5-9.5c-2 2-5 3-9.5 3s-7.5-1-9.5-3z" fill="${hc}" opacity=".55"/>`;
  if (p.beard === 'cheia') beard = `<path d="M39.5 44c0 9 5 14 10.5 14s10.5-5 10.5-14c-2 3-5.5 5-10.5 5s-8.5-2-10.5-5z" fill="${hc}"/>`;
  let mark = '';
  if (p.mark === 'cicatriz') mark = `<path d="M55 36l4 9" stroke="${shade(p.skin, 0.35)}" stroke-width="1.4" stroke-linecap="round"/><path d="M55.6 39.2l1.8-.8M56.8 41.9l1.8-.8" stroke="${shade(p.skin, 0.35)}" stroke-width="1"/>`;
  if (p.mark === 'pintura') mark = `<path d="M39 41.5h22" stroke="#E9E2D3" stroke-width="2.6" opacity=".85"/>`;

  const mist = c > 0 ? `<radialGradient id="${id}m" cx="50%" cy="55%" r="65%"><stop offset="${(1 - c) * 70}%" stop-color="#D7CCF6" stop-opacity="0"/><stop offset="100%" stop-color="#D7CCF6" stop-opacity="${0.25 + c * 0.55}"/></radialGradient>` : '';

  return `<svg viewBox="0 0 100 100" class="portrait" role="img" aria-label="Retrato de campo">
<defs><clipPath id="${id}c"><rect x="6" y="6" width="88" height="88" rx="16"/></clipPath>
<pattern id="${id}g" width="11" height="11" patternUnits="userSpaceOnUse"><path d="M11 0H0V11" fill="none" stroke="#EEE7D8" stroke-opacity=".07" stroke-width="1"/></pattern>${mist}</defs>
<rect x="2" y="2" width="96" height="96" rx="20" fill="#EEE7D8"/>
<rect x="6" y="6" width="88" height="88" rx="16" fill="#2A221B"/>
<g clip-path="url(#${id}c)">
<rect x="6" y="6" width="88" height="88" fill="url(#${id}g)"/>
${hairBack}
<path d="M${50 - sw} 100c0-16 ${sw * 0.35} -26 ${sw} -28h${sw * 0.6}h${sw * 0.2}c${sw * 0.65} 2 ${sw} 12 ${sw} 28z" fill="${p.cloth}"/>
<path d="M50 72h${sw * 0.8}c${sw * 0.2} 1 ${sw * 0.2} 2 ${sw * 0.2} 4v24H50z" fill="#000" opacity=".18"/>
<rect x="${50 - neck}" y="52" width="${neck * 2}" height="16" fill="${skinDk}"/>
<path d="M${50 - neck - 3} 70c2 3 5 4 ${neck + 3} 4s${neck + 1}-1 ${neck + 3}-4" fill="none" stroke="${shade(p.cloth, 0.2)}" stroke-width="1.5"/>
<ellipse cx="50" cy="42" rx="12.5" ry="15" fill="${p.skin}"/>
<path d="M50 27a12.5 15 0 0 1 0 30c4-4 6-9 6-15s-2-11-6-15z" fill="${skinDk}" opacity=".55"/>
<ellipse cx="44" cy="36" rx="3.5" ry="5" fill="${skinLt}" opacity=".35"/>
<path d="M44 43.5h3M53 43.5h3" stroke="#1A120D" stroke-width="1.8" stroke-linecap="round"/>
<path d="M47.5 51.5h5" stroke="${shade(p.skin, -0.4)}" stroke-width="1.2" stroke-linecap="round"/>
${beard}${mark}${hairFront}
${c > 0 ? `<rect x="6" y="6" width="88" height="88" fill="url(#${id}m)"/>` : ''}
</g>
<g><rect x="71" y="71" width="25" height="25" rx="6" fill="#EEE7D8" stroke="#2A221B" stroke-width="1.5"/>${pips.map(([x, y]) => `<circle cx="${71 + x * 0.25}" cy="${71 + y * 0.25}" r="2" fill="#2A221B"/>`).join('')}</g>
${ring ? '<rect x="1" y="1" width="98" height="98" rx="21" fill="none" stroke="#D7CCF6" stroke-width="2" stroke-dasharray="3 4"/>' : ''}
</svg>`;
}
