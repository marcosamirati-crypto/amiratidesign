"use client";

import { useEffect, useRef } from "react";

/** Gerador determinístico (o mesmo céu a cada visita). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Star = { x: number; y: number; r: number; a: number; tw: number; ph: number };

/**
 * Céu estrelado em canvas: estrelas brancas e cinzas + uma faixa de galáxia em diagonal.
 * Só tons neutros (a paleta da marca não usa azul). Pisca devagar e para quando sai da tela.
 */
export default function Starfield({ className, seed = 11, density = 1 }: { className?: string; seed?: number; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stars: Star[] = [];
    let haze: HTMLCanvasElement | null = null;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let last = 0;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = rng(seed);
      const n = Math.round(((w * h) / 2600) * density);
      stars = [];
      for (let i = 0; i < n; i++) {
        const big = r() < 0.035;
        stars.push({ x: r() * w, y: r() * h, r: big ? 0.9 + r() * 0.9 : 0.3 + r() * 0.55, a: big ? 0.7 + r() * 0.3 : 0.18 + r() * 0.5, tw: r() < 0.22 ? 0.4 + r() * 1.2 : 0, ph: r() * Math.PI * 2 });
      }
      // galáxia: faixa diagonal de poeira fina
      const band = Math.round(n * 1.4);
      for (let i = 0; i < band; i++) {
        const t = r();
        const off = (r() + r() + r() - 1.5) * 0.16 * Math.min(w, h);
        const x = w * (0.05 + t * 0.95) + off * 0.5;
        const y = h * (0.92 - t * 0.85) + off;
        stars.push({ x, y, r: 0.2 + r() * 0.4, a: 0.08 + r() * 0.28, tw: 0, ph: 0 });
      }
      // brilho difuso da galáxia, desenhado uma vez fora da tela
      haze = document.createElement("canvas");
      haze.width = cv.width;
      haze.height = cv.height;
      const hx = haze.getContext("2d");
      if (hx) {
        hx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (let i = 0; i < 9; i++) {
          const t = i / 8;
          const x = w * (0.1 + t * 0.85);
          const y = h * (0.88 - t * 0.8);
          const rad = Math.min(w, h) * (0.18 + r() * 0.14);
          const g = hx.createRadialGradient(x, y, 0, x, y, rad);
          g.addColorStop(0, "rgba(200,201,206,0.055)");
          g.addColorStop(1, "rgba(200,201,206,0)");
          hx.fillStyle = g;
          hx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        }
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      if (haze) ctx.drawImage(haze, 0, 0, w, h);
      for (const s of stars) {
        const a = s.tw ? s.a * (0.65 + 0.35 * Math.sin(t * 0.001 * s.tw + s.ph)) : s.a;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.r > 0.9 ? "#F4F4F5" : "#C8C9CE";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      raf = 0;
      if (!visible) return;
      if (t - last > 50) {
        draw(t);
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };

    build();
    draw(0);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduce && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(cv);
    const ro = new ResizeObserver(() => {
      build();
      draw(performance.now());
    });
    ro.observe(cv);
    return () => {
      io.disconnect();
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [seed, density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
