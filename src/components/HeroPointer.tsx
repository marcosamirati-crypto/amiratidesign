"use client";

import { useEffect } from "react";

/**
 * Interação da capa: a posição do mouse (normalizada de -1 a 1) vira --mx/--my no #hero, e o CSS
 * usa isso para inclinar o memoji e deslocar o título em paralaxe (ver globals.css, "Capa").
 * As pupilas do memoji (#memoji-eyes) seguem o cursor dentro da íris.
 * Só roda com mouse e sem "reduzir movimento"; o loop para quando tudo assenta.
 */
const EYE_MAX = 2.6; // deslocamento máximo da pupila, em unidades do SVG (248×282)
const VIEW = { w: 248 };

export default function HeroPointer() {
  useEffect(() => {
    const hero = document.getElementById("hero");
    const eyes = document.getElementById("memoji-eyes") as SVGSVGElement | null;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!hero || !fine.matches || reduce.matches) return;

    const eyeEls = eyes ? Array.from(eyes.querySelectorAll<SVGGElement>("[data-eye]")) : [];
    const state = eyeEls.map(() => ({ x: 0, y: 0 }));

    let px = window.innerWidth / 2, py = window.innerHeight / 2; // ponteiro
    let tx = 0, ty = 0, x = 0, y = 0; // cabeça
    let inside = false;
    let raf = 0;

    const frame = () => {
      raf = 0;
      const vis = hero.getBoundingClientRect().bottom > 0;
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      hero.style.setProperty("--mx", x.toFixed(3));
      hero.style.setProperty("--my", y.toFixed(3));

      let moving = Math.abs(tx - x) > 0.002 || Math.abs(ty - y) > 0.002;
      if (vis && eyes) {
        const r = eyes.getBoundingClientRect();
        const sc = r.width / VIEW.w;
        eyeEls.forEach((g, i) => {
          const cx = Number(g.dataset.cx), cy = Number(g.dataset.cy);
          const dx = px - (r.left + cx * sc);
          const dy = py - (r.top + cy * sc);
          const d = Math.hypot(dx, dy) || 1;
          const k = inside ? Math.min(1, d / 280) : 0; // perto do olho, olha menos "torto"
          const ox = (dx / d) * k * EYE_MAX;
          const oy = (dy / d) * k * EYE_MAX;
          const s = state[i];
          s.x += (ox - s.x) * 0.22;
          s.y += (oy - s.y) * 0.22;
          g.style.setProperty("--ex", `${s.x.toFixed(2)}px`);
          g.style.setProperty("--ey", `${s.y.toFixed(2)}px`);
          if (Math.abs(ox - s.x) > 0.02 || Math.abs(oy - s.y) > 0.02) moving = true;
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
