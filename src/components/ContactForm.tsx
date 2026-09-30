"use client";

import { useActionState } from "react";
import { sendMessage, type FormState } from "@/app/actions";

const field =
  "w-full border-b border-line bg-transparent py-3 text-base outline-none transition-colors focus:border-fg placeholder:text-muted";

export default function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendMessage, null);

  if (state?.ok) {
    return (
      <p role="status" className="text-xl">
        Mensagem enviada. Obrigado — respondo em breve.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <label className="block">
        <span className="sr-only">Nome</span>
        <input name="name" required maxLength={120} placeholder="Nome" autoComplete="name" className={field} />
      </label>
      <label className="block">
        <span className="sr-only">E-mail</span>
        <input name="email" type="email" required maxLength={200} placeholder="E-mail" autoComplete="email" className={field} />
      </label>
      <label className="block">
        <span className="sr-only">Mensagem</span>
        <textarea name="message" required maxLength={4000} rows={4} placeholder="Conte sobre o seu projeto" className={field} />
      </label>
      {/* honeypot anti-spam */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="btn rounded-full border border-fg px-6 py-3 text-sm font-medium hover:bg-accent hover:border-accent hover:text-on-accent disabled:opacity-50"
        >
          {pending ? "Enviando…" : "Enviar mensagem"}
        </button>
        {state?.error && (
          <p role="alert" className="text-sm text-muted">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
