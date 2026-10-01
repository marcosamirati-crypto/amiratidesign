"use client";

import { useEffect, useRef } from "react";
import { manifesto } from "@/content/story";

/**
 * A frase grande se acende palavra por palavra conforme a rolagem (um único gesto de leitura, não
 * uma entrada genérica). As duas notas pequenas ficam em posições opostas, para quebrar o eixo.
 */
export default function Manifesto() {
  const section = useRef<HTMLElement>(null);
  const words = manifesto.text.split(" ");

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLElement>(".m-word"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      spans.forEach((s) => s.classList.add("is-on"));
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.78 - r.top) / (r.height * 0.78)));
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle("is-on", i < n));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={section} className="px-[4.6vw] pb-24 pt-[clamp(9rem,24vw,24rem)] md:px-[3.2vw] md:pb-40">
      <p className="max-w-[19ch] text-[clamp(2.1rem,5.9vw,6.6rem)] font-semibold leading-[1.02] tracking-[-0.04em]" data-no-glow>
        {words.map((w, i) => (
          <span key={i}>
            <span className="m-word">{w}</span>
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
      <div className="mt-16 grid gap-10 md:mt-28 md:grid-cols-12">
        <p className="aside max-w-sm text-[1.15rem] text-muted md:col-span-4">{manifesto.asideLeft}</p>
        <p className="aside max-w-sm text-[1.15rem] text-muted md:col-span-4 md:col-start-9 md:mt-16">{manifesto.asideRight}</p>
      </div>
    </section>
  );
}
