---
name: run-amirati-design
description: Run, start, build, smoke-test and screenshot the Amirati Design website (Next.js + Supabase) locally on Windows. Use when asked to run the site, start the dev server, check pages, take a screenshot, or verify a change in the real app.
---

# Run Amirati Design

Next.js 16 (App Router, Turbopack) site with an `/admin` panel. Paths below are relative to `amirati-design/` (the project root). Driven with the built-in browser pane (`navigate` / `screenshot` / `javascript_tool`) plus `smoke.mjs` (plain `fetch` checks). Supabase is optional: without `.env.local` the site serves 4 seed projects from `src/lib/seed.ts`.

## Prerequisites

- Node.js LTS (verified: v24.19, npm 11). Installed via `winget install OpenJS.NodeJS.LTS`.
- `git` is not required to run.

## Build

```powershell
npm install
npm run build      # also type-checks; must end with the route table
```

## Run (agent path)

1. Start the dev server in the background (PowerShell tool with `run_in_background`):
   ```powershell
   npm run dev
   ```
   First request compiles for ~5–10 s; wait before screenshotting.
2. Smoke test (8 routes: home, project page, 404, placeholder SVG, sitemap, robots, admin redirect, login):
   ```powershell
   node .claude/skills/run-amirati-design/smoke.mjs
   ```
   Exit code 0 = all `ok`. Set `BASE=http://localhost:3001` if the port differs.
3. Look at it: with the browser pane, `navigate` to `http://localhost:3000` and `/projetos/aurora-cafe`, then `computer screenshot`. Toggle the light theme with:
   ```js
   document.documentElement.dataset.theme = 'light'
   ```
4. Stop the dev server (TaskStop on the background task) when done.

## Run (human path)

`npm run dev` → open http://localhost:3000. Admin at `/admin/login` needs Supabase (see README: env vars, `supabase/migrations/0001_init.sql`, create the owner user).

## Gotchas

- The `preview_start` tool looks for `.claude/launch.json` in the *session's original cwd*, not in `amirati-design/`. Start the dev server with PowerShell instead and just `navigate` the browser pane to localhost.
- `node`/`npm` are not on PATH in an already-open session after installing Node. Refresh in each PowerShell call: `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`.
- Sections use scroll-reveal (`.reveal` → `.is-in` via IntersectionObserver, 0.7 s). Jumping with `scrollTo` and screenshotting immediately shows a black/blank page or `Screenshot timed out`; wait 1–2 s and retry, or check `getComputedStyle(el).opacity`.
- If the browser pane is hidden (`document.hidden === true`), IntersectionObserver is suspended and NO `.reveal` block ever gets `.is-in` (sections look blank, `Screenshot timed out`). That is the pane, not a bug: force it with `document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-in'))` before screenshotting.
- `npm run import:dry` (no network, no password) prints how `scripts/import-portfolio.mjs` groups the sibling folders `IDENTIDADES VISUAIS/` and `SOCIAL MEDIA/` into projects; `npm run import` uploads (asks admin e-mail/password in the terminal — never ask the user to paste it in chat). Needs `supabase/migrations/0002_highlights.sql` applied first.
- Next 16 renamed `middleware.ts` to `proxy.ts` (`src/proxy.ts`, `export function proxy`).
- Do not name a top-level export `process` in `src/content/site.ts` — it shadows Node's global (`process.env`) and fails type-check (it is `steps` now).
- React inserts comment nodes between adjacent text/expressions in SSR HTML, so grepping for `/01` in `fetch` output fails; match on plain text like "O que você recebe".
- Admin flows (verified with real Supabase in `.env.local`): the owner must log in *by hand* inside the browser pane (never type their password); the pane has its own cookie jar, separate from the user's Chrome. Then drive forms with `javascript_tool`: set inputs via the native value setter + `input` event, attach files with `DataTransfer` on `input[type=file]`, and click buttons by text (`[...document.querySelectorAll('button')].find(b => b.textContent.trim()==='Salvar')`). Never `querySelector('form button')` — the first one is the sidebar "Sair" and logs you out.
- Deleting a project in the admin does not remove its files from the Storage bucket `projects`.
- Contact form and `/admin` return a friendly "not configured" state without `NEXT_PUBLIC_SUPABASE_*`; this is expected, not a bug.

## Troubleshooting

- `Failed to type check … 'process' used before its declaration` → the `process` export rename above.
- `The page is still loading; retry in a moment` right after starting dev → first compile; wait ~5 s.
