# Decisions

ADR-style record. Append new decisions at the end; never edit or remove existing ones — mark them **superseded by D#** if they change.

## D1 — Stack: Next.js 16 + Supabase

**Status:** accepted · 2026-09-29

Next.js App Router + TypeScript; Supabase for Postgres, Auth, and Row Level Security. Chosen because the app is fundamentally "two users sharing one dataset with per-row access control" — RLS gives that for free, and magic-link auth removes password management. Vercel + Supabase free tiers cover two users.

## D2 — Money is integer cents + ISO currency code

**Status:** accepted · 2026-09-29

Amounts are stored as `amount_cents` (integer) plus `currency` (ISO 4217, default `MXN`). Floats accumulate rounding errors; integers don't. Formatting goes through `Intl.NumberFormat('es-MX', { style: 'currency', currency })`, so adding currencies later is a formatting concern, not a schema change. No FX conversion in v1.

## D3 — Sharing model: household + split tracking

**Status:** accepted · 2026-09-29

All data belongs to a `household`; users join via `household_members`. Every transaction records `paid_by`; shared transactions also carry `payer_share_pct` (e.g. 50 = even split). The non-payer's debt is `amount × (100 − payer_share_pct) / 100`. Debts resolve through `settlements` (a payment from one member to the other). v1 assumes one household per user.

## D4 — Payment methods are labels only

**Status:** accepted · 2026-09-29

A payment method is a name/tag ("TDC Revolut", "Débito Meli", "Efectivo") — **no card numbers, ever**. Storing PANs creates PCI-DSS exposure with zero product value. Cards additionally store `cut_day` and `due_day` (day of month, 1–31).

## D5 — Budgets are monthly and recurring

**Status:** accepted · 2026-09-29

One budget amount per category; it applies to every month. Progress = current month's spend in that category ÷ budget. Month-specific overrides are deliberately out of scope for v1.

## D6 — Auth: email magic link

**Status:** accepted · 2026-09-29

Passwordless sign-in via Supabase Auth magic links. Two users, low friction, no password reset flows to build.

## D7 — Card due-date formula

**Status:** accepted · 2026-09-29

When a spend is registered with a card: `day(spend_date) < cut_day` → payment due `due_day` of the **same month**; otherwise `due_day` of the **next month**. The form surfaces this live ("Se paga el 5 de noviembre"). Edge case: cards whose real-world due day falls before the cut day are approximated by this formula — documented in `known-limitations.md`.

## D8 — Plans are versioned in docs/plans/

**Status:** accepted · 2026-09-29

Each iteration gets `docs/plans/NNN-slug.md` with a status header and a commit checklist. Plans freeze once execution starts. Living docs (`decisions.md`, `use-cases.md`, `user-flows.md`, `known-limitations.md`, `README.md`, `AGENTS.md`) always reflect current reality. Rationale: plans capture *intent at a point in time*; git history alone is not discoverable.

## D9 — Commits: conventional, atomic, revert-friendly

**Status:** accepted · 2026-09-29

Conventional Commits; one logical change per commit; `npm run build` green before every commit; rollback via `git revert`, never history rewrites; milestones tagged (`v0.1-mvp`).

## D10 — UI in Spanish, code and docs in English

**Status:** accepted · 2026-09-29

User-facing strings are Spanish (es-MX). Code, comments, commit messages, and docs are English for contributor/agent accessibility. Dates display `dd/mm/yyyy` via date-fns `es` locale.
