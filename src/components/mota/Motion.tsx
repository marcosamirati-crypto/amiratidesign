"use client";

import { useEffect } from "react";

/**
 * Motor de movimento da página, sem bibliotecas:
 * - [data-reveal]  ganha .is-in quando entra na tela (uma vez).
 * - [data-scene]   recebe --p (0→1) conforme atravessa a tela; usado em cenas fixas (sticky).
 * - [data-view]    recebe --v (0→1) da entrada pela base até perto do topo; usado em revelações de imagem.
 * - [data-parallax="0.15"] desloca no eixo Y proporcional à rolagem.
 * - [data-step]    marca o passo ativo (.is-active) e espelha no palco [data-stage] (data-active).
 * - .mm recebe .is-scrolled depois da abertura (o cabeçalho aparece).
 * Com prefers-reduced-motion: tudo visível, nada se mexe.
 */
export default function Motion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".mm");
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (reduce) {
      reveals.forEach((el) => el.classList.add("is-in"));
      root.querySelectorAll<HTMLElement>("[data-scene]").forEach((el) => el.style.setProperty("--p", "1"));
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    if (!reduce) reveals.forEach((el) => io.observe(el));

    // passo ativo do "Como funciona"
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    const stage = root.querySelector<HTMLElement>("[data-stage]");
    const stepIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = e.target.getAttribute("data-step") ?? "0";
          steps.forEach((s) => s.classList.toggle("is-active", s === e.target));
          stage?.setAttribute("data-active", i);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    steps.forEach((s) => stepIo.observe(s));

    const scenes = Array.from(root.querySelectorAll<HTMLElement>("[data-scene]"));
    const para = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    const views = Array.from(root.querySelectorAll<HTMLElement>("[data-view]"));
    if (reduce) views.forEach((el) => el.style.setProperty("--v", "1"));
    const opening = root.querySelector<HTMLElement>(".mm-open");
    let raf = 0;

    const frame = () => {
      raf = 0;
      const vh = window.innerHeight;
      root.classList.toggle("is-scrolled", window.scrollY > (opening ? opening.offsetHeight * 0.6 : 80));
      if (reduce) return;
      for (const el of scenes) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) continue;
        // 0 quando o topo encosta no topo da tela; 1 quando o fim encosta no fim da tela
        const span = Math.max(1, r.height - vh);
        const p = Math.min(1, Math.max(0, -r.top / span));
        el.style.setProperty("--p", p.toFixed(4));
      }
      for (const el of views) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        // 0 quando o topo entra pela base da tela; 1 quando chega a 20% do topo
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.8)));
        el.style.setProperty("--v", p.toFixed(4));
      }
      for (const el of para) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const k = Number(el.dataset.parallax) || 0.1;
        const mid = r.top + r.height / 2 - vh / 2;
        el.style.setProperty("--py", `${(-mid * k).toFixed(1)}px`);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      stepIo.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
