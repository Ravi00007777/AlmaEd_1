# Architecture

This is the design for v1 of the platform, agreed before any code is written. It reflects decisions made in conversation with the project owner — where a decision was a judgment call rather than a hard requirement, the reasoning is included so it can be revisited later.

## Problem being solved

The admin currently schedules every class manually in Google Calendar/Meet, for every teacher-student pairing. That does not scale. The platform's core job is to remove that manual step: teachers and students each get a dashboard showing their scheduled classes, and joining a class is one click to the right Google Meet link — no per-class coordination by the admin.

Everything else (assignments/test PDFs, payment status, notifications) supports that core job; none of it should add back the coordination burden the platform exists to remove.

## Scope for v1

**In scope:**
- One brokerage business (this business), not a multi-tenant platform for other businesses.
- Web app only (no native mobile app).
- Google Meet links are created manually by admin in their own Google account and pasted into the platform once per teacher-batch pairing — not auto-generated via the Google Calendar API. This avoids Google OAuth/API integration entirely for v1, while still fixing the actual pain point (the admin no longer re-coordinates a link for every single class).
- Payments are tracked, not processed. The admin shares a payment channel (UPI ID / PayPal email / bank details) off-platform; students and teachers pay directly through it; the platform only records payment status (pending/paid), set manually by admin. No payment gateway integration in v1.
- Email notifications only (class reminders, new resource shared). SMS/WhatsApp deferred.
- Teachers are onboarded only by admin invite — no public teacher signup, since teachers work directly with minors and admin vets them first.
- Students are also onboarded only by admin — no public student signup either (revised after launch: open self-registration let anyone create a login, which the admin didn't want). A student's account is shared with their parent — one login used by either the student or the parent, not two separate accounts. There is no distinct "parent" role.
- Both group classes (a batch of students) and 1:1 classes are supported by the same data model — a "batch" of size 1 is a 1:1 class, so no separate code path is needed.

**Explicitly out of scope for v1** (revisit later if still needed):
- Payment gateway integration.
- Google Calendar/Meet API automation.
- SMS/WhatsApp notifications.
- Multi-tenant support for other brokerage businesses.
- Native mobile app.
- Public teacher self-registration.
- Public student self-registration (closed after launch — see Core flows).
- Separate parent role/dashboard.

## Roles

- **Admin** — full control: creates teacher accounts, forms batches, assigns teachers to batches, sets class schedules, records payment status, sends/monitors notifications. The only role that can see everyone's data.
- **Teacher** — logs in, sees their scheduled classes (across all their batches), joins via the batch's Meet link, sends resources (assignments/test PDFs) to their batches. Cannot see other teachers' batches, cannot see payment info, cannot see another student's private contact info beyond what a class roster requires.
- **Student** (shared with parent) — logs in, sees their own scheduled classes, joins via the Meet link, receives resources sent by their teacher(s). Cannot see other students' data, cannot see payment info at all — that's admin-only.

Privacy rule: teachers and students never see each other's private contact details (phone, address, email) directly. The admin is the only party who holds both sides' contact info; all coordination happens through the platform, not direct contact exchange.

## Domain glossary

Two terms from the original brief collide (both called "assignment" for different things), so this glossary uses distinct names to avoid that confusion in the schema and code:

- **Batch** — a group of one or more students, assigned to exactly one teacher, that shares a recurring class time and a single Meet link. Size 1 means a 1:1 class; size >1 means a group class. This is the unit the admin actually schedules.
- **Enrollment** — the record that links a Teacher to a Batch. Holds the persistent Google Meet link (set once by admin, reused for every class under this batch) and the recurring schedule (e.g. "Tue/Thu 5pm"). This is what the original brief called "teacher-student assignment" — renamed to avoid colliding with the homework-sharing feature below.
- **Class** — one scheduled occurrence of a Batch's recurring session: a specific date/time, with a status (scheduled / completed / cancelled). Inherits its Meet link from the Batch's Enrollment — no per-class link.
- **Resource** — a file a teacher shares with a batch: an assignment, a test, or a general note/material. One entity with a `type` field, rather than separate "Assignment" and "Test" entities, since they behave identically (a teacher uploads a PDF, the batch's students see it).
- **Payment** — a record of an amount owed by a student (or paid to a teacher) and its status, set manually by admin. Not a transaction the platform processes.
- **Doubt thread** — a private, one-on-one message thread between a single student and their batch's teacher (text and/or an image each way), not visible to other students in the batch. Admin can view any thread read-only. Not a general chat — scoped to one batch and one student at a time, added after launch by request.

## Data model (sketch)

```
User (id, role: ADMIN | TEACHER | STUDENT, name, email, phone, passwordHash, createdBy)
Batch (id, name, teacherId -> User, meetLink, scheduleRule)
BatchStudent (batchId -> Batch, studentId -> User)   -- join table, batch can have many students
Class (id, batchId -> Batch, scheduledAt, status: SCHEDULED | COMPLETED | CANCELLED)
Resource (id, batchId -> Batch, uploadedBy -> User(teacher), type: ASSIGNMENT | TEST | NOTE, fileUrl, title, createdAt)
Payment (id, studentId -> User, teacherId -> User, amount, status: PENDING | PAID, note, recordedBy -> User(admin), createdAt)
Notification (id, userId -> User, type, message, sentAt, channel: EMAIL)
```

`Enrollment` above is realized as `Batch.teacherId` + `BatchStudent` rather than a separate table, since a batch always has exactly one teacher — there's no case where the teacher-side of the relationship needs to exist independently of the batch.

Open question to revisit once building the schema for real: does a student need to belong to more than one batch at once (e.g. Math batch with Teacher A, Science batch with Teacher B)? The sketch above already supports it (a student can appear in multiple `BatchStudent` rows) — flagging so it isn't accidentally designed away later.

## Tech stack

- **Framework**: Next.js (App Router) + TypeScript — same as before, well-suited to an admin-heavy dashboard app.
- **Database**: PostgreSQL via Supabase (free tier), accessed through Prisma.
- **File storage**: Supabase Storage, for Resource PDFs — single provider alongside the DB, no separate storage vendor needed.
- **Auth**: NextAuth, credentials-based (email/password) — no OAuth needed since there's no public signup requiring a third-party identity provider.
- **Email**: Resend, for class reminders and "new resource shared" notifications. Needs a scheduled job (Vercel Cron) to check upcoming classes and fire reminder emails, since there's no calendar integration to hook into.
- **Hosting**: Vercel (free tier).

Risk to flag now, not a blocker: Supabase's free tier Postgres connection limit and Vercel's serverless function model don't mix well without connection pooling (Prisma + serverless can exhaust connections under load). Use Supabase's pooled connection string (port 6543, pgbouncer) for the app's `DATABASE_URL`, not the direct connection. Low risk at MVP scale, but worth setting up correctly from the start rather than discovering it under load.

## Core flows

**Student registration**: admin creates the student's account directly (name, email, phone, optional password — mirrors teacher onboarding), same as a teacher. Public self-registration existed at first but was closed: the admin wanted to vet who gets an account rather than let anyone sign up, the same reasoning already applied to teachers. A student with no password set can still log in via "Continue with Google" as long as their Google account's email matches the one admin entered. Account is usable by the student or their parent interchangeably — no separate parent flow. Admin later assigns the student to a batch.

**Teacher onboarding**: admin creates the teacher's account directly (no public signup) and shares credentials with them out of band.

**Scheduling a class**: admin creates a `Batch` (assigns a teacher, adds students, sets the Meet link once, sets the recurring schedule). The platform (or admin, manually for now) generates `Class` rows for upcoming occurrences.

**Joining a class**: student or teacher opens their dashboard, sees the list of upcoming `Class` rows, clicks one, gets redirected to the batch's Meet link. Same link for everyone in that batch.

**Sharing a resource**: teacher opens their batch, uploads a PDF, picks a type (assignment/test/note). All students in that batch see it in their dashboard.

**Payment tracking**: admin marks a student's payment as paid/pending manually. Payment status is admin-only — neither students nor teachers can see it in the app (the underlying payment itself happens off-platform between them, so they already know their own status without needing it in the UI).

**Notifications**: a scheduled job finds classes starting soon and emails the teacher and students in that batch. Additionally, the teacher and every student are emailed immediately when a batch is created (with the Meet link and schedule), and students are emailed immediately when a teacher uploads a new resource (with the deadline, if any, and a link to it).

**Asking a doubt**: student opens their batch, types a message and/or attaches an image, and sends it — visible to that batch's teacher only. Teacher replies the same way, from a per-student picker if they teach more than one student in that batch. Messages containing an email address or a phone-number-shaped digit run are rejected before saving, in either direction — the platform doesn't let teacher and student exchange direct contact details even here. Admin can view (not send in) any thread. No push notification for a new doubt/reply yet — the thread auto-refreshes every ~15s while open, but there's no email/notification if you're not looking at the page (unlike class reminders and resource shares).

## Still open (deliberately deferred, not forgotten)

- Exact recurring-schedule format for a Batch (RRULE-style vs simple day/time pairs) — decide when building the scheduling UI, not before.
- Whether `Class` rows are generated ahead of time in bulk (e.g. next 4 weeks) or lazily — an implementation detail, not an architecture decision.
- Whether a teacher can belong to multiple batches simultaneously (assumed yes, not yet confirmed explicitly).
