# Mi Lana

**Mi Lana** is a web app to track your expenses — and the ones you share with your partner. Register spends and income, assign budgets per category, track card payment due dates, split shared expenses, and settle up at the end of the month.

UI is in **Spanish**; amounts default to **MXN** (multi-currency ready).

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — see `node_modules/next/dist/docs/` for version-matched docs
- **Supabase** (Postgres + Auth with magic links + Row Level Security)
- **Tailwind CSS 4 + shadcn/ui** — components in `src/components/ui/`
- **Recharts** — income vs spending chart
- **react-hook-form + zod** — forms and validation
- **date-fns** — date handling (`es` locale)

## Prerequisites

- **Node.js 20+** (`nvm use` reads `.nvmrc`)
- A free **Supabase** project — create one when you reach the setup step below (no account needed to clone and explore)

## Setup

```bash
nvm use                 # Node 20
npm install
cp .env.local.example .env.local
```

Then create the Supabase project (~5 min):

1. Go to [supabase.com](https://supabase.com) → sign up → **New project** (pick a region close to you)
2. In **Project Settings → API Keys**, copy the **Project URL** and the **publishable** key (`sb_publishable_...`) into `.env.local`
3. Apply the database migrations: open **SQL Editor** in the dashboard and run the files in `supabase/migrations/` in order
4. In **Authentication → Sign In / Providers**, make sure **Email** is enabled (magic link)

```bash
npm run dev             # http://localhost:3000
```

## Scripts

| Command         | What it does                        |
| --------------- | ----------------------------------- |
| `npm run dev`   | Dev server (Turbopack)              |
| `npm run build` | Production build — must stay green  |
| `npm run start` | Serve the production build          |
| `npm run lint`  | ESLint                              |

## Project structure

```
src/
  app/                  # App Router pages (dashboard, categories, ...)
  components/ui/        # shadcn/ui components
  lib/
    supabase/           # browser/server/proxy Supabase clients
    utils.ts            # cn() and shared helpers
  proxy.ts              # Next 16 "proxy" (was middleware): session refresh
supabase/
  migrations/           # SQL, applied in order via Supabase SQL editor
docs/
  plans/                # Numbered iteration plans (001-mvp.md, ...)
  decisions.md          # ADR-style record of the "why"
  use-cases.md          # What the app supports
  user-flows.md         # Step-by-step flows
  known-limitations.md  # What v1 intentionally does not do
```

## Deploy (Vercel + Supabase)

**Production: <https://mi-lana-alpha.vercel.app>** — deploys run automatically on every push to `main` (GitHub integration); feature branches get preview URLs (protected by Vercel SSO — only you can open them).

Manual CLI deploys also work: `vercel --prod` (project `mi-lana` under `luisejrobles-projects`, linked in `.vercel/`).

One-time Supabase step for production auth — **Authentication → URL Configuration**:

- **Site URL**: `https://mi-lana-alpha.vercel.app`
- **Redirect URLs**: add `https://mi-lana-alpha.vercel.app/auth/confirm` (keep `http://localhost:3000/auth/confirm` for local dev)

Env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) are already set for Production and Preview via `vercel env`. The same hosted Supabase project serves dev and prod — if you ever want isolation, create a second Supabase project and point Vercel at it.

## Documentation

- **Humans:** start here, then `docs/use-cases.md` and `docs/user-flows.md`
- **Agents/contributors:** read [`AGENTS.md`](./AGENTS.md) first — it holds the commit conventions, plan versioning, and architecture map. Active plan: `docs/plans/001-mvp.md`

## Rollback cheat sheet

Every feature lands as an atomic commit (see `git log`). To undo:

| Situation                    | Command                  |
| ---------------------------- | ------------------------ |
| Undo a commit safely         | `git revert <sha>`       |
| Discard uncommitted changes  | `git restore .`          |
| Inspect a past milestone     | `git checkout v0.1-mvp`  |
| Nuclear reset (local only)   | `git reset --hard <sha>` |

Prefer `revert` — it keeps history intact and never rewrites shared work.
