"use client";

import { useActionState } from "react";
import { login, type AdminState } from "../actions";

const field = "w-full border-b border-line bg-transparent py-3 outline-none focus:border-fg placeholder:text-muted";

export default function LoginForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(login, null);
  return (
    <form action={action} className="mt-10 space-y-6">
      <input name="email" type="email" required placeholder="E-mail" autoComplete="email" className={field} aria-label="E-mail" />
      <input name="password" type="password" required placeholder="Senha" autoComplete="current-password" className={field} aria-label="Senha" />
      {state?.error && <p role="alert" className="text-sm text-muted">{state.error}</p>}
      <button disabled={pending} className="btn w-full rounded-full bg-accent py-3 font-medium text-on-accent disabled:opacity-50">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
