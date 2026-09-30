import LoginForm from "./LoginForm";
import { hasSupabase } from "@/lib/supabase/server";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="display text-5xl">Admin</h1>
        {!hasSupabase && (
          <p className="mt-6 border border-line p-4 text-sm text-muted">
            Supabase não configurado. Copie <code>.env.example</code> para <code>.env.local</code> e preencha as chaves.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
