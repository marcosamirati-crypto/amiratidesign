"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor do site: uma elipse minimalista com o gradiente quente da marca, no lugar do cursor nativo
 * (só com mouse). O cursor não muda sobre texto (sem "I" de seleção) e o texto do site não é
 * selecionável (campos de formulário continuam normais). Cresce e fica translúcida sobre links/botões.
 * Ao sair do layout do site (ex.: /admin) as classes são removidas e o cursor nativo volta.
 */
const INTERACTIVE = "a,button,[role='button'],input,textarea,select,label,summary";

export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("site-noselect");

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const el = ref.current;
    if (!fine.matches || !el) {
      return () => root.classList.remove("site-noselect");
    }
    root.classList.add("site-cursor");

    let tx = 0, ty = 0, x = 0, y = 0;
    let shown = false;
    let raf = 0;

    const draw = () => {
      raf = 0;
      x += (tx - x) * (reduce.matches ? 1 : 0.34);
      y += (ty - y) * (reduce.matches ? 1 : 0.34);
      el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(draw);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        x = tx;
        y = ty;
        shown = true;
        el.dataset.on = "";
      }
      const over = (e.target as Element | null)?.closest?.(INTERACTIVE);
      el.toggleAttribute("data-link", Boolean(over));
      kick();
    };
    const onDown = () => el.setAttribute("data-down", "");
    const onUp = () => el.removeAttribute("data-down");
    const onLeave = () => {
      shown = false;
      el.removeAttribute("data-on");
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

  return <div ref={ref} aria-hidden className="cursor-ellipse" />;
}
