"use client";

import { useState } from "react";
import Logo from "./Logo";
import { mm } from "@/content/motaMacedo";

/** Cabeçalho discreto: aparece depois da abertura, transparente → vidro escuro. No celular, menu em tela cheia. */
export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className={`mm-head${open ? " is-open" : ""}`}>
      <div className="mm-head-in">
        <a href="#topo" className="mm-head-logo" aria-label={`${mm.product}, voltar ao início`} onClick={() => setOpen(false)}>
          <Logo variant="neg" />
        </a>
        <nav id="mm-menu" className="mm-menu" aria-label="Principal">
          {mm.nav.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className={n.href === "#demo" ? "is-cta" : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        <button type="button" className="mm-burger" aria-expanded={open} aria-controls="mm-menu" onClick={() => setOpen((v) => !v)}>
          <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
          <i />
          <i />
        </button>
      </div>
    </header>
  );
}
