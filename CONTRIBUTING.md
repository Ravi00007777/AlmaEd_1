# Contributing

Private-team project. This doc covers environment setup and conventions — no public PR process yet.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with real values — never edit `.env.example` with real secrets, it's committed to git. You'll need a Supabase project (free tier is fine) for the database and file storage — see `README.md`'s "Environment variables" section for which keys come from where.

Before running anything that uploads a file, create a public Storage bucket named `resources` in your Supabase project — nothing in code creates it for you.

```bash
npm run db:push     # sync Prisma schema to your Supabase DB
npm run db:seed      # creates the first admin account (SEED_ADMIN_EMAIL/PASSWORD from .env.local)
npm run dev
```

## Before opening a PR

```bash
npm run typecheck
npm run lint
npm run build
```

There's no test suite yet. There's no pre-commit hook (no husky/lint-staged) — run the checks above manually.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) style (`feat:`, `fix:`, `refactor:`, `docs:`, etc.) — not currently enforced by a hook, just a convention worth keeping so history stays useful.

## Branches

No enforced convention yet. Suggested: `<type>/<short-description>`, e.g. `feat/batch-scheduling-ui`, `fix/payment-status-toggle`.

## Docs

If you introduce or rename a domain concept (a new entity, a renamed relationship), that's an `ARCHITECTURE.md` update, not just a code comment — the "Domain glossary" section exists specifically to keep names from colliding again (see the Assignment/Resource rename story there). When you touch a folder, check whether its `NOTES.md` (if it has one) still matches reality. When you change something non-obvious, add a short entry to `LESSONS.md`. Update `HANDOFF.md` when a feature's status changes (started/in-progress/done).
