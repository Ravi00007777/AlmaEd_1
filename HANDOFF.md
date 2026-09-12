# Handoff

Current state of the project, for whoever picks this up next. Keep this updated as things move — it's the fastest way for a new contributor (human or AI) to know where things actually stand, without re-deriving it from the diff.

## Status: v1 verified end-to-end against a real Supabase project

Every core flow in `ARCHITECTURE.md` has actually been click-tested in a real browser against a real Supabase database — not just typechecked/built. Verified: student self-registration, admin-created teacher accounts, admin creates a batch (teacher + students + Meet link), admin schedules/cancels classes, teacher uploads a resource (confirmed the file is really in Supabase Storage and publicly downloadable), student sees their classes/resources, admin tracks payment status, and the class-reminder cron endpoint (confirmed it actually calls Resend without erroring, and stamps `reminderSentAt` so it won't double-send).

`npm run typecheck` and `npm run build` both pass clean (one benign upstream warning from `jose` about Edge Runtime compression APIs — cosmetic). `npm run lint` still hasn't been run to completion (kept hitting an interactive ESLint prompt that hung the session; `.eslintrc.json` exists now so it shouldn't prompt, just unconfirmed).

**Connected to a real Supabase project** (`azvmbeewzrgnexgxxcfl`). That project previously held a full, populated instance of the old deleted TutorConnect schema (32 tables, real row counts) — deliberately dropped (confirmed disposable test data) and replaced with the new schema via `prisma db push`. Admin account: `raviiit0007@gmail.com` / `12345678@` (changed from the `prisma/seed.ts` defaults — still no in-app way to change it, see below).

**Project location**: moved from `~/Documents/Default Project` (iCloud-synced, caused severe slowness — see `LESSONS.md`) to `~/Projects/edtech-platform` (local-only, not synced). Confirmed much faster after the move (route compiles went from 4–30+ seconds to ~1.2–1.5 seconds).

**Known cleanup needed**: `src/app/api/dev/update-admin/route.ts` is a disabled stub (returns HTTP 410) — it was a temporary one-off route used to update the admin's email/password directly through the browser when the session's shell tool broke (see `LESSONS.md`). It's harmless as-is but should be deleted, along with the empty `api/dev/` directory, next time a shell is available.

Bugs found and fixed during real click-through testing (typecheck/build didn't catch any of these — worth remembering that a green build isn't proof a flow works):
- Login redirected to the public homepage `/` instead of the role's dashboard — `src/middleware.ts` only redirected logged-in users away from `/login`/`/register`, not `/`. Fixed by including `/` in that redirect set.
- After scheduling a class, uploading a resource, or recording a payment, the page didn't visually update until a manual reload — the data was correctly saved (`revalidatePath` worked), but a `useFormState`-driven form submission doesn't automatically refresh the page the way a plain form action does. Fixed by adding a `router.refresh()` in a `useEffect` on the returned state, in `AddClassForm`, `UploadResourceForm`, and `NewPaymentForm`.
- The shared `SubmitButton` component gave no visual feedback while a submission was in flight. On the (then-slow, pre-move) environment, a single "Create batch" click that took 4 seconds looked like nothing happened, so it got clicked repeatedly — creating 6 duplicate batches in the database (cleaned up manually). Fixed by having `SubmitButton` use `useFormStatus()` to disable itself and show "Please wait…" while pending — this fixes every form using the shared button at once, not just batch creation.

Payment status is now admin-only (was previously also shown to the student on their batch page) — the student-facing payment section was removed by request; see `ARCHITECTURE.md`'s updated "Core flows"/roles wording.

**Google sign-in added** (students only, additive alongside email/password): `src/lib/auth.ts`'s `signIn` callback auto-registers a new Google account as a `STUDENT`, and rejects Google sign-in for any email that already belongs to a teacher/admin (keeps admin's teacher-vetting model intact). `User.passwordHash` is now nullable to support Google-only accounts; credentials login correctly rejects those instead of crashing. Verified end-to-end with a real Google account. The `GOOGLE_CLIENT_SECRET` in `.env.local` briefly touched a git-tracked file earlier in this project's history (never committed) — flagged to the project owner as worth rotating; not yet confirmed done.

Two CLI gotchas worth knowing if you hit them again: the Prisma CLI only auto-loads `.env`, not `.env.local` (Next.js loads both) — a root `.env` exists holding just `DATABASE_URL`/`DIRECT_URL`, duplicated from `.env.local`, keep them in sync manually. And `prisma db push` can throw a confusing `P1014` error when pushing a schema very different from what's currently in the DB in one shot — the fix that worked here was dropping the old tables/enum types explicitly first, then pushing onto a clean schema.

One more environment quirk hit repeatedly: this project's working directory appears to be on a slow-synced disk (iCloud Drive) — `rm -rf .next`, `next build`, and even individual dev-server route compiles have intermittently hung for 30s+ or longer with 0% CPU, resolved by killing and restarting the dev server. Not a code problem; just don't assume a hang is a bug before checking `ps` CPU usage on the `next-server`/`next dev` process.

## Done

- Prisma schema (`prisma/schema.prisma`): `User`, `Batch`, `BatchStudent`, `Class`, `Resource`, `Payment`, `Notification` — matches `ARCHITECTURE.md`'s data model sketch exactly.
- Auth: NextAuth v5, Credentials provider, JWT sessions, role-based middleware (`src/middleware.ts`), split into `auth.config.ts` (Edge-safe) + `auth.ts` (Node-only, Credentials provider).
- Admin: teacher creation, batch creation (with student picker), class scheduling/cancellation, payment tracking (create + toggle paid/pending) — all verified working live.
- Teacher: batch list with upcoming classes, resource upload to Supabase Storage — verified, including the uploaded file actually being fetchable.
- Student: batch list with upcoming classes and join links, resource list. No payment visibility (admin-only, by request).
- Cron: `/api/cron/class-reminders`, guarded by `CRON_SECRET`, wired into `vercel.json` — verified it runs, calls Resend, and stamps `reminderSentAt`.

## Not started / known gaps

- **No password reset or in-app password change.** The seed script prints the admin password to the console once; admin-created teacher passwords are set by the admin and shared out of band. There is no flow to change a password after that. Fine for a first pass with a handful of users, not fine to leave forever.
- **No bulk/recurring class generation.** Admin schedules each `Class` occurrence one at a time via a datetime picker — `ARCHITECTURE.md`'s "Still open" section flagged this as an implementation detail to decide later; it hasn't been decided, it's just manual for now.
- **No admin UI to remove a student from a batch or delete a batch** — only creation exists. Do this directly in `db:studio` for now if needed.
- **Payment amounts have no currency field** — `Payment.amount` is a bare `Decimal`. Fine while there's one currency in play; will need a real decision if that changes.
- **No automated tests.**
- **`.env.local` still has the old dependencies' variables** (Google OAuth, Razorpay, Google Calendar, OpenAI, WhatsApp, Sentry, platform commission) left over from before the architecture reset — harmless (nothing reads them) but worth cleaning up once someone's touching that file anyway.
- **NextAuth logs a `MissingCSRF` error on every sign-out** even though sign-out completes correctly (verified repeatedly in browser testing) — cosmetic log noise from the beta version of next-auth v5, not an actual failure. Worth re-checking against a stable next-auth v5 release later, not worth chasing now.

## Open questions

- Whether a teacher can be on multiple batches at once — the schema supports it, never explicitly confirmed as a real use case.
- Recurring-schedule format for a batch (`scheduleNote` is currently free text, not a structured rule) — revisit if admin actually needs the platform to auto-generate future `Class` rows instead of adding them by hand.

## How to update this file

When a feature moves state (not started → in progress → done), edit the relevant line. When you resolve an open question, remove it and note the resolution in `LESSONS.md` if it's worth remembering why.
