// Ilustrações da página (SVG e CSS 3D, sem fotos). Todos os gráficos são demonstrativos: não há números reais.

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ---------- Vista de cima: área irrigada (transição do espaço para a superfície) ---------- */

export function Field() {
  const r = rng(23);
  const W = 1600;
  const H = 900;
  const pivots: { x: number; y: number; rad: number; tone: string; arm: number }[] = [];
  const tones = ["#1B1C21", "#22242A", "#2A2C33", "#191A1F", "#26282E"];
  for (let gy = 0; gy < 5; gy++) {
    for (let gx = 0; gx < 9; gx++) {
      if (r() < 0.14) continue;
      const rad = 62 + r() * 46;
      pivots.push({ x: 90 + gx * 180 + (r() - 0.5) * 40, y: 80 + gy * 190 + (r() - 0.5) * 40, rad, tone: tones[Math.floor(r() * tones.length)], arm: r() * 360 });
    }
  }
  const target = pivots[Math.floor(pivots.length * 0.47)];
  return (
    <svg className="mm-field" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <filter id="fld-noise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.52  0 0 0 0.09 0" />
        </filter>
        <radialGradient id="fld-vig" cx="50%" cy="50%" r="70%">
          <stop offset="0.55" stopColor="#08090D" stopOpacity="0" />
          <stop offset="1" stopColor="#08090D" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="#111216" />
      <path d="M-20 610 C 300 560, 520 700, 820 640 S 1300 520, 1640 590" stroke="#1E2025" strokeWidth="14" fill="none" />
      <path d="M560 -20 L 640 920" stroke="#1C1D22" strokeWidth="5" fill="none" />
      <path d="M1180 -20 C 1150 300, 1240 600, 1190 920" stroke="#1C1D22" strokeWidth="4" fill="none" />
      {pivots.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={p.rad} fill={p.tone} />
          <circle cx={p.x} cy={p.y} r={p.rad * 0.66} fill="none" stroke="#08090D" strokeOpacity="0.35" />
          <circle cx={p.x} cy={p.y} r={p.rad * 0.33} fill="none" stroke="#08090D" strokeOpacity="0.3" />
          <line x1={p.x} y1={p.y} x2={p.x + Math.cos((p.arm * Math.PI) / 180) * p.rad} y2={p.y + Math.sin((p.arm * Math.PI) / 180) * p.rad} stroke="#777980" strokeOpacity="0.35" strokeWidth="1.5" />
        </g>
      ))}
      <rect width={W} height={H} filter="url(#fld-noise)" />
      <g className="fld-target">
        <circle cx={target.x} cy={target.y} r={target.rad + 10} fill="none" stroke="#CB2957" strokeWidth="2" />
        {[0, 90, 180, 270].map((a) => (
          <line key={a} x1={target.x + Math.cos((a * Math.PI) / 180) * (target.rad + 18)} y1={target.y + Math.sin((a * Math.PI) / 180) * (target.rad + 18)} x2={target.x + Math.cos((a * Math.PI) / 180) * (target.rad + 40)} y2={target.y + Math.sin((a * Math.PI) / 180) * (target.rad + 40)} stroke="#CB2957" strokeWidth="2" />
        ))}
        <circle cx={target.x} cy={target.y} r="4" fill="#CB2957" />
      </g>
      <rect width={W} height={H} fill="url(#fld-vig)" />
    </svg>
  );
}

/* ---------- Problema: três motivos visuais ---------- */

export function ProblemArt({ i }: { i: number }) {
  if (i === 0) {
    // irrigar no escuro: grade de pontos, metade "molhada" no lugar errado
    const r = rng(5);
    const dots = [];
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 12; x++) {
        const wet = r() < 0.5;
        dots.push(<circle key={`${x}-${y}`} cx={14 + x * 22} cy={14 + y * 22} r={wet ? 5 : 2} fill={wet ? "#777980" : "#22242A"} style={{ transitionDelay: `${(x + y) * 25}ms` }} />);
      }
    return (
      <svg className="mm-pa" viewBox="0 0 270 160" aria-hidden="true">
        {dots}
      </svg>
    );
  }
  if (i === 1) {
    // chuva fora de hora: calendário fixo x chuva real deslocada
    return (
      <svg className="mm-pa" viewBox="0 0 270 160" aria-hidden="true">
        {Array.from({ length: 12 }, (_, k) => (
          <rect key={k} x={8 + k * 21.5} y={18} width={15} height={15} rx={2} fill={k === 3 ? "#C8C9CE" : "#22242A"} />
        ))}
        <path className="pa-line" d="M8 130 C 40 128, 60 126, 90 118 S 140 60, 170 58 S 230 120, 262 128" fill="none" stroke="#777980" strokeWidth="2" pathLength={1} />
        <line x1="78" y1="40" x2="78" y2="150" stroke="#C8C9CE" strokeDasharray="2 5" />
        <line x1="170" y1="40" x2="170" y2="150" stroke="#CB2957" strokeDasharray="2 5" />
      </svg>
    );
  }
  // água que acaba sem aviso: nível descendo
  return (
    <svg className="mm-pa" viewBox="0 0 270 160" aria-hidden="true">
      <path d="M20 30 L 50 140 L 220 140 L 250 30" fill="none" stroke="#22242A" strokeWidth="2" />
      <clipPath id="pa-basin">
        <path d="M20 30 L 50 140 L 220 140 L 250 30 Z" />
      </clipPath>
      <rect className="pa-water" x="0" y="40" width="270" height="120" fill="#22242A" clipPath="url(#pa-basin)" />
      <line x1="8" y1="40" x2="262" y2="40" stroke="#777980" strokeDasharray="2 5" />
    </svg>
  );
}

/* ---------- Medidas: três instrumentos ---------- */

export function Gauge() {
  const r = rng(9);
  const cells = Array.from({ length: 40 }, () => r());
  const shade = (v: number) => (v > 0.75 ? "#C8C9CE" : v > 0.5 ? "#777980" : v > 0.25 ? "#3A3C43" : "#22242A");
  return (
    <svg className="mm-inst" viewBox="0 0 520 360" aria-hidden="true">
      <g transform="translate(150 180)">
        <circle r="110" fill="none" stroke="#22242A" strokeWidth="14" />
        <circle className="g-arc" r="110" fill="none" stroke="#F4F4F5" strokeWidth="14" strokeLinecap="round" pathLength={100} transform="rotate(-90)" />
        <circle r="110" fill="none" stroke="#CB2957" strokeWidth="14" pathLength={100} strokeDasharray="0.6 99.4" strokeDashoffset="-38" transform="rotate(-90)" />
        <text y="5" textAnchor="middle" className="i-small">Umidade do solo</text>
      </g>
      <g transform="translate(320 92)">
        {cells.map((v, k) => (
          <rect key={k} className="g-cell" x={(k % 5) * 34} y={Math.floor(k / 5) * 22} width={30} height={18} rx={3} fill={shade(v)} style={{ transitionDelay: `${k * 18}ms` }} />
        ))}
        <text y="196" className="i-small">Por zona da área</text>
      </g>
      <text x="20" y="344" className="i-note">Ilustrativo</text>
    </svg>
  );
}

export function ClimateChart() {
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const bars = [0.55, 0.8, 0.95, 0.75, 0.4, 0.2, 0.1, 0.05, 0.05, 0.08, 0.15, 0.3];
  return (
    <svg className="mm-inst" viewBox="0 0 520 360" aria-hidden="true">
      <rect x="88" y="40" width="112" height="250" fill="#CB2957" fillOpacity="0.08" />
      <line x1="88" y1="40" x2="88" y2="290" stroke="#CB2957" strokeWidth="1.5" />
      <line x1="200" y1="40" x2="200" y2="290" stroke="#CB2957" strokeWidth="1.5" />
      <text x="94" y="58" className="i-small i-accent">Janela de plantio</text>
      {bars.map((b, k) => (
        <rect key={k} className="c-bar" x={30 + k * 39} y={290 - b * 190} width="18" height={b * 190} rx="2" fill="#22242A" style={{ transitionDelay: `${k * 40}ms` }} />
      ))}
      <path className="c-line" d="M39 200 C 80 150, 120 120, 160 130 S 240 210, 300 230 S 420 220, 468 190" fill="none" stroke="#F4F4F5" strokeWidth="2.5" pathLength={1} />
      <line x1="20" y1="290" x2="500" y2="290" stroke="#22242A" />
      {months.map((m, k) => (
        <text key={k} x={39 + k * 39} y="314" textAnchor="middle" className="i-small">
          {m}
        </text>
      ))}
      <text x="20" y="344" className="i-note">Ilustrativo</text>
    </svg>
  );
}

export function Reservoir() {
  const pts = [0.9, 0.86, 0.84, 0.78, 0.74, 0.7, 0.62, 0.58, 0.55, 0.5];
  const path = pts.map((v, k) => `${k ? "L" : "M"}${300 + k * 21} ${70 + (1 - v) * 200}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg className="mm-inst" viewBox="0 0 520 360" aria-hidden="true">
      <clipPath id="rv-basin">
        <path d="M30 70 L 70 280 L 230 280 L 270 70 Z" />
      </clipPath>
      <path d="M30 70 L 70 280 L 230 280 L 270 70" fill="none" stroke="#777980" strokeWidth="2" />
      <g clipPath="url(#rv-basin)">
        <rect className="r-water" x="0" y="70" width="300" height="230" fill="#C8C9CE" fillOpacity="0.18" />
        <line className="r-surface" x1="0" y1="70" x2="300" y2="70" stroke="#F4F4F5" strokeWidth="2" />
      </g>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1="16" y1={70 + t * 210} x2="26" y2={70 + t * 210} stroke="#777980" />
      ))}
      <path className="r-trend" d={path} fill="none" stroke="#F4F4F5" strokeWidth="2.5" pathLength={1} />
      <circle className="r-dot" cx={300 + (pts.length - 1) * 21} cy={70 + (1 - last) * 200} r="6" fill="#CB2957" />
      <text x="300" y="314" className="i-small">Nível ao longo da safra</text>
      <text x="20" y="344" className="i-note">Ilustrativo</text>
    </svg>
  );
}

/* ---------- Como funciona: palco com três cenas ---------- */

export function HowStage() {
  return (
    <div className="mm-stage-inner">
      {/* 1. Montagem: mapa com curvas de nível e a área desenhada */}
      <svg className="mm-scene" data-i="0" viewBox="0 0 600 600" aria-hidden="true">
        {Array.from({ length: 9 }, (_, k) => (
          <ellipse key={k} cx={300 + k * 6} cy={310 - k * 4} rx={60 + k * 32} ry={40 + k * 24} fill="none" stroke="#22242A" transform={`rotate(${-14 + k * 2} 300 300)`} />
        ))}
        <path className="s-area" d="M210 250 L 330 205 L 420 270 L 395 380 L 250 395 Z" fill="#CB2957" fillOpacity="0.07" stroke="#CB2957" strokeWidth="2" pathLength={1} />
        {[
          [210, 250],
          [330, 205],
          [420, 270],
          [395, 380],
          [250, 395],
        ].map(([x, y]) => (
          <rect key={`${x}`} x={x - 4} y={y - 4} width="8" height="8" fill="#08090D" stroke="#F4F4F5" strokeWidth="1.5" />
        ))}
        <text x="300" y="470" textAnchor="middle" className="i-small">Sua área, mapeada</text>
      </svg>

      {/* 2. Monitoramento: órbita sobre a curvatura da Terra */}
      <svg className="mm-scene" data-i="1" viewBox="0 0 600 600" aria-hidden="true">
        <path d="M-40 520 Q 300 380 640 520" fill="none" stroke="#C8C9CE" strokeOpacity="0.5" strokeWidth="1.5" />
        <path d="M-40 520 Q 300 380 640 520 L 640 640 L -40 640 Z" fill="#111216" />
        <path id="orbit" d="M20 330 Q 300 120 580 330" fill="none" stroke="#777980" strokeDasharray="3 7" />
        <g className="s-sat">
          <animateMotion dur="8s" repeatCount="indefinite" keyPoints="0.15;0.85" keyTimes="0;1" calcMode="linear">
            <mpath href="#orbit" />
          </animateMotion>
          <path d="M0 0 L -34 140 L 34 140 Z" fill="#CB2957" fillOpacity="0.12" />
          <rect x="-7" y="-14" width="14" height="28" rx="1.5" fill="#F4F4F5" />
        </g>
        <circle cx="300" cy="452" r="5" fill="#CB2957" />
        <text x="300" y="560" textAnchor="middle" className="i-small">Passagem do nanossatélite</text>
      </svg>

      {/* 3. Relatório */}
      <svg className="mm-scene" data-i="2" viewBox="0 0 600 600" aria-hidden="true">
        <rect x="150" y="90" width="300" height="400" rx="14" fill="#111216" stroke="#22242A" />
        <rect x="180" y="124" width="120" height="10" rx="5" fill="#C8C9CE" />
        <rect x="180" y="146" width="70" height="8" rx="4" fill="#3A3C43" />
        <path className="s-line" d="M180 260 C 220 230, 250 250, 290 220 S 360 200, 420 180" fill="none" stroke="#F4F4F5" strokeWidth="2.5" pathLength={1} />
        <line x1="180" y1="280" x2="420" y2="280" stroke="#22242A" />
        {["Umidade", "Clima", "Nível de água"].map((t, k) => (
          <g key={t} transform={`translate(180 ${320 + k * 46})`}>
            <text y="12" className="i-small">
              {t}
            </text>
            <rect x="120" y="2" width="120" height="10" rx="5" fill="#22242A" />
            <rect className="s-bar" x="120" y="2" width={[86, 64, 40][k]} height="10" rx="5" fill={k === 2 ? "#CB2957" : "#C8C9CE"} />
          </g>
        ))}
        <text x="300" y="530" textAnchor="middle" className="i-small">Relatório mensal · ilustrativo</text>
      </svg>
    </div>
  );
}

/* ---------- Nanossatélite: volume esquemático 4U em CSS 3D ---------- */

export function Cubesat() {
  const sides = ["front", "back", "left", "right"];
  return (
    <div className="mm-cube-wrap" aria-hidden="true">
      <div className="mm-cube">
        {sides.map((s) => (
          <div key={s} className={`mm-face mm-face--side mm-face--${s}`}>
            <i />
            <i />
            <i />
          </div>
        ))}
        <div className="mm-face mm-face--cap mm-face--top" />
        <div className="mm-face mm-face--cap mm-face--bottom" />
      </div>
      <div className="mm-cube-shadow" />
    </div>
  );
}
