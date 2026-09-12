# EdTech Platform

Connects teachers (college students) with learners (school students, whose account is shared with their parent) for online classes, assignments, and tests. See `ARCHITECTURE.md` for the full design — this covers only what's built.

## Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **DB**: PostgreSQL via Supabase, accessed through Prisma
- **File storage**: Supabase Storage (assignment/test PDFs)
- **Auth**: NextAuth (Auth.js v5), credentials-based
- **Email**: Resend (class reminders, via a Vercel Cron job)
- **Hosting**: Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values, see below
npm run db:push               # sync Prisma schema to your Supabase DB
npm run db:seed                 # creates the first admin account
npm run dev
```

App runs at `http://localhost:3000`.

### Environment variables

See `.env.example` for the full list. Key ones:

- `DATABASE_URL` / `DIRECT_URL` — Supabase Postgres. `DATABASE_URL` must be the **pooled** connection string (port 6543, `pgbouncer=true`) — see `ARCHITECTURE.md`'s "Tech stack" section for why.
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — for Storage uploads. The service-role key is server-only, never exposed to the client — keep it out of any `NEXT_PUBLIC_*` variable.
- `RESEND_API_KEY` / `EMAIL_FROM` — class reminder emails.
- `CRON_SECRET` — checked against the `Authorization` header on `/api/cron/*`, so only Vercel's scheduler (or you, manually, with the right header) can trigger reminders.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — used once by `npm run db:seed` to create the first admin account. Change the password after first login (there's no in-app password change yet — see `HANDOFF.md`).

Before deploying, create a public Supabase Storage bucket named `resources` (matches `RESOURCES_BUCKET` in `src/lib/supabase.ts`) — uploads will fail until it exists.

## Common commands

```bash
npm run dev          # dev server
npm run build         # production build
npm run typecheck      # tsc --noEmit
npm run lint            # next lint
npm run db:studio        # Prisma Studio GUI
npm run db:push           # push schema changes (no migration history yet)
```

## Project docs

- `ARCHITECTURE.md` — design decisions: scope, roles, domain glossary, data model, tech stack, what's deliberately out of scope for v1.
- `AGENTS.md` — architecture/conventions for AI coding agents (also a useful map for humans).
- `CONTRIBUTING.md` — environment setup, branch/commit conventions.
- `HANDOFF.md` — current state: what's built, what's not, open questions.
- `LESSONS.md` — pitfalls hit before and how they were resolved.
