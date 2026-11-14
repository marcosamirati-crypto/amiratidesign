"use client";

import { useActionState, useRef, useState } from "react";
import { sendBriefing, type BriefingState } from "@/app/actions";
import { briefingQuestions as qs } from "@/content/briefing";
import { site } from "@/content/site";

const field =
  "w-full border-b border-line bg-transparent py-3 text-lg outline-none transition-colors focus:border-fg placeholder:text-muted md:text-xl";
const pill =
  "cursor-pointer select-none rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-fg peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent";
const btn = "btn rounded-full px-6 py-3 text-sm font-medium";

const TOTAL = qs.length + 1; // passo 0 = identificação

export default function BriefingForm() {
  const [state, action, pending] = useActionState<BriefingState, FormData>(sendBriefing, null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.ok) {
    const wa = `${site.whatsapp}?text=${encodeURIComponent(state.text ?? "")}`;
    return (
      <div role="status" className="max-w-2xl">
        <p className="mb-6 text-sm text-muted">/ Recebido</p>
        <h2 className="display text-5xl md:text-7xl">Obrigado. Agora é comigo.</h2>
        <p className="mt-8 text-lg text-muted">
          {state.saved
            ? "Suas respostas chegaram. Leio tudo e volto a falar com você em até dois dias úteis."
            : "Para garantir que suas respostas cheguem, envie pelo WhatsApp no botão abaixo."}
        </p>
        {state.text && (
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className={`${btn} ${state.saved ? "border border-fg" : "bg-accent text-on-accent"}`}
            >
              {state.saved ? "Enviar também pelo WhatsApp" : "Enviar pelo WhatsApp"}
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(state.text ?? "").then(() => setCopied(true));
              }}
              className={`${btn} border border-line`}
            >
              {copied ? "Respostas copiadas" : "Copiar minhas respostas"}
            </button>
          </div>
        )}
      </div>
    );
  }

  /** Confere os campos obrigatórios do passo atual antes de avançar. */
  function valid(s: number): string {
    const f = formRef.current;
    if (!f) return "";
    const fd = new FormData(f);
    if (s === 0) {
      const email = String(fd.get("email") ?? "").trim();
      if (!String(fd.get("nome") ?? "").trim()) return "Escreva seu nome.";
      if (!/^\S+@\S+\.\S+$/.test(email)) return "Escreva um e-mail válido.";
      return "";
    }
    const q = qs[s - 1];
    if (!q.required) return "";
    const picks = fd.getAll(`q_${q.id}`).filter((v) => String(v).trim());
    const detail = String(fd.get(`q_${q.id}_detalhe`) ?? "").trim();
    return picks.length || detail ? "" : q.options ? "Escolha uma opção." : "Essa resposta é importante.";
  }

  function go(to: number) {
    if (to > step) {
      const msg = valid(step);
      if (msg) return setError(msg);
    }
    setError("");
    setStep(to);
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>(`[data-step="${to}"] input:not([type=hidden]), [data-step="${to}"] textarea`);
      el?.focus({ preventScroll: true });
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const last = step === TOTAL - 1;
  const pct = Math.round(((step + 1) / TOTAL) * 100);

  return (
    <form
      ref={formRef}
      action={action}
      onKeyDown={(e) => {
        const t = e.target as HTMLElement;
        if (e.key === "Enter" && t.tagName === "INPUT" && !last) {
          e.preventDefault();
          go(step + 1);
        }
      }}
      onSubmit={(e) => {
        const msg = valid(step);
        if (msg) {
          e.preventDefault();
          setError(msg);
        }
      }}
      className="scroll-mt-28"
      noValidate
    >
      {/* progresso */}
      <div className="mb-12 flex items-center gap-4">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${pct}%`, background: "var(--accent-gradient)" }}
          />
        </div>
        <p className="w-16 text-right text-sm tabular-nums text-muted" aria-live="polite">
          {step === 0 ? "Início" : `${String(step).padStart(2, "0")} / ${qs.length}`}
        </p>
      </div>

      {/* passo 0: identificação */}
      <fieldset data-step={0} hidden={step !== 0} className="space-y-6">
        <legend className="display mb-10 text-4xl md:text-6xl">Primeiro, quem é você?</legend>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Nome</span>
            <input name="nome" maxLength={80} autoComplete="name" className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Empresa ou marca</span>
            <input name="empresa" maxLength={80} autoComplete="organization" className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">E-mail</span>
            <input name="email" type="email" maxLength={200} autoComplete="email" className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">WhatsApp (opcional)</span>
            <input name="whatsapp" type="tel" maxLength={40} autoComplete="tel" className={field} />
          </label>
        </div>
      </fieldset>

      {/* perguntas */}
      {qs.map((q, i) => (
        <fieldset key={q.id} data-step={i + 1} hidden={step !== i + 1}>
          <legend className="mb-4">
            <span className="display block text-4xl md:text-6xl">{q.title}</span>
          </legend>
          <p className="mb-10 text-lg text-muted">
            {q.hint}
            {!q.required && <span className="ml-2 text-sm">(opcional)</span>}
          </p>

          {q.options && (
            <div data-no-glow className="mb-8 flex flex-wrap gap-3">
              {q.options.map((o) => (
                <label key={o} className="flex">
                  <input
                    type={q.kind === "multi" ? "checkbox" : "radio"}
                    name={`q_${q.id}`}
                    value={o}
                    className="peer sr-only"
                  />
                  <span className={pill}>{o}</span>
                </label>
              ))}
            </div>
          )}

          <label className="block">
            <span className="sr-only">{q.options ? "Detalhes" : q.title}</span>
            {q.kind === "text" ? (
              <input name={`q_${q.id}_detalhe`} maxLength={200} placeholder={q.placeholder} className={field} />
            ) : (
              <textarea
                name={`q_${q.id}_detalhe`}
                maxLength={1500}
                rows={q.options ? 2 : 4}
                placeholder={
                  q.placeholder ??
                  (q.id === "prazo" ? "Prazo: até quando precisa?" : q.options ? "Quer detalhar? (opcional)" : "Sua resposta")
                }
                className={`${field} resize-none`}
              />
            )}
          </label>
        </fieldset>
      ))}

      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {/* navegação */}
      <div className="mt-12 flex flex-wrap items-center gap-4">
        {step > 0 && (
          <button type="button" onClick={() => go(step - 1)} className={`${btn} border border-line`}>
            Voltar
          </button>
        )}
        {last ? (
          <button type="submit" disabled={pending} className={`${btn} bg-accent text-on-accent disabled:opacity-50`}>
            {pending ? "Enviando…" : "Enviar briefing"}
          </button>
        ) : (
          <button type="button" onClick={() => go(step + 1)} className={`${btn} bg-accent text-on-accent`}>
            {step === 0 ? "Começar" : "Próxima"}
          </button>
        )}
        {(error || state?.error) && (
          <p role="alert" className="text-sm text-accent-ink">
            {error || state?.error}
          </p>
        )}
      </div>
    </form>
  );
}
