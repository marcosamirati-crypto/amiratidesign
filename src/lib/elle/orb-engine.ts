// Motor do orbe da Elle: desenho procedural em canvas 2D (sem bibliotecas, sem WebGL).
//
// Por que não se repete: a forma é a soma de várias ondas com frequências "incomensuráveis"
// (nunca voltam ao mesmo ponto ao mesmo tempo), mais tremores aleatórios que decaem como uma mola.
// Os estados (idle, hover, pressed, thinking, found, error) só mudam as METAS dos parâmetros;
// o motor suaviza a transição, então nada dá "salto".

export type OrbState = "idle" | "hover" | "pressed" | "thinking" | "found" | "error";
export type OrbTheme = "light" | "dark";

interface Params {
  energy: number; // 0–1: velocidade e brilho do movimento interno
  deform: number; // quanto a silhueta ondula
  speed: number; // multiplicador do tempo
  glow: number; // 0–1: halo e brilho
  scale: number;
  dim: number; // 0–1: apagado (erro)
  think: number; // 0–1: partículas
}

const TARGETS: Record<OrbState, Params> = {
  idle: { energy: 0.42, deform: 0.032, speed: 1.0, glow: 0.6, scale: 1, dim: 0, think: 0 },
  hover: { energy: 0.66, deform: 0.05, speed: 1.3, glow: 0.8, scale: 1.045, dim: 0, think: 0 },
  pressed: { energy: 0.95, deform: 0.018, speed: 0.55, glow: 1, scale: 0.9, dim: 0, think: 0 },
  thinking: { energy: 1, deform: 0.062, speed: 2.2, glow: 0.95, scale: 1.0, dim: 0, think: 1 },
  found: { energy: 0.22, deform: 0.022, speed: 0.6, glow: 0.65, scale: 1, dim: 0, think: 0 },
  error: { energy: 0.06, deform: 0.012, speed: 0.3, glow: 0.18, scale: 0.95, dim: 1, think: 0 },
};

/** Tempo (s) com que cada parâmetro alcança a meta. Pressionar é rápido; o resto é lento e macio. */
const TAU: Record<OrbState, number> = { idle: 0.7, hover: 0.35, pressed: 0.07, thinking: 0.8, found: 1.1, error: 1.4 };

type RGB = [number, number, number];

const PALETTE = {
  light: {
    body: ["#FFFFFF", "#F6F8FC", "#E1E7F0", "#BFC9D7", "#A2AEC0"] as const,
    glow: [214, 224, 240] as RGB,
    shadow: [34, 44, 62] as RGB,
    rim: [40, 48, 62] as RGB,
    rimAlpha: 0.22,
    mote: [64, 72, 86] as RGB,
    blobs: [
      { c: [178, 212, 247] as RGB, r: 0.66, ax: 0.38, ay: 0.3, fx: 0.23, fy: 0.31, a: 0.7 }, // gelo
      { c: [218, 198, 247] as RGB, r: 0.58, ax: 0.3, ay: 0.4, fx: 0.29, fy: 0.19, a: 0.55 }, // lilás muito pálido
      { c: [255, 255, 255] as RGB, r: 0.54, ax: 0.28, ay: 0.24, fx: 0.41, fy: 0.37, a: 0.9 }, // pérola
      { c: [88, 100, 122] as RGB, r: 0.62, ax: 0.42, ay: 0.36, fx: 0.17, fy: 0.27, a: 0.3 }, // grafite (profundidade)
      { c: [252, 224, 204] as RGB, r: 0.44, ax: 0.26, ay: 0.3, fx: 0.33, fy: 0.43, a: 0.4 }, // calor quase imperceptível
    ],
    composite: "source-over" as GlobalCompositeOperation,
  },
  dark: {
    body: ["#F6F9FD", "#CBD3DE", "#808A97", "#3C434C", "#242930"] as const,
    glow: [176, 196, 226] as RGB,
    shadow: [0, 0, 0] as RGB,
    rim: [0, 0, 0] as RGB,
    rimAlpha: 0.55,
    mote: [214, 226, 244] as RGB,
    blobs: [
      { c: [150, 190, 235] as RGB, r: 0.64, ax: 0.36, ay: 0.3, fx: 0.23, fy: 0.31, a: 0.42 },
      { c: [190, 170, 235] as RGB, r: 0.56, ax: 0.3, ay: 0.38, fx: 0.29, fy: 0.19, a: 0.32 },
      { c: [255, 255, 255] as RGB, r: 0.52, ax: 0.28, ay: 0.24, fx: 0.41, fy: 0.37, a: 0.7 },
      { c: [30, 36, 46] as RGB, r: 0.6, ax: 0.4, ay: 0.34, fx: 0.17, fy: 0.27, a: 0.45 },
      { c: [240, 205, 180] as RGB, r: 0.42, ax: 0.26, ay: 0.3, fx: 0.33, fy: 0.43, a: 0.2 },
    ],
    composite: "source-over" as GlobalCompositeOperation,
  },
} as const;

// Pesos mais parecidos entre si: a silhueta vira um círculo que respira, não um oval ou um triângulo arredondado.
const HARMONICS = [
  { k: 2, w: 0.31, a: 0.7 },
  { k: 3, w: 0.47, a: 0.65 },
  { k: 4, w: 0.61, a: 0.55 },
  { k: 5, w: 0.83, a: 0.42 },
  { k: 7, w: 1.13, a: 0.3 },
];
const A_SUM = HARMONICS.reduce((s, h) => s + h.a, 0);

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const rand = (a: number, b: number) => a + Math.random() * (b - a);

interface Ripple {
  t0: number;
  power: number;
}

export class OrbEngine {
  private ctx: CanvasRenderingContext2D;
  private p: Params = { ...TARGETS.idle };
  private state: OrbState = "idle";
  private theme: OrbTheme = "light";
  private reduced = false;

  private raf = 0;
  private running = false;
  private visible = true;
  private last = 0;
  private clock = 0; // segundos reais
  private tt = 0; // tempo do movimento (acelera/desacelera com `speed`)

  private cssSize = 0;
  private dpr = 1;
  private maxDpr = 2;
  private quality = 1; // 1 = completo, 0.6 = menos blobs
  private slowFrames = 0;

  private phases = HARMONICS.map(() => rand(0, Math.PI * 2));
  private blobPhases = Array.from({ length: 5 }, () => [rand(0, 6.28), rand(0, 6.28)] as const);
  private tw = HARMONICS.map(() => 0); // tremores (mola)
  private nextTwitch = 1.2;

  private ox = 0;
  private oy = 0; // deslocamento suavizado (px do canvas)
  private lookX = 0;
  private lookY = 0; // direção do "olhar" (−1..1)
  private pointer: { x: number; y: number } | null = null;
  private rect: { cx: number; cy: number; scale: number } | null = null;
  private rectAt = 0;

  private ripples: Ripple[] = [];
  private flash = 0; // brilho extra de curta duração (também usado no modo "movimento reduzido")
  private motes = Array.from({ length: 12 }, () => ({
    rho: rand(1.18, 1.72),
    w: rand(0.18, 0.55) * (Math.random() < 0.5 ? -1 : 1),
    ph: rand(0, 6.28),
    size: rand(0.8, 1.7),
    tw: rand(0.4, 1.3),
    tp: rand(0, 6.28),
  }));
  private noise: HTMLCanvasElement | null = null;
  private frameCost = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    /** Retorna o retângulo (em tela) da área do canvas. Usado só para o olhar/atração do cursor. */
    private getRect: () => DOMRect | null,
  ) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("canvas 2d indisponível");
    this.ctx = ctx;
    this.maxDpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = this.maxDpr;
  }

  // ───── API pública ─────
  setState(s: OrbState) {
    if (s === this.state) return;
    const was = this.state;
    this.state = s;
    if (s === "found" && was === "thinking") this.pulse(0.7);
    if (this.reduced) this.drawOnce();
  }
  setTheme(t: OrbTheme) {
    this.theme = t;
    if (!this.running || this.reduced) this.drawOnce();
  }
  setReduced(r: boolean) {
    this.reduced = r;
    if (this.running) {
      this.stop();
      this.start();
    } else this.drawOnce();
  }
  /** x,y em coordenadas da janela (clientX/Y). null = sem ponteiro. */
  setPointer(x: number | null, y: number | null) {
    this.pointer = x === null || y === null ? null : { x, y };
  }
  pulse(power = 0.5) {
    if (this.reduced) {
      this.flash = Math.min(1, this.flash + power);
      this.drawOnce();
      return;
    }
    this.ripples.push({ t0: this.clock, power });
    if (this.ripples.length > 4) this.ripples.shift();
    this.flash = Math.min(1, this.flash + power * 0.8);
  }
  resize(cssSize: number) {
    this.cssSize = cssSize;
    this.applySize();
    if (!this.running || this.reduced) this.drawOnce();
  }
  setVisible(v: boolean) {
    this.visible = v;
    if (v && this.running && !this.raf) this.loop(performance.now());
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    if (this.reduced) {
      this.drawOnce();
      this.raf = 0;
      // Movimento reduzido: deriva lentíssima (8 quadros por segundo, tempo a 12%): calma, sem tranco e sem custo.
      this.slowTimer = window.setInterval(() => this.reducedTick(), 125);
      return;
    }
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }
  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.slowTimer) window.clearInterval(this.slowTimer);
    this.slowTimer = 0;
  }
  destroy() {
    this.stop();
  }

  // ───── interno ─────
  private slowTimer = 0;

  private applySize() {
    const side = Math.max(2, Math.round(this.cssSize * this.dpr));
    const cap = 900;
    const px = Math.min(side, cap);
    if (this.canvas.width !== px) {
      this.canvas.width = px;
      this.canvas.height = px;
    }
  }

  private reducedTick() {
    if (document.hidden || !this.visible || !this.cssSize) return;
    // step() já avança o tempo a 12% da velocidade e a forma quase não deforma.
    const dt = 0.125;
    this.clock += dt;
    this.step(dt);
    this.draw();
  }

  private drawOnce() {
    if (!this.cssSize) return;
    this.step(0.5);
    this.draw();
  }

  private loop = (now: number) => {
    this.raf = 0;
    if (!this.running) return;
    if (!this.visible || document.hidden) {
      this.last = now;
      this.raf = requestAnimationFrame(this.loop);
      return;
    }
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    this.clock += dt;

    const t0 = performance.now();
    this.step(dt);
    this.draw();
    this.adapt(performance.now() - t0);

    this.raf = requestAnimationFrame(this.loop);
  };

  /** Se o aparelho for fraco, baixa a resolução e depois a qualidade, sem o usuário perceber. */
  private adapt(cost: number) {
    this.frameCost = this.frameCost * 0.92 + cost * 0.08;
    if (this.frameCost > 11) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 90) {
      this.slowFrames = 0;
      if (this.dpr > 1) {
        this.dpr = 1;
        this.applySize();
      } else if (this.quality > 0.6) this.quality = 0.6;
    }
  }

  private step(dt: number) {
    const target = TARGETS[this.state];
    const k = 1 - Math.exp(-dt / TAU[this.state]);
    const p = this.p;
    const m = this.reduced ? 0.3 : 1;
    p.energy += (target.energy * (this.reduced ? 0.5 : 1) - p.energy) * k;
    p.deform += (target.deform * m - p.deform) * k;
    p.speed += (target.speed - p.speed) * k;
    p.glow += (target.glow - p.glow) * k;
    p.scale += (target.scale - p.scale) * k;
    p.dim += (target.dim - p.dim) * k;
    p.think += ((this.reduced ? 0 : target.think) - p.think) * k;

    this.tt += dt * p.speed * (this.reduced ? 0.12 : 1);
    this.flash *= Math.exp(-dt / 0.45);

    // Tremores aleatórios: pequenas "ideias" que mexem uma ondulação por vez.
    if (!this.reduced) {
      this.nextTwitch -= dt;
      if (this.nextTwitch <= 0) {
        const i = Math.floor(Math.random() * HARMONICS.length);
        this.tw[i] += rand(0.3, 0.8) * (Math.random() < 0.5 ? -1 : 1);
        this.nextTwitch = rand(0.5, 3.0) / (0.45 + p.energy);
      }
      const decay = Math.exp(-dt / 0.55);
      for (let i = 0; i < this.tw.length; i++) this.tw[i] *= decay;
    }

    // Atração pelo cursor: poucos pixels em direção a ele, só quando está perto o bastante.
    const n = this.cssSize || 1;
    const R = n * 0.3;
    let tx = 0;
    let ty = 0;
    let lx = 0;
    let ly = 0;
    if (this.pointer && !this.reduced) {
      if (this.clock - this.rectAt > 0.12 || !this.rect) this.measure();
      if (this.rect) {
        const dx = (this.pointer.x - this.rect.cx) / this.rect.scale;
        const dy = (this.pointer.y - this.rect.cy) / this.rect.scale;
        const d = Math.hypot(dx, dy) || 1;
        const pull = (1 - smooth(R * 2.2, R * 7, d)) * (this.state === "thinking" ? 0.3 : 1);
        const reach = n * 0.034;
        tx = (dx / d) * reach * pull * smooth(0, R * 1.2, d);
        ty = (dy / d) * reach * pull * smooth(0, R * 1.2, d);
        lx = (dx / d) * pull;
        ly = (dy / d) * pull;
      }
    } else if (!this.reduced) {
      // Deriva autônoma bem pequena, para nunca parecer parada.
      tx = Math.sin(this.tt * 0.37) * n * 0.007 + Math.sin(this.tt * 0.91 + 1) * n * 0.003;
      ty = Math.cos(this.tt * 0.29) * n * 0.007 + Math.sin(this.tt * 0.77 + 2) * n * 0.003;
    }
    const mk = 1 - Math.exp(-dt / (this.state === "pressed" ? 0.06 : 0.28));
    this.ox += (tx - this.ox) * mk;
    this.oy += (ty - this.oy) * mk;
    this.lookX += (lx - this.lookX) * mk;
    this.lookY += (ly - this.lookY) * mk;
  }

  private measure() {
    const r = this.getRect();
    if (!r || !this.cssSize) return;
    this.rect = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, scale: r.width / this.cssSize };
    this.rectAt = this.clock;
  }

  private draw() {
    const { ctx, canvas, p } = this;
    const pal = PALETTE[this.theme];
    const W = canvas.width;
    const n = this.cssSize || 1;
    const s = W / n; // px do canvas por px CSS
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.clearRect(0, 0, n, n);

    const cx = n / 2;
    const cy = n / 2;
    const R = n * 0.3;
    const breath = 1 + 0.016 * Math.sin(this.tt * 0.9) + 0.009 * Math.sin(this.tt * 1.73 + 1.3) + 0.005 * Math.sin(this.tt * 3.1 + 0.4);
    const droop = p.dim * R * 0.07;
    const bx = cx + this.ox;
    const by = cy + this.oy + droop;
    const Rb = R * p.scale * breath * (1 + this.flash * 0.025);
    const energy = p.energy;
    const live = 1 - p.dim * 0.75;

    // ── sombra no chão + halo ──
    {
      const sh = ctx.createRadialGradient(bx, cy + R * 1.32 + droop, 0, bx, cy + R * 1.32 + droop, Rb * 0.95);
      const a = (this.theme === "light" ? 0.16 : 0.35) * (0.5 + p.glow * 0.5);
      sh.addColorStop(0, rgba(pal.shadow, a));
      sh.addColorStop(1, rgba(pal.shadow, 0));
      ctx.save();
      ctx.translate(bx, cy + R * 1.32 + droop);
      ctx.scale(1, 0.16);
      ctx.translate(-bx, -(cy + R * 1.32 + droop));
      ctx.fillStyle = sh;
      ctx.fillRect(bx - Rb * 1.2, cy + R * 1.32 + droop - Rb * 1.2, Rb * 2.4, Rb * 2.4);
      ctx.restore();

      const g = ctx.createRadialGradient(bx, by, Rb * 0.7, bx, by, Rb * 1.62);
      g.addColorStop(0, rgba(pal.glow, (this.theme === "light" ? 0.5 : 0.34) * p.glow * live + this.flash * 0.12));
      g.addColorStop(0.5, rgba(pal.glow, (this.theme === "light" ? 0.16 : 0.1) * p.glow * live));
      g.addColorStop(1, rgba(pal.glow, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, Rb * 1.62, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── silhueta orgânica ──
    const M = 84;
    const pts: number[] = new Array(M * 2);
    for (let i = 0; i < M; i++) {
      const th = (i / M) * Math.PI * 2;
      let wob = 0;
      for (let h = 0; h < HARMONICS.length; h++) {
        const H = HARMONICS[h];
        const amp = (H.a / A_SUM) * 1.7 * (1 + this.tw[h]);
        wob += amp * Math.sin(H.k * th + H.w * this.tt + this.phases[h] + this.tw[h] * 0.6);
      }
      const r = Rb * (1 + p.deform * wob);
      pts[i * 2] = bx + r * Math.cos(th);
      pts[i * 2 + 1] = by + r * Math.sin(th);
    }
    const body = new Path2D();
    {
      const mx = (pts[(M - 1) * 2] + pts[0]) / 2;
      const my = (pts[(M - 1) * 2 + 1] + pts[1]) / 2;
      body.moveTo(mx, my);
      for (let i = 0; i < M; i++) {
        const j = (i + 1) % M;
        body.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], (pts[i * 2] + pts[j * 2]) / 2, (pts[i * 2 + 1] + pts[j * 2 + 1]) / 2);
      }
      body.closePath();
    }

    ctx.save();
    ctx.clip(body);

    // corpo: pérola/prata com a luz deslocada na direção do cursor ("ela olha para você")
    {
      const lx = bx - Rb * 0.3 + this.lookX * Rb * 0.2;
      const ly = by - Rb * 0.34 + this.lookY * Rb * 0.2;
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, Rb * 1.4);
      const stops = [0, 0.26, 0.55, 0.82, 1];
      pal.body.forEach((c, i) => g.addColorStop(stops[i], c));
      ctx.fillStyle = g;
      ctx.fillRect(bx - Rb * 1.5, by - Rb * 1.5, Rb * 3, Rb * 3);
    }

    // luzes internas que vagam em trajetórias que nunca se alinham
    const blobs = pal.blobs;
    const count = this.quality < 1 ? 3 : blobs.length;
    ctx.globalCompositeOperation = pal.composite;
    for (let i = 0; i < count; i++) {
      const b = blobs[i];
      const ph = this.blobPhases[i];
      const k = 0.62 + energy * 0.7;
      const x = bx + Rb * b.ax * k * Math.sin(this.tt * b.fx * 2.1 + ph[0]) + this.lookX * Rb * 0.08;
      const y = by + Rb * b.ay * k * Math.sin(this.tt * b.fy * 2.1 + ph[1]) + this.lookY * Rb * 0.08;
      const rr = Rb * b.r * (1 + 0.12 * Math.sin(this.tt * (0.5 + b.fx) + ph[0]));
      const a = b.a * (0.55 + energy * 0.6) * live;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, rgba(b.c, a));
      g.addColorStop(1, rgba(b.c, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    ctx.globalCompositeOperation = "source-over";

    // volume: sombra de borda e reflexo de luz rebatida
    {
      const g = ctx.createRadialGradient(bx, by, Rb * 0.62, bx, by, Rb * 1.04);
      g.addColorStop(0, rgba(pal.rim, 0));
      g.addColorStop(1, rgba(pal.rim, pal.rimAlpha));
      ctx.fillStyle = g;
      ctx.fillRect(bx - Rb * 1.2, by - Rb * 1.2, Rb * 2.4, Rb * 2.4);

      const rx = bx + Rb * 0.46;
      const ry = by + Rb * 0.52;
      const rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, Rb * 0.5);
      rg.addColorStop(0, `rgba(255,255,255,${(this.theme === "light" ? 0.34 : 0.16) * live})`);
      rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(rx - Rb * 0.5, ry - Rb * 0.5, Rb, Rb);
    }

    // brilho principal (reage ao toque e ao olhar)
    {
      const hx = bx - Rb * 0.36 + this.lookX * Rb * 0.16;
      const hy = by - Rb * 0.42 + this.lookY * Rb * 0.16;
      const hr = Rb * (0.36 + 0.04 * Math.sin(this.tt * 0.8));
      const ha = Math.min(1, (0.62 + p.glow * 0.3 + this.flash * 0.3) * live);
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
      g.addColorStop(0, `rgba(255,255,255,${ha.toFixed(3)})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
    }

    // estado de erro: o orbe esfria e fica cinza
    if (p.dim > 0.01) {
      ctx.fillStyle = this.theme === "light" ? `rgba(150,156,166,${(p.dim * 0.38).toFixed(3)})` : `rgba(18,20,24,${(p.dim * 0.5).toFixed(3)})`;
      ctx.fillRect(bx - Rb * 1.5, by - Rb * 1.5, Rb * 3, Rb * 3);
    }

    // grão finíssimo para evitar faixas nos degradês
    this.grain(bx, by, Rb);
    ctx.restore();

    // fio de luz na borda: define a silhueta (no escuro o lado de baixo some no fundo sem isso)
    {
      const g = ctx.createLinearGradient(bx - Rb, by - Rb, bx + Rb, by + Rb);
      if (this.theme === "light") {
        g.addColorStop(0, `rgba(255,255,255,${(0.95 * live).toFixed(3)})`);
        g.addColorStop(1, `rgba(110,125,150,${(0.3 * live).toFixed(3)})`);
      } else {
        g.addColorStop(0, `rgba(226,236,255,${(0.46 * live).toFixed(3)})`);
        g.addColorStop(1, `rgba(150,172,210,${(0.14 * live).toFixed(3)})`);
      }
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = g;
      ctx.stroke(body);
    }

    // ── ondas ao tocar ──
    if (this.ripples.length) {
      const live2: Ripple[] = [];
      for (const r of this.ripples) {
        const pr = (this.clock - r.t0) / 1.15;
        if (pr >= 1) continue;
        live2.push(r);
        const e = 1 - Math.pow(1 - pr, 3);
        const rad = Rb * (1.03 + 0.85 * e);
        const al = Math.pow(1 - pr, 1.7) * 0.5 * r.power * (this.theme === "light" ? 0.9 : 1);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = rgba(this.theme === "light" ? [70, 80, 96] : [210, 224, 245], al);
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      this.ripples = live2;
    }

    // ── partículas discretas enquanto pensa ──
    if (p.think > 0.02) {
      for (const m of this.motes) {
        const phi = m.ph + m.w * this.tt;
        const rho = Rb * m.rho * (1 + 0.05 * Math.sin(this.tt * 0.7 + m.tp));
        const x = bx + rho * Math.cos(phi);
        const y = by + rho * 0.84 * Math.sin(phi);
        const a = p.think * (0.2 + 0.5 * (0.5 + 0.5 * Math.sin(this.tt * m.tw * 1.6 + m.tp)));
        ctx.fillStyle = rgba(pal.mote, a);
        ctx.beginPath();
        ctx.arc(x, y, m.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private grain(bx: number, by: number, Rb: number) {
    if (!this.noise) {
      const c = document.createElement("canvas");
      c.width = c.height = 96;
      const g = c.getContext("2d");
      if (g) {
        const img = g.createImageData(96, 96);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = Math.random() < 0.5 ? 0 : 255;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = Math.random() * 7;
        }
        g.putImageData(img, 0, 0);
      }
      this.noise = c;
    }
    const pat = this.ctx.createPattern(this.noise, "repeat");
    if (!pat) return;
    this.ctx.fillStyle = pat;
    this.ctx.fillRect(bx - Rb * 1.4, by - Rb * 1.4, Rb * 2.8, Rb * 2.8);
  }
}
