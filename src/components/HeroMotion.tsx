"use client";

import { useEffect } from "react";

/**
 * Movimento da capa (só com mouse e sem "reduzir movimento"):
 * - letras perto do cursor engrossam (eixo wght da fonte variável) e levantam alguns pixels;
 * - o retrato se desloca um pouco no sentido oposto ao cursor.
 * O loop só roda enquanto o mouse se move e a capa está na tela.
 */
const BASE = 600; // peso de repouso (precisa casar com .hero-letter no CSS)
const MAX = 720; // peso máximo perto do cursor
const RADIUS = 230; // alcance (px)

export default function HeroMotion() {
  useEffect(() => {
    const hero = document.getElementById("hero");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!hero || !fine.matches || reduce.matches) return;

    const letters = Array.from(hero.querySelectorAll<HTMLElement>("[data-letter]"));
    const cur = letters.map(() => 0); // 0..1, suavizado por letra
    let px = -9999, py = -9999, tx = 0, ty = 0, x = 0, y = 0;
    let inside = false;
    let raf = 0;

    const frame = () => {
      raf = 0;
      const vis = hero.getBoundingClientRect().bottom > 0;
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      hero.style.setProperty("--mx", x.toFixed(3));
      hero.style.setProperty("--my", y.toFixed(3));

      let moving = Math.abs(tx - x) > 0.002 || Math.abs(ty - y) > 0.002;
      if (vis) {
        const rects = letters.map((l) => l.getBoundingClientRect());
        letters.forEach((l, i) => {
          const r = rects[i];
          const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
          const target = inside ? Math.pow(Math.max(0, 1 - d / RADIUS), 2) : 0;
          cur[i] += (target - cur[i]) * 0.2;
          if (Math.abs(target - cur[i]) > 0.003) moving = true;
          const f = cur[i];
          l.style.fontVariationSettings = f > 0.003 ? `"wght" ${(BASE + (MAX - BASE) * f).toFixed(0)}` : "";
          l.style.translate = f > 0.003 ? `0 ${(-9 * f).toFixed(2)}px` : "";
        });
      }
      if (moving) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      inside = true;
      px = e.clientX;
      py = e.clientY;
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      kick();
    };
    const onLeave = () => {
      inside = false;
      tx = ty = 0;
      kick();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", kick);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      hero.style.removeProperty("--mx");
      hero.style.removeProperty("--my");
    };
  }, []);

  return null;
}
