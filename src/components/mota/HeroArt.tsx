// Ilustração do hero da Mota Macedo: nanossatélite 4U sobre a Terra, lendo pivôs de irrigação.
// Desenho original em SVG (não é foto do produto). Sem dependências.

/** Gerador determinístico: o mesmo desenho no servidor e no navegador. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const CX = 600;
const CY = 1250;
const R = 900;
const FIELD = ["#1d4a38", "#27624a", "#2f7350", "#8a6f2c", "#b8913a", "#1a3d33"];

function fields() {
  const r = rng(7);
  const out: { x: number; y: number; rx: number; ry: number; fill: string; slice: number }[] = [];
  for (let row = 0; row < 9; row++) {
    const y = 392 + row * 36 + r() * 8;
    const depth = (y - 350) / 350;
    const rx = 22 + depth * 30;
    const ry = 5 + depth * 17;
    const half = Math.sqrt(R * R - (CY - y) * (CY - y)) - rx - 14;
    for (let x = CX - half + r() * 40; x < CX + half; x += rx * 2 + 10 + r() * 46) {
      if (r() < 0.18) continue;
      out.push({ x, y: y + (r() - 0.5) * 8, rx, ry, fill: FIELD[Math.floor(r() * FIELD.length)], slice: r() });
    }
  }
  return out;
}

const stars = (() => {
  const r = rng(21);
  return Array.from({ length: 70 }, () => ({ x: r() * 1200, y: r() * 420, s: 0.5 + r() * 1.3, o: 0.25 + r() * 0.6 }));
})();

export default function HeroArt() {
  const f = fields();
  const target = { x: 668, y: 506, rx: 40, ry: 13 };
  return (
    <svg className="mm-art" viewBox="0 0 1200 700" role="img" aria-labelledby="mm-art-t" preserveAspectRatio="xMidYMax slice">
      <title id="mm-art-t">Ilustração: nanossatélite em órbita medindo áreas irrigadas no solo.</title>
      <defs>
        <radialGradient id="mm-earth" cx="62%" cy="8%" r="75%">
          <stop offset="0" stopColor="#1b3a4f" />
          <stop offset="0.45" stopColor="#102638" />
          <stop offset="1" stopColor="#070c18" />
        </radialGradient>
        <radialGradient id="mm-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffe2a3" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#e9b44c" stopOpacity="0.5" />
          <stop offset="1" stopColor="#e9b44c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mm-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9b44c" stopOpacity="0.5" />
          <stop offset="1" stopColor="#e9b44c" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="mm-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#27468f" />
          <stop offset="1" stopColor="#0f1e4a" />
        </linearGradient>
        <linearGradient id="mm-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1d38c" />
          <stop offset="1" stopColor="#a87b25" />
        </linearGradient>
        <linearGradient id="mm-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#080d1a" stopOpacity="0" />
          <stop offset="1" stopColor="#080d1a" stopOpacity="0.85" />
        </linearGradient>
        <clipPath id="mm-clip">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} />
      ))}

      {/* nascer do sol no limbo + atmosfera */}
      <circle cx="1010" cy="452" r="230" fill="url(#mm-sun)" />
      <circle cx={CX} cy={CY} r={R + 7} fill="none" stroke="#7fc4ff" strokeOpacity="0.16" strokeWidth="14" />
      <circle cx={CX} cy={CY} r={R} fill="url(#mm-earth)" />
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#bfe3ff" strokeOpacity="0.5" strokeWidth="1.5" />

      {/* lavouras: pivôs de irrigação vistos de cima */}
      <g clipPath="url(#mm-clip)">
        {f.map((p, i) => (
          <g key={i} opacity={0.55 + ((p.y - 392) / 330) * 0.4}>
            <ellipse cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={p.fill} />
            {p.slice > 0.55 && (
              <path
                d={`M${p.x} ${p.y} L${p.x + p.rx} ${p.y} A${p.rx} ${p.ry} 0 0 0 ${p.x} ${p.y - p.ry} Z`}
                fill="#0b1626"
                opacity="0.45"
              />
            )}
          </g>
        ))}
        <rect x="0" y="380" width="1200" height="320" fill="url(#mm-shade)" />
      </g>

      {/* faixa de leitura do satélite até a área medida */}
      <path d={`M352 212 L${target.x - target.rx} ${target.y} L${target.x + target.rx} ${target.y} Z`} fill="url(#mm-beam)" />
      <ellipse cx={target.x} cy={target.y} rx={target.rx} ry={target.ry} fill="#2f7350" />
      <ellipse className="mm-ping" cx={target.x} cy={target.y} rx={target.rx + 6} ry={target.ry + 3} fill="none" stroke="#e9b44c" strokeWidth="2" />

      {/* nanossatélite 4U */}
      <g transform="translate(350 170) rotate(-14)">
        {[-1, 1].map((side) => (
          <g key={side} transform={`translate(${side === -1 ? -236 : 46} -34)`}>
            <rect width="190" height="68" rx="3" fill="url(#mm-panel)" stroke="#8fb0ff" strokeOpacity="0.55" />
            {[1, 2, 3, 4, 5].map((k) => (
              <line key={k} x1={k * 31.6} y1="0" x2={k * 31.6} y2="68" stroke="#8fb0ff" strokeOpacity="0.3" />
            ))}
            <line x1="0" y1="34" x2="190" y2="34" stroke="#8fb0ff" strokeOpacity="0.3" />
          </g>
        ))}
        <rect x="-46" y="-4" width="92" height="8" fill="#6b7896" />
        <rect x="-36" y="-66" width="72" height="132" rx="4" fill="url(#mm-body)" stroke="#fff3cf" strokeOpacity="0.6" />
        {[-33, 0, 33].map((y) => (
          <line key={y} x1="-36" y1={y} x2="36" y2={y} stroke="#5d4310" strokeOpacity="0.55" />
        ))}
        <circle cx="0" cy="49" r="9" fill="#0f1629" stroke="#fff3cf" strokeOpacity="0.5" />
        <line x1="0" y1="-66" x2="14" y2="-104" stroke="#cdd6ea" strokeWidth="1.5" />
        <circle cx="14" cy="-104" r="2.5" fill="#cdd6ea" />
      </g>
    </svg>
  );
}
