"use client";

import { useState } from "react";
import { mm } from "@/content/motaMacedo";

/** Formulário de demonstração: monta a mensagem e abre o WhatsApp da empresa. Nada é armazenado. */
export default function DemoForm() {
  const [error, setError] = useState("");

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const nome = get("nome");
    const fone = get("whatsapp");
    if (!nome) return setError("Escreva seu nome.");
    if (fone.replace(/\D/g, "").length < 10) return setError("Escreva seu WhatsApp com DDD.");
    setError("");
    const text = [
      `Olá! Quero uma demonstração da ${mm.product} (${mm.brand}).`,
      "",
      `Nome: ${nome}`,
      get("empresa") && `Fazenda/empresa: ${get("empresa")}`,
      get("cidade") && `Cidade: ${get("cidade")}`,
      get("area") && `Área: ${get("area")} ha`,
      `WhatsApp: ${fone}`,
    ]
      .filter((l): l is string => typeof l === "string")
      .join("\n");
    window.open(`https://wa.me/${mm.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  return (
    <form className="mm-form" data-reveal onSubmit={submit} onChange={() => error && setError("")} noValidate>
      <label>
        Nome
        <input name="nome" autoComplete="name" maxLength={80} />
      </label>
      <label>
        Fazenda ou empresa
        <input name="empresa" autoComplete="organization" maxLength={80} />
      </label>
      <div className="mm-two">
        <label>
          Cidade
          <input name="cidade" autoComplete="address-level2" maxLength={60} />
        </label>
        <label>
          Área (hectares)
          <input name="area" inputMode="numeric" maxLength={12} />
        </label>
      </div>
      <label>
        WhatsApp
        <input name="whatsapp" type="tel" autoComplete="tel" maxLength={20} placeholder="(85) 90000-0000" />
      </label>
      {error && (
        <p role="alert" className="mm-err">
          {error}
        </p>
      )}
      <button type="submit" className="mm-btn">
        {mm.final.button}
      </button>
      <p className="mm-form-note">Abre o WhatsApp com a sua mensagem pronta. Nada fica salvo nesta página.</p>
    </form>
  );
}
