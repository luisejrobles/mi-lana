<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Mi Lana — agent guide

Expense tracker for a couple (shared household). UI in **Spanish**, docs/code in English, amounts in **MXN** by default.

**Active plan:** none — [`docs/plans/001-mvp.md`](./docs/plans/001-mvp.md) is **done** (tag `v0.1-mvp`). Start the next iteration as `docs/plans/002-<slug>.md` per the conventions below.

## Commands

- `nvm use` — Node 20 (`.nvmrc`); Node 18 breaks the build
- `npm run dev` / `npm run build` / `npm run lint`
- `npm run build` **must pass before every commit**

## Commit conventions

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:` (scopes optional, e.g. `feat(db):`)
- **Atomic commits**: one logical change per commit; the app must work at every commit
- **Branches**: `main` is the integration branch. All new work happens on feature branches (`feat/...`, `fix/...`, `chore/...`) and merges back to `main` with `--no-ff`
- **Plan checkboxes**: tick `docs/plans/NNN-*.md` items in the same commit as the work they describe
- **Rollback**: prefer `git revert <sha>`; never rewrite pushed history
- Milestones get tags (e.g. `v0.1-mvp`)

## Plan versioning (docs/plans/)

- Each iteration gets a numbered file: `docs/plans/NNN-slug.md` (`001-mvp.md`, `002-....md`)
- Header carries `status: proposed | in-progress | done | superseded-by-NNN`
- Plans contain a **commit checklist** — check items off as they land; a new session resumes from the first unchecked item
- Plans are **frozen** once execution starts (only checkboxes/status change)
- **Living docs** (always current, edit freely): `docs/decisions.md`, `docs/use-cases.md`, `docs/user-flows.md`, `docs/known-limitations.md`, `README.md`, this file
- When a plan completes: mark `done`, fold outcomes into living docs, point "Active plan" above at the next file

## Architecture

- **Next.js 16 App Router** (`src/app/`). Breaking changes vs older Next:
  - `middleware.ts` is now **`src/proxy.ts`** (named export `proxy`, nodejs runtime)
  - `cookies()`, `headers()`, `params`, `searchParams` are **async-only**
  - Read `node_modules/next/dist/docs/` before using any Next API
- **Supabase** clients in `src/lib/supabase/`: `client.ts` (browser), `server.ts` (RSC/actions), `proxy.ts` (session refresh)
- **All tables are household-scoped** and protected by Postgres **RLS** via `household_members`
- **Money**: integer **cents** (`amount_cents`) + ISO 4217 `currency` code. Never floats. Format with `Intl.NumberFormat('es-MX', { style: 'currency', currency })`
- **Dates**: `date-fns` with `es` locale; storage as `date` columns; display `dd/mm/yyyy`
- **Payment methods are labels only** ("TDC Revolut", "Efectivo") — never store card numbers
- **Card due date**: `day(spend_date) < cut_day` → due `due_day` of same month, else of next month
- **Splits**: `transactions.is_shared` + `payer_share_pct`; balances resolve via `settlements`
- **Budgets**: one monthly amount per category, repeats every month

## Data model (supabase/migrations/)

`households`, `household_members`, `categories`, `budgets`, `payment_methods`, `income_sources`, `transactions`, `settlements` — details in `docs/decisions.md` and the migration files.
