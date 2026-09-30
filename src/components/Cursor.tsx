"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor do site (só com mouse): um círculo perfeito pequeno no ponto do mouse e uma elipse de
 * contorno fino que o segue com leve atraso. O traço é branco com mix-blend-mode: difference, então
 * vira escuro no tema claro e continua visível sobre imagens. O cursor não muda sobre texto e o texto
 * do site não é selecionável (campos de formulário continuam normais). Sobre links/botões a elipse
 * abre e o ponto some. Ao sair do layout do site (ex.: /admin) as classes saem e o cursor nativo volta.
 */
const INTERACTIVE = "a,button,[role='button'],input,textarea,select,label,summary";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("site-noselect");

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!fine.matches || !dot || !ring) {
      return () => root.classList.remove("site-noselect");
    }
    root.classList.add("site-cursor");

    let tx = 0, ty = 0; // alvo
    let dx = 0, dy = 0; // ponto
    let rx = 0, ry = 0; // elipse
    let shown = false;
    let raf = 0;

    const draw = () => {
      raf = 0;
      dx += (tx - dx) * 0.7;
      dy += (ty - dy) * 0.7;
      rx += (tx - rx) * (reduce.matches ? 1 : 0.18);
      ry += (ty - ry) * (reduce.matches ? 1 : 0.18);
      dot.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      ring.style.translate = `${rx.toFixed(1)}px ${ry.toFixed(1)}px`;
      if (Math.abs(tx - rx) > 0.3 || Math.abs(ty - ry) > 0.3 || Math.abs(tx - dx) > 0.3 || Math.abs(ty - dy) > 0.3) {
        raf = requestAnimationFrame(draw);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        dx = rx = tx;
        dy = ry = ty;
        shown = true;
        dot.setAttribute("data-on", "");
        ring.setAttribute("data-on", "");
      }
      const over = Boolean((e.target as Element | null)?.closest?.(INTERACTIVE));
      dot.toggleAttribute("data-link", over);
      ring.toggleAttribute("data-link", over);
      kick();
    };
    const onDown = () => ring.setAttribute("data-down", "");
    const onUp = () => ring.removeAttribute("data-down");
    const onLeave = () => {
      shown = false;
      dot.removeAttribute("data-on");
      ring.removeAttribute("data-on");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    root.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove("site-noselect", "site-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} aria-hidden className="cursor-ring" />
      <div ref={dotRef} aria-hidden className="cursor-dot" />
    </>
  );
}
