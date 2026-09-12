# Lessons

Pitfalls hit on this project and how they were resolved, so nobody hits them twice. Add an entry when something non-obvious cost real time to figure out — not for routine bugs.

Format per entry:

```
## <short title>

**Date**: YYYY-MM-DD
**What happened**: <symptom>
**Cause**: <root cause>
**Fix / avoidance**: <what to do instead, going forward>
```

## Prisma CLI doesn't load .env.local

**Date**: 2026-09-12
**What happened**: `npx prisma db push` failed with `Environment variable not found: DIRECT_URL`, even though it's set in `.env.local` and the app itself (via Next.js) reads it fine.
**Cause**: Next.js auto-loads `.env.local`, but the Prisma CLI only auto-loads a plain `.env`. Two different tools, two different env-loading conventions.
**Fix / avoidance**: Keep a root `.env` with just `DATABASE_URL`/`DIRECT_URL`, duplicated from `.env.local`. Keep the two in sync by hand when either changes.

## `prisma db push` fails with a misleading P1014 error on a very different existing schema

**Date**: 2026-09-12
**What happened**: Pushing a brand-new schema onto a Supabase database that still held an old, unrelated schema (32 tables from a previous version of the project) failed with `P1014: The underlying table for model X does not exist` — a confusing error, since the tool was being asked to create that table, not read it.
**Cause**: `db push`'s diffing engine doesn't handle a large structural gap between the current DB and the target schema well in one shot, especially with enum type changes mixed in.
**Fix / avoidance**: When replacing a schema wholesale (not incrementally evolving one), drop the old tables and enum types explicitly first via `prisma db execute --file <script>`, then `db push` onto the now-clean schema. Don't try to fix a P1014 by tweaking the new schema — it's usually not about the new schema at all.

## `useFormState`-driven forms don't auto-refresh the page after a successful action

**Date**: 2026-09-12
**What happened**: Scheduling a class, uploading a resource, and recording a payment all saved correctly (confirmed in the database) but the visible list on the page stayed stale until a manual reload — even though the server action called `revalidatePath()`.
**Cause**: A plain `<form action={serverAction}>` (no `useFormState`) gets an automatic page refresh from Next.js after the action completes. A form wrapped in `useFormState` (needed to show validation errors inline) doesn't get that automatic refresh for free.
**Fix / avoidance**: In the client component using `useFormState`, add a `useRouter()` + `useEffect` that calls `router.refresh()` when the returned state indicates success (`state && !state.error`). Applied in `AddClassForm`, `UploadResourceForm`, `NewPaymentForm`.

## Login redirected to the public homepage instead of the user's dashboard

**Date**: 2026-09-12
**What happened**: After a successful login, the app showed the public marketing homepage (with "Log in"/"Register" buttons) instead of the logged-in user's dashboard — only caught by actually clicking through the app in a browser, not by typecheck/build.
**Cause**: `src/middleware.ts` only redirected an already-logged-in user away from `/login` and `/register`; it didn't do the same for `/`, the login page's own post-login redirect target.
**Fix / avoidance**: Include `/` in the set of routes a logged-in user gets bounced away from (to their role's dashboard) in the middleware. General lesson: a route a form redirects to after success needs the same "logged-in user shouldn't land here" treatment as the auth pages themselves.

## A submit button with no pending state invites duplicate submissions

**Date**: 2026-09-12
**What happened**: "Create batch" was clicked 6 times in a row, creating 6 duplicate batches in the database — not a click-automation glitch, a real user click, on the (then-slow) environment where the request legitimately took 3-4 seconds. The button gave no visual feedback while submitting, so a working-but-slow request looked identical to a broken one, and got clicked again.
**Cause**: The shared `SubmitButton` component (`src/components/form.tsx`) had no disabled/pending state at all.
**Fix / avoidance**: Added `useFormStatus()` from `react-dom` inside `SubmitButton` to disable it and show "Please wait…" while its parent form is submitting. Because it's a shared component, this fixed every form at once (teacher creation, class scheduling, resource upload, payments) rather than needing a fix per form. General lesson: any submit button backed by a network request needs a pending state before it ships, not after someone hits it twice by accident.

## Moving the project directory mid-session can break the agent's shell

**Date**: 2026-09-12
**What happened**: The project was moved from an iCloud-synced folder to a local one (`mv` to a new path) to fix disk-I/O slowness. Immediately after, every subsequent shell command failed with `ENOTDIR: not a directory, posix_spawn '/bin/zsh'` — the coding agent's persistent shell process had cached the old (now-deleted) directory as its working directory, and couldn't even spawn a new shell to `cd` out of it. File read/write tools kept working fine (they don't depend on the shell's cwd); only shell/terminal commands broke.
**Cause**: A shell process's working directory can't be changed by deleting the directory it's sitting in — the OS just fails future spawns from that stale cwd. This is a general OS/shell fact, not specific to any one tool.
**Fix / avoidance**: Worked around it for one specific task (updating a database row) by writing a temporary Next.js API route file and triggering it via a browser request — file tools and the already-running dev server were unaffected. The real fix is restarting the terminal/session so it launches fresh in the new directory. If a project directory must move while an agent session is active, expect the session's shell to need a restart afterward — don't assume file-tool success means shell commands still work too.

## This project's disk (iCloud-synced Documents folder) intermittently hangs long-running file operations

**Date**: 2026-09-12
**What happened**: `rm -rf .next`, `next build`, and individual dev-server route compilations have each, at different points, hung for 30s or more with the process sitting at ~0% CPU — not slow, genuinely stalled.
**Cause**: The project lives under `~/Documents`, which is iCloud Drive-synced on this machine; large/fast file operations appear to get throttled or blocked by the sync process.
**Fix / avoidance**: Before assuming a hang is a real bug, check `ps aux` for the relevant process's CPU time — if it's barely moving, it's the disk, not the code. Killing and restarting the dev server (`pkill` + relaunch) has reliably cleared every instance of this so far. Moving the project outside an iCloud-synced folder would likely fix this at the root, if it keeps being disruptive.
