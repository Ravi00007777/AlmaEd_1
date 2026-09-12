# AGENTS.md

Tool-agnostic guidance for any AI coding agent (Claude Code, Copilot, Cursor, Gemini CLI, etc.) working in this repo. `CLAUDE.md` at the repo root just points here — keep this file the source of truth.

Read `ARCHITECTURE.md` first — it has the actual design decisions (scope, roles, domain glossary, what's deliberately out of scope). This file is the map of what exists in code; that file is why it exists.

## Commands

```bash
npm run dev              # start dev server
npm run build             # production build
npm run typecheck          # tsc --noEmit
npm run lint               # next lint
npm run db:push             # push prisma schema to Supabase (no migration files yet)
npm run db:migrate           # prisma migrate dev (would create prisma/migrations/)
npm run db:studio            # Prisma Studio GUI
npm run db:seed               # tsx prisma/seed.ts, creates the first admin
```

`postinstall` runs `prisma generate` automatically. Node >= 20 required.

Two Prisma CLI gotchas hit while setting this up, worth knowing before you rediscover them the hard way:
- The Prisma CLI only auto-loads `.env`, not `.env.local` (Next.js loads both). That's why a root `.env` exists holding just `DATABASE_URL`/`DIRECT_URL` — keep it in sync with `.env.local` by hand.
- `prisma db push` can fail with a confusing `P1014: The underlying table for model X does not exist` when the target database's current schema is very different from the one being pushed (e.g. pushing onto a database that still has an old, unrelated schema). It's not telling the truth about what's wrong. The fix is to drop the old tables/enum types explicitly first (`prisma db execute --file <script>`), then push onto a clean schema, rather than trusting `db push`'s diffing across very different schemas.

## Architecture

**Three roles, enforced in `src/middleware.ts`**: `ADMIN`, `TEACHER`, `STUDENT` (a student's account is shared with their parent — there is no separate parent role, see `ARCHITECTURE.md`). The middleware redirects an unauthenticated request to `/login`, and confines a logged-in user to their own `/admin`, `/teacher`, or `/student` route prefix — pages don't need to re-check role for basic access, but data queries still must filter by the current user's id (a teacher's page must never fetch another teacher's batch by trusting a URL param alone — see the `notFound()` ownership checks in `teacher/batches/[id]/page.tsx` and `student/batches/[id]/page.tsx` for the pattern).

**Route groups**:
- `(auth)/{login,register}` — public. Only students self-register (`register/actions.ts`); teacher accounts are created by admin (`admin/teachers/actions.ts`), there's no public teacher signup.
- `(dashboard)/admin/{teachers,students,batches,payments}` — admin CRUD. Batches are the unit admin actually schedules: one teacher, one or more students, one persistent Meet link (`admin/batches/actions.ts`).
- `(dashboard)/teacher` — a teacher's own batches, their upcoming classes, and resource (assignment/test/note) uploads to Supabase Storage (`teacher/batches/[id]/actions.ts`).
- `(dashboard)/student` — a student's own batches, classes, and resources. Payment status is intentionally admin-only, not shown here — see `ARCHITECTURE.md`'s "Core flows".

**Auth** (`src/lib/auth.ts`): NextAuth v5, Credentials provider only, JWT session strategy (no database sessions — Credentials + adapter sessions don't mix in NextAuth). `role` and `id` are threaded from the DB user through the `jwt` and `session` callbacks; see `src/types/next-auth.d.ts` for the type augmentation that makes `session.user.role` typed instead of `any`.

The config is split in two: `src/lib/auth.config.ts` (no providers, Edge-safe) and `src/lib/auth.ts` (adds the Credentials provider, which pulls in `bcryptjs` and Prisma — both Node-only). `src/middleware.ts` builds its own `NextAuth(authConfig)` instance from the Edge-safe config instead of importing `auth.ts` directly, because middleware runs in the Edge Runtime and bundling `bcryptjs` into it produces build warnings (harmless at first, but the kind of thing that turns into a real break on a future Next.js version). If you add a new provider or callback, decide which file it belongs in — anything Node-only goes only in `auth.ts`, never in `auth.config.ts`.

**Forms use Server Actions, not API routes** — e.g. `admin/batches/new/form.tsx` calls `createBatch` directly. A form driving `useFormState` needs its action shaped `(prevState, formData) => result`; a plain `<form action={fn}>` with no `useFormState` needs `fn` shaped `(formData) => void` — mixing these up is a real TypeScript error (see `cancelClass` vs `addClass` in `admin/batches/actions.ts` for the two working shapes side by side).

**File uploads** go straight from a Server Action to Supabase Storage using the service-role client in `src/lib/supabase.ts` (`supabaseAdmin` — never expose that key to the browser). The bucket (`resources`, from `RESOURCES_BUCKET`) must exist and be public before uploads/downloads will work — it is not created by code.

**Class reminders**: `src/app/api/cron/class-reminders/route.ts`, triggered by Vercel Cron every 15 minutes (`vercel.json`), guarded by a `CRON_SECRET` bearer token — not by NextAuth, since Vercel's scheduler isn't a logged-in user. It emails everyone in a batch when a `Class` is starting within 30 minutes, and stamps `Class.reminderSentAt` so it never double-sends.

**Prisma schema** (`prisma/schema.prisma`) is the source of truth for the domain — `ARCHITECTURE.md`'s "Domain glossary" section explains the naming choices (`Resource` instead of separate `Assignment`/`Test` tables, `Batch`/`BatchStudent` instead of a separate `Enrollment` table) before you go looking for entities that don't exist under those names.

## Where to look for more context

- `HANDOFF.md` — current state of the project, what's in progress, what's not started.
- `LESSONS.md` — pitfalls hit before, so they aren't hit again.
- `CONTRIBUTING.md` — environment setup, branch/commit conventions.

`CONTEXT.md` (root, not yet written) is reserved for the domain glossary if it ever needs to grow beyond what's already in `ARCHITECTURE.md` — don't create one casually; that requires deliberately disambiguating terms with the project owner, not guessing from the schema.
