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

## ELLE — assistente de debates online (`/elle`)

Experiência separada do portfólio (sem cabeçalho, cursor ou WhatsApp do site). A pessoa envia o print de um comentário; a Elle lê o texto, separa afirmação de opinião, **pesquisa na internet** e nos **planos de governo do TSE**, confere o que a IA escreveu e entrega: o que é fato, o que é opinião, contraponto, fontes e uma resposta pronta (280 / 150 caracteres / com fonte), que ela reescreve com a opinião da pessoa.

**Fluxo e arquivos** (tudo em `src/`):

| Etapa | Onde |
| --- | --- |
| Telas, orbe, resultado | `components/elle/`, `styles/elle.css`, `app/elle/` |
| Orbe (canvas 2D, 6 estados) | `lib/elle/orb-engine.ts` |
| Textos (voz da Elle, erros, eixos) | `content/elle/copy.ts` |
| API (a chave fica aqui, no servidor) | `app/api/elle/analyze`, `app/api/elle/personalize` |
| Pipeline: leitura → buscas → planos → síntese → conferência | `lib/elle/server/pipeline.ts` |
| Buscador trocável (Tavily, Brave) | `lib/elle/server/search/` |
| Fontes de nível 1/2/3 (editável) | `lib/elle/server/sources/registry.ts` |
| Trava anti-invenção | `lib/elle/server/verification.ts` |
| Instruções da IA | `lib/elle/server/prompts.ts` |
| Pistas de pesquisa por eixo (editável) | `content/elle/leads.ts` |

**Variáveis de ambiente:** ver `.env.example` (bloco ELLE). Mínimo: `ANTHROPIC_API_KEY` + `TAVILY_API_KEY` (ou `BRAVE_SEARCH_API_KEY`).

**Planos de governo (TSE):** o TSE bloqueia download automático, então baixe os PDFs pelo navegador e rode:

```bash
npm run elle:plans -- --from "C:\caminho\da\pasta\com\os\pdfs"
```

O nome de cada arquivo precisa conter `flavio` ou `lula`. O script grava os trechos (com página) em `src/content/elle/plans/`. Rode de novo quando o TSE publicar uma versão nova.

**Modos:** com chaves = real. Sem chaves, só em desenvolvimento = **demonstração** (exemplo fixo, com faixa avisando; nada é pesquisado). Em produção sem chaves a Elle diz que não está disponível.

**Testar o caminho real sem gastar crédito:** `node scripts/elle-fake-apis.mjs` sobe uma IA e um buscador **falsos** (só para teste; erram de propósito para provar a trava). Em outro terminal, rode o site apontando para eles. No PowerShell:

```powershell
$env:ANTHROPIC_API_KEY="x"; $env:ANTHROPIC_BASE_URL="http://localhost:4010"; $env:TAVILY_API_KEY="x"; $env:TAVILY_BASE_URL="http://localhost:4010"; npm.cmd run dev
```

(Em Linux/macOS: `ANTHROPIC_API_KEY=x ANTHROPIC_BASE_URL=http://localhost:4010 TAVILY_API_KEY=x TAVILY_BASE_URL=http://localhost:4010 npm run dev`.) O servidor falso aceita `POST /__mode` para simular falhas (ver o comentário no topo de `scripts/elle-fake-apis.mjs`).

**Privacidade:** o print é lido em memória e **não é gravado** pela Elle (nem a imagem, nem o texto lido). Ele é enviado ao serviço de IA para ser lido. Resultados de busca ficam em cache de memória por 30 min (não persistem). O log do servidor guarda só o tipo do erro, nunca o conteúdo.

**Fora do Google:** a página tem `noindex` até o lançamento. Para liberar, troque `robots` em `src/app/elle/layout.tsx`.

## Backlog

Gerador de propostas comerciais no admin: **não implementado**. O ponto de entrada está documentado em `src/app/admin/(panel)/propostas/README.md`.
