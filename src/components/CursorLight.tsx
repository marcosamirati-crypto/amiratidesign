"use client";

import { useEffect } from "react";

/**
 * Cursor como fonte de luz: perto do cursor, textos e imagens revelam um gradiente quente
 * (amarelo → laranja → vermelho). Sem markup extra: o componente marca os elementos de texto e os
 * contêineres de imagem com `data-glow` / `data-glow-img`, e o CSS (globals.css, bloco "Cursor light")
 * desenha o gradiente a partir de variáveis (--gx/--gy = cursor; --hx/--hy = rastro mais lento).
 *
 * Nas páginas de marca (.sante-page / .tudo-page), texto em cima de um bloco colorido (chips, cartazes, fichas,
 * botões) não recebe a luz: o bloco já tem a cor da marca e o gradiente atrapalharia a leitura.
 *
 * Desligado em touch (sem hover) e com prefers-reduced-motion. O loop de animação só roda enquanto
 * o cursor se move ou há algo apagando.
 */
const BRAND_PAGES = ".sante-page,.tudo-page";
const SKIP = "script,style,noscript,svg,button,input,textarea,select,option,code,.sr-only,.btn,.bg-accent,[aria-hidden='true']";

export default function CursorLight() {
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches || reduce.matches) return;

    type Kind = "text" | "img";
    const kinds = new WeakMap<HTMLElement, Kind>();
    const radii = new WeakMap<HTMLElement, number>();
    const visible = new Set<HTMLElement>();
    const lit = new Map<HTMLElement, number>(); // el -> timer de apagar (0 = aceso)

    let tx = -9999, ty = -9999; // alvo (cursor)
    let fx = tx, fy = ty; // luz rápida
    let sx = tx, sy = ty; // rastro lento
    let kx = tx, ky = ty; // rastro mais lento ainda (3ª mancha de cor)
    let inside = false;
    let raf = 0;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) visible.add(el);
          else visible.delete(el);
        }
      },
      { rootMargin: "300px" },
    );

    const track = (el: HTMLElement, kind: Kind) => {
      kinds.set(el, kind);
      io.observe(el);
    };

    /** Texto dentro de um bloco com fundo próprio (que não é a faixa da seção) numa página de marca. */
    const blockCache = new WeakMap<HTMLElement, boolean>();
    function onColoredBlock(el: HTMLElement) {
      const page = el.closest(BRAND_PAGES);
      if (!page) return false;
      const cached = blockCache.get(el);
      if (cached !== undefined) return cached;
      let hit = false;
      for (let p: HTMLElement | null = el; p && p !== page; p = p.parentElement) {
        const m = getComputedStyle(p).backgroundColor.match(/rgba?\(([^)]+)\)/);
        if (!m) continue;
        const parts = m[1].split(",");
        const a = parts.length > 3 ? parseFloat(parts[3]) : 1;
        if (a > 0.2) {
          hit = p.parentElement !== page; // o fundo da própria seção (filha direta da página) não conta
          break;
        }
      }
      blockCache.set(el, hit);
      return hit;
    }

    function scan() {
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = tw.nextNode())) {
        if (!n.nodeValue || !n.nodeValue.trim()) continue;
        const el = n.parentElement;
        if (!el || kinds.has(el) || el.closest(SKIP) || el.closest("[data-no-glow]") || onColoredBlock(el)) continue;
        el.setAttribute("data-glow", "");
        track(el, "text");
      }
      document.querySelectorAll("img").forEach((img) => {
        if (img.hasAttribute("data-no-glow")) return; // imagens com fundo transparente (ex.: memoji)
        const p = img.parentElement;
        if (p && !kinds.has(p) && !p.closest("[aria-hidden='true']")) {
          p.setAttribute("data-glow-img", "");
          track(p, "img");
        }
      });
    }

    function radiusOf(el: HTMLElement) {
      let r = radii.get(el);
      if (!r) {
        const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
        r = Math.min(230, Math.max(120, fs * 1.4));
        radii.set(el, r);
      }
      return r;
    }

    function turnOn(el: HTMLElement) {
      const t = lit.get(el);
      if (t) window.clearTimeout(t);
      if (lit.get(el) === 0) return;
      lit.set(el, 0);
      el.setAttribute("data-lit", "");
      void el.offsetWidth; // fixa --glow:0 antes de animar para 1 (transição suave)
      el.style.setProperty("--glow", "1");
    }

    function turnOff(el: HTMLElement) {
      if (lit.get(el) !== 0) return; // já apagando ou nunca aceso
      el.style.setProperty("--glow", "0");
      lit.set(
        el,
        window.setTimeout(() => {
          el.removeAttribute("data-lit");
          el.style.removeProperty("--glow");
          el.style.removeProperty("--gx");
          el.style.removeProperty("--gy");
          el.style.removeProperty("--hx");
          el.style.removeProperty("--hy");
          el.style.removeProperty("--kx");
          el.style.removeProperty("--ky");
          el.style.removeProperty("--gr");
          lit.delete(el);
        }, 480),
      );
    }

    function frame() {
      raf = 0;
      fx += (tx - fx) * 0.28;
      fy += (ty - fy) * 0.28;
      sx += (tx - sx) * 0.1;
      sy += (ty - sy) * 0.1;
      kx += (tx - kx) * 0.05;
      ky += (ty - ky) * 0.05;

      // 1) leituras
      const hits: { el: HTMLElement; l: number; t: number; r: number; on: boolean }[] = [];
      for (const el of visible) {
        const rect = el.getBoundingClientRect();
        const kind = kinds.get(el);
        const r = kind === "img" ? 260 : radiusOf(el);
        const dx = Math.max(rect.left - fx, 0, fx - rect.right);
        const dy = Math.max(rect.top - fy, 0, fy - rect.bottom);
        const d = Math.hypot(dx, dy);
        const on = inside && (kind === "img" ? d === 0 : d < r * 0.4);
        hits.push({ el, l: rect.left, t: rect.top, r, on });
      }

      // 2) escritas
      for (const h of hits) {
        if (h.on) {
          turnOn(h.el);
          const s = h.el.style;
          s.setProperty("--gx", `${(fx - h.l).toFixed(1)}px`);
          s.setProperty("--gy", `${(fy - h.t).toFixed(1)}px`);
          s.setProperty("--hx", `${(sx - h.l).toFixed(1)}px`);
          s.setProperty("--hy", `${(sy - h.t).toFixed(1)}px`);
          s.setProperty("--kx", `${(kx - h.l).toFixed(1)}px`);
          s.setProperty("--ky", `${(ky - h.t).toFixed(1)}px`);
          s.setProperty("--gr", `${h.r}px`);
        } else {
          turnOff(h.el);
        }
      }

      const moving = Math.abs(tx - fx) > 0.4 || Math.abs(ty - fy) > 0.4 || Math.abs(tx - sx) > 0.4 || Math.abs(ty - sy) > 0.4 || Math.abs(tx - kx) > 0.4 || Math.abs(ty - ky) > 0.4;
      if (moving) raf = requestAnimationFrame(frame);
    }

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!inside) {
        // entrada: começa o rastro já no cursor, sem "voar" do canto
        fx = sx = kx = e.clientX;
        fy = sy = ky = e.clientY;
      }
      inside = true;
      tx = e.clientX;
      ty = e.clientY;
      kick();
    };
    const onLeave = () => {
      inside = false;
      kick();
    };

    scan();
    let mo: MutationObserver | null = null;
    let t = 0;
    mo = new MutationObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(scan, 150);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", kick);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      mo?.disconnect();
      io.disconnect();
      window.clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
      for (const [el, timer] of lit) {
        if (timer) window.clearTimeout(timer);
        el.removeAttribute("data-lit");
      }
      document.querySelectorAll("[data-glow],[data-glow-img]").forEach((el) => {
        el.removeAttribute("data-glow");
        el.removeAttribute("data-glow-img");
      });
    };
  }, []);

  return null;
}
