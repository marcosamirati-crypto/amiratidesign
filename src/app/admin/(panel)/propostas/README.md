# TODO (backlog): gerador de propostas comerciais

Não implementado de propósito. Onde entra:

- **Rotas do admin:** `src/app/admin/(panel)/propostas/` (lista, editor). Adicionar o item em `nav` no `(panel)/layout.tsx`. Auth/proxy já cobrem `/admin/*`.
- **Página pública da proposta:** `src/app/(site)/proposta/[token]/page.tsx`, reutilizando `Header`/`Footer`, `Reveal`, `Contact` e os tokens de `globals.css` — assim a proposta já sai com a identidade do studio. Marcar `robots: noindex`.
- **Dados:** tabela `proposals` (id, token, client, blocks jsonb, status, created_at) — ver comentário em `supabase/migrations/0001_init.sql`. Textos base (serviços, níveis, processo) já vêm de `src/content/site.ts`.
- **Escrita:** reutilizar `createAuthClient()` e o padrão de server actions de `src/app/admin/actions.ts`.

Apague este arquivo quando a pasta ganhar código real.
