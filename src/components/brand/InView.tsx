"use client";

import { useEffect, useRef } from "react";

/**
 * Observa a entrada na tela e adiciona a classe `in` ao wrapper (uma vez). O CSS das páginas de marca
 * reage a `.in` (animações de gráficos, entradas escalonadas). Sem JS ou com "reduzir movimento",
 * o conteúdo aparece direto.
 */
export default function InView({
  children,
  className = "",
  threshold = 0.25,
  as: Tag = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  as?: "div" | "section" | "article" | "ul";
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  const Comp = Tag as React.ElementType;
  return (
    <Comp ref={ref} id={id} data-iv className={className}>
      {children}
    </Comp>
  );
}
