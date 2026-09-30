# Amirati Design

Site institucional + portfólio do studio, com painel `/admin`. Next.js (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres, Storage, Auth) · deploy na Vercel.

## Rodar local

```bash
npm install
cp .env.example .env.local   # preencha (veja abaixo). Sem isso o site roda com os projetos do seed em código.
npm run dev                  # http://localhost:3000
```

Sem Supabase configurado: a home e as páginas de projeto funcionam com 4 projetos placeholder (`src/lib/seed.ts`); o formulário de contato e o `/admin` só funcionam depois de conectar.

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Mesma tela, chave `anon` (pública; a segurança é feita por RLS) |
| `NEXT_PUBLIC_SITE_URL` | URL pública final (ex.: `https://amiratidesign.com`). Usada em sitemap, canonical e OG |

Nunca use a chave `service_role` neste projeto.

## Banco (Supabase)

1. Crie um projeto em supabase.com.
2. SQL Editor → cole e rode [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql): tabelas `projects` e `messages`, RLS e o bucket público `projects`.
3. (Opcional) rode [`supabase/seed.sql`](supabase/seed.sql) para 4 projetos de exemplo (as imagens são geradas por `/placeholder/...`).
4. **Auth → Providers → Email:** desative *Allow new users to sign up*. Depois, Auth → Users → *Add user* com o e-mail/senha do dono. Como só o dono existe, o papel `authenticated` das políticas RLS equivale ao admin.

## Admin

`/admin` (login por e-mail/senha). Lista de projetos, criar/editar (capa, imagens empilhadas, resumo, link, ordem, publicar/rascunho), excluir, e caixa de mensagens do formulário. `src/proxy.ts` (antigo middleware) bloqueia tudo em `/admin/*` sem sessão.

## Deploy na Vercel

1. Suba o código para um repositório novo no GitHub (`git init`, `git add .`, `git commit`, `git remote add origin ...`, `git push`).
2. Vercel → *Add New Project* → importe o repositório (framework Next.js é detectado).
3. Em *Environment Variables* adicione as 3 variáveis acima.
4. Deploy. Depois, em Supabase → Auth → URL Configuration, ponha a URL da Vercel em *Site URL*.

## Onde editar

- **Textos** (hero, serviços, entregáveis, processo): `src/content/site.ts`. Os níveis Bronze/Prata/Ouro e os itens de cada entregável são um ponto de partida — ajuste ao que você realmente entrega.
- **Cores e movimento:** tokens em `src/app/globals.css`. No tema claro o acento `#ea0637` nunca é cor de texto (só fundo/chip/hover).
- **Fonte:** `public/fonts/StackSansHeadline-VariableFont_wght.ttf`, carregada em `src/app/layout.tsx` via `next/font/local`.
- **Imagens do OG:** cada projeto usa a própria capa (`generateMetadata`).

## Backlog

Gerador de propostas comerciais no admin: **não implementado**. O ponto de entrada está documentado em `src/app/admin/(panel)/propostas/README.md`.
