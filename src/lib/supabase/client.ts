import { createBrowserClient } from "@supabase/ssr";

/** Cliente do navegador (usa a sessão do admin). Usado para enviar arquivos direto ao Storage. */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
