"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { OrbEngine, type OrbState } from "@/lib/elle/orb-engine";

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

interface Props {
  /** Estado de fundo (a tela decide). Hover e toque são somados aqui dentro. */
  state: OrbState;
  /** Se verdadeiro vira um botão: reage ao toque e chama onPress. */
  interactive?: boolean;
  onPress?: () => void;
  /** Texto para leitores de tela. */
  label: string;
  className?: string;
  /** Marca para o app saber em qual tela o orbe está (testes e CSS). */
  "data-orb"?: string;
}

/**
 * O orbe da Elle. Um canvas desenhado por OrbEngine, dentro de um círculo do tamanho de --d.
 * Sem JS (ou antes de carregar) aparece uma pérola estática em CSS no mesmo lugar.
 */
export default function ElleOrb({ state, interactive = false, onPress, label, className = "", ...rest }: Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OrbEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const dark = useMedia("(prefers-color-scheme: dark)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const timerRef = useRef(0);
  const darkRef = useRef(dark);
  const reducedRef = useRef(reduced);
  darkRef.current = dark;
  reducedRef.current = reduced;

  // Cria o motor uma vez.
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    let engine: OrbEngine;
    try {
      engine = new OrbEngine(canvas, () => canvas.getBoundingClientRect());
    } catch {
      return; // sem canvas 2D: fica a pérola estática do CSS
    }
    engineRef.current = engine;
    engine.setTheme(darkRef.current ? "dark" : "light");
    engine.setReduced(reducedRef.current);
    const ro = new ResizeObserver(() => engine.resize(canvas.clientWidth));
    ro.observe(canvas);
    engine.resize(canvas.clientWidth);
    engine.start();
    const io = new IntersectionObserver(([entry]) => engine.setVisible(entry.isIntersecting));
    io.observe(root);

    // Atenção ao cursor (ou ao dedo): o orbe "percebe" você.
    const move = (e: PointerEvent) => engine.setPointer(e.clientX, e.clientY);
    const leave = () => engine.setPointer(null, null);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", leave, { passive: true });
    window.addEventListener("pointercancel", leave, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    setReady(true);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", leave);
      window.removeEventListener("pointercancel", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
      ro.disconnect();
      io.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => engineRef.current?.setTheme(dark ? "dark" : "light"), [dark]);
  useEffect(() => engineRef.current?.setReduced(reduced), [reduced]);

  const effective: OrbState = press ? "pressed" : state === "idle" && hover ? "hover" : state;
  useEffect(() => engineRef.current?.setState(effective), [effective, ready]);

  const down = (e: React.PointerEvent) => {
    setPress(true);
    if (e.pointerType === "touch") navigator.vibrate?.(8);
  };
  const up = () => setPress(false);
  const click = () => {
    engineRef.current?.pulse(0.75);
    // Pequena pausa para a reação do orbe ser vista antes de a folha abrir.
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => onPress?.(), reducedRef.current ? 0 : 170);
  };

  // O <div> com o canvas é sempre o mesmo elemento (o motor desenha nele); o botão é uma camada
  // transparente por cima, só quando o orbe é clicável. Assim a tela pode mudar sem recriar o canvas.
  return (
    <div
      ref={rootRef as React.RefObject<HTMLDivElement>}
      className={`elle-orb ${className}`.trim()}
      data-ready={ready ? "" : undefined}
      data-state={effective}
      role={interactive ? undefined : "img"}
      aria-label={interactive ? undefined : label}
      {...rest}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      {interactive && (
        <button
          type="button"
          className="elle-orb__hit"
          aria-label={label}
          aria-haspopup="dialog"
          onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
          onPointerLeave={() => {
            setHover(false);
            setPress(false);
          }}
          onPointerDown={down}
          onPointerUp={up}
          onPointerCancel={up}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setPress(true)}
          onKeyUp={(e) => (e.key === " " || e.key === "Enter") && setPress(false)}
          onBlur={() => setPress(false)}
          onClick={click}
        />
      )}
    </div>
  );
}

export type { OrbState };
