// A Bruma caótica: névoa roxa e meio esbranquiçada [RS p.3, SD p.4].
// Desenhada só onde a lore permite: para quem está de fora.
// A Zona volátil tem partículas "visíveis mas bem difíceis de notar".

const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function sprite(r, rgb, a) {
  const c = document.createElement('canvas'); c.width = c.height = r * 2;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.55, `rgba(${rgb},${a * 0.45})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
  return c;
}

export function mountMist(canvas, { blobs = 12, particles = 36, strength = 1, particleAlpha = 0.5 } = {}) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, raf = 0, alive = true, seed = 7;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const mistA = sprite(160, '215,204,246', 0.33 * strength);
  const mistB = sprite(160, '238,231,216', 0.16 * strength);
  const dot = sprite(6, '200,180,255', particleAlpha);
  let B = [], D = [];
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    B = Array.from({ length: blobs }, (_, i) => ({ x: rnd() * W, y: H * (0.25 + rnd() * 0.85), s: 0.7 + rnd() * 1.6, v: 0.04 + rnd() * 0.12, k: i % 3 === 0 ? mistB : mistA, p: rnd() * 6.28 }));
    D = Array.from({ length: particles }, () => ({ x: rnd() * W, y: rnd() * H, v: 0.05 + rnd() * 0.18, p: rnd() * 6.28 }));
  };
  const draw = t => {
    ctx.clearRect(0, 0, W, H);
    for (const b of B) {
      const x = (b.x + t * b.v * 0.02) % (W + 320) - 160;
      const y = b.y + Math.sin(t * 0.00025 + b.p) * 14;
      const s = 320 * b.s;
      ctx.drawImage(b.k, x - s / 2, y - s / 2, s, s * 0.62);
    }
    for (const p of D) {
      const x = (p.x + t * p.v * 0.01) % W;
      const y = (p.y - t * p.v * 0.006 + H) % H;
      ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.0008 + p.p));
      ctx.drawImage(dot, x - 3, y - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
  };
  const loop = t => { if (!alive) return; if (!document.hidden) draw(t); raf = requestAnimationFrame(loop); };
  const ro = new ResizeObserver(() => { fit(); if (reduce()) draw(4000); });
  ro.observe(canvas);
  fit();
  if (reduce()) draw(4000); else raf = requestAnimationFrame(loop);
  return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); };
}
