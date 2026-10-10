# ISM Alappuzha Admin Workflow

Context document for building the admin side of the ISM Alappuzha website: the public Q&A system plus editable site content for issues, live video, programs, and dhikr and dua.

The project is a Next.js 16 App Router site backed by Supabase. This document describes who uses the admin panel, what they do, the screens required, the rules, the data model, server actions, and the recommended build order.

## 1. Purpose

The public site lets visitors ask Islamic questions without sharing a phone number or using WhatsApp. Questions land in a private admin panel. Authorised ISM members read each question, write a reply, and decide whether the reply goes only to the asker or is also published for everyone.

The admin panel is the only part of the system that requires login. Visitors never create accounts.

## 2. Roles

| Role | Who | Can do |
| --- | --- | --- |
| Admin | Appointed ISM district members | View all questions, write drafts, send replies, publish or unpublish, archive spam, manage the admin list |
| Reviewer | Optional scholar or senior member | View questions, edit drafts, approve answers for sending |

If the client does not want a review step, every Admin can send directly. The data model supports both choices, so this can be decided later with a single setting.

Access is controlled by an allowlist of emails stored in the `admins` table. Signing up through Supabase Auth is not enough; the email must also be on the allowlist.

## 3. Question Lifecycle

Every question has one status at a time.

| Status | Meaning | Next steps |
| --- | --- | --- |
| `pending` | New, nobody has touched it | Draft a reply, archive |
| `draft` | A reply is written but not sent | Edit, send or submit for review, archive |
| `answered` | Reply sent and visible through Check Status | Edit and resend, publish, unpublish |
| `archived` | Spam, duplicate, or out of scope | Restore to pending |

Flow:

```text
submitted -> pending -> draft -> answered
                 \-> archived -> restore -> pending
```

Publishing is a separate flag, `is_published`, on an answered question. It is not a status because an answered question can be published and unpublished many times.

## 4. Hard Rules

1. A private question can never be published. This must be enforced by a database check constraint and by the UI. The Publish control is disabled and explains why.
2. Only allowlisted admins can read the questions table. Visitors never touch the database directly; all public access goes through server routes.
3. A reply is never visible to the asker until the status is `answered`. Drafts stay internal.
4. Replies are never sent from the browser. Email sending happens server-side only.
5. Every state-changing action is written to an audit log.
6. The asker's email is shown to admins but never included on the public page.
7. Every admin screen and action requires a session verified with an authenticator app code (`aal2`). A password alone never opens the panel.

## 5. Screens

### 5.1 Login: `/admin/login`

- Email and password, or magic link, through Supabase Auth.
- After login, the server checks the email against `admins`.
- If the email is not listed, sign the user out and show: "This account does not have admin access. Ask an existing admin to add your email."
- Rate-limit login attempts.
- Show one generic error for wrong credentials.

Two-step verification:

- Required for every admin.
- Uses Supabase Auth built-in TOTP multi-factor authentication.
- Must work with Google Authenticator, Authy, and Microsoft Authenticator.
- After the password step, send the admin to `/admin/login/verify` to enter the 6-digit code.
- Only a verified `aal2` session opens the panel.
- A new admin with no authenticator is sent to `/admin/login/setup`, which shows a QR code and text setup key.
- `/admin/security` lets an admin add a second device or remove an old one.

### 5.2 Inbox: `/admin`

The working screen.

Required list features:

- Filters by status: Pending, Draft, Answered, Archived.
- Default filter: Pending.
- Extra filters: category, private only, published only, has email.
- Search across ticket ID and question text.
- Sort newest first by default.
- Sort oldest first for clearing a backlog.
- Counts per status at the top.
- Pagination of 25 per page.

Each row shows:

- Ticket ID.
- Category.
- Two-line question preview.
- Submitted time.
- Markers for Private, Has email, and Published.

Empty state for Pending:

```text
No new questions. Check back later or review drafts.
```

### 5.3 Question Detail: `/admin/questions/[id]`

Two columns on desktop, stacked on mobile.

Left column: the question.

- Ticket ID.
- Category.
- Submitted time.
- Asker name, or "Anonymous".
- Email, or "No email given".
- Full question text.
- Badges for Private and Published.
- Internal notes box visible to admins only.
- Activity timeline from the audit log.

Right column: the reply.

- Reply editor.
- Malayalam input must work and render with the site's Malayalam font.
- Arabic text inside the reply must render right-to-left correctly.

Buttons:

- Save draft: stores the text and sets status to `draft`.
- Send reply: stores the text, sets status to `answered`, stamps `answered_at` and `answered_by`, and sends an email if the asker gave one.
- Archive: moves to `archived` with an optional reason.

Publishing:

- Publish toggle is shown only after the question is answered.
- Publish toggle is disabled with an explanation when the question is private.

If the asker gave no email, show this notice above the Send button:

```text
This person did not leave an email. They will see this reply only by entering their Ticket ID under Check Status.
```

Confirmation dialog on Send:

```text
Send this reply to the asker? They will be able to read it immediately.
```

### 5.4 Published Manager: `/admin/published`

A focused list of published questions.

Capabilities:

- Unpublish.
- Edit public wording.
- When publishing, the admin can edit a public version of the question without changing the original.
- The public version can be trimmed, anonymised, and spelling-fixed.
- The public accordion shows the public version only.

### 5.5 Admins: `/admin/team`

Visible to Admins only.

Capabilities:

- List admin emails with role and date added.
- Add an email.
- Change a role.
- Remove access.

Rules:

- An admin cannot remove themselves.
- The last remaining Admin cannot be removed.

### 5.6 Navigation and Content Areas

The admin panel has one sidebar with these areas. Each content area replaces a static file under `src/data` with a screen admins can edit without a developer.

| Area | Route | Replaces | Who can use it |
| --- | --- | --- | --- |
| Questions | `/admin` | Manual database edits | Admin, reviewer |
| Latest issues | `/admin/issues` | `src/data/issues.ts`, `issues.json` | Admin |
| Live broadcast | `/admin/live` | `src/data/live.ts` live status | Admin |
| Upcoming programs | `/admin/programs` | `src/data/live.ts` next program | Admin |
| Dhikr and dua | `/admin/dhikr` | `src/data/dhikr.ts`, `dhikr.json` | Admin, reviewer |
| Team and Security | `/admin/team`, `/admin/security` | None | Admin; security page for everyone |

### 5.7 Latest Issues: `/admin/issues`

Publishes the monthly magazine shown in the Latest Issue section and archive carousel.

Required behavior:

- List all issues newest first, with the featured one marked.
- Add issue fields: title, issue date, short description, cover image upload, PDF upload.
- Cover accepts JPG, PNG, or WebP.
- PDF accepts PDF files only, up to 25 MB. Limit must be confirmed with the client.
- Files are checked on the server and stored in Supabase Storage under random file names.
- Exactly one issue is featured at a time.
- Featuring a new issue unfeatures the previous one in the same step.
- Previous featured issue moves into the archive carousel automatically.
- Status is Draft or Published.
- Drafts never appear on the site.
- Preview shows the cover card and opens the PDF the same way visitors will see it.
- Admins can edit, replace the PDF, unpublish, or delete an issue.
- Deleting removes stored files too, after confirmation.

### 5.8 Live Broadcast: `/admin/live`

Controls the Live Now section on the homepage.

Fields:

- YouTube link.
- Title.
- Speaker.

Required behavior:

- Admin can paste any YouTube watch, youtu.be, or live URL.
- System extracts the video ID and shows an embedded preview before saving.
- Links from other sites are rejected with: "Paste a YouTube link, for example https://youtu.be/..."
- Go live saves the details and switches the homepage to the live embed.
- End broadcast switches the homepage back to the next program card.
- Link is kept in a history list so the admin can reuse it.
- Screen shows the current state in plain words: "Homepage is showing: Live now" or "Homepage is showing: Next program".

### 5.9 Upcoming Programs: `/admin/programs`

Controls the date, time, speaker, and venue shown on the Live Now card when nothing is live.

Required behavior:

- Two tabs: Upcoming and Past.
- Upcoming is sorted by date, soonest first.
- Add program fields: title, speaker, date, start time, venue, optional description, optional link, optional poster image.
- All times are entered and shown in Indian Standard Time.
- Homepage shows the earliest scheduled program that has not started.
- By default, a program leaves the homepage 3 hours after its start time and moves to Past.
- Cancel marks a program cancelled and removes it from the homepage.
- Changing a date is a normal edit.
- Duplicate copies a program for recurring events.
- Use for live broadcast opens the Live broadcast screen with title and speaker filled in.

### 5.10 Dhikr and Dua: `/admin/dhikr`

Manages the library on the homepage and `/dhikr`.

Required behavior:

- Searchable list.
- Filters by category and status: Draft or Published.
- Drag-to-reorder within a category.
- Entry fields: title, category, Arabic text, transliteration, Malayalam meaning, reference, repeat count, occasion.
- Arabic field is right-to-left and uses the site's Arabic font.
- Malayalam field uses the site's Malayalam font.
- Live preview shows the entry as visitors will see it.
- Publish button stays disabled until a reviewer's name and review date are filled in.
- Reviewer account can mark an entry reviewed.
- Admin can publish after review.
- Editing a published entry returns it to Draft until reviewed again.
- Duplicate and delete are available.
- Delete asks for confirmation.
- One-time Import loads existing `dhikr.json` entries as drafts.

## 6. Core Workflows

### 6.1 Answering a New Question

1. Admin signs in and lands on Inbox filtered to Pending.
2. Opens a question.
3. Reads it and adds an internal note if needed.
4. Writes the reply and clicks Save draft, if desired.
5. Clicks Send reply and confirms.
6. System sets status to `answered`, records who answered, and sends an email if the asker gave one.
7. If no email exists, the answer is readable under Check Status.
8. Admin optionally publishes the answer, only possible for non-private questions.

### 6.2 Reply With Review Step

1. Admin saves a draft and clicks Submit for review.
2. Status stays `draft`; `needs_review` becomes true.
3. Reviewer sees a Needs review filter in the Inbox.
4. Reviewer opens the draft, edits, and clicks Approve and send.
5. The send step then runs exactly as in 6.1.
6. Audit log records both drafter and approver.

### 6.3 Publishing a General Question

1. Open an answered, non-private question.
2. Click Publish.
3. Dialog asks for the public wording of the question, prefilled with the original and name removed.
4. Dialog shows a final check of the answer text.
5. Confirm.
6. System sets `is_published = true`, sets `published_at`, and saves `public_question`.
7. Question appears in the homepage Q&A accordion.
8. Unpublish reverses it immediately.

### 6.4 Handling Spam or Duplicates

1. Archive with a reason: Spam, Duplicate, or Out of scope.
2. Duplicate reason can link to the original.
3. Archived questions never appear publicly and never trigger email.
4. Restore returns the question to `pending`.

### 6.5 Correcting a Sent Reply

1. Edit the reply on an answered question and click Send correction.
2. New text replaces the old text on Check Status.
3. If the asker has an email, send a corrected email with a line saying it replaces the earlier reply.
4. Audit log keeps both versions.

### 6.6 Deleting Data

Admins can permanently delete a question on request from the asker. This is a separate, confirmed action that removes the row and writes an audit entry containing only the ticket ID and the admin who deleted it.

### 6.7 Signing in With Two-Step Verification

First sign-in for a new admin:

1. An Admin adds the new email on the Team page.
2. New admin signs in with email and password.
3. Session is at `aal1`, and the panel stays locked.
4. Setup page shows QR code and setup key.
5. Admin scans it in Google Authenticator and types the 6-digit code to confirm.
6. Session moves to `aal2`, and Inbox opens.

Every later sign-in:

1. Enter email and password.
2. Enter the current 6-digit code from the authenticator app.
3. Inbox opens.

Lost phone:

1. If the admin enrolled a second device, they sign in with it and remove the lost one on Security.
2. If not, another Admin removes their authenticator on Team using a server action calling the Supabase admin API.
3. Audit entry is written.
4. At next sign-in, the person enrols a new device.
5. Supabase does not issue recovery codes, so this reset path is the recovery plan.

### 6.8 Publishing a New Issue

1. Open Latest issues and click Add issue.
2. Fill title, date, description, cover, and PDF.
3. Check preview and save as Draft.
4. Click Publish.
5. Switch on Featured if it is the newest issue.
6. Homepage updates within a minute: featured card changes and old issue joins the archive.

### 6.9 Going Live

1. Before the event, create the program under Upcoming programs.
2. When the stream starts on YouTube, copy its link.
3. Open Live broadcast, paste the link, and check preview.
4. Click Go live.
5. Homepage switches to the embedded stream.
6. When the event ends, click End broadcast.
7. Homepage shows the next program again.

### 6.10 Adding an Upcoming Program

1. Open Upcoming programs and click Add program.
2. Enter title, speaker, date, start time in IST, and venue.
3. Save.
4. Homepage shows it when it is the earliest upcoming program.
5. To change the date later, edit the program.
6. To call it off, click Cancel.

### 6.11 Adding or Editing a Dhikr or Dua

1. Open Dhikr and dua and click Add entry, or open an existing entry.
2. Enter Arabic, transliteration, Malayalam meaning, reference, and repeat count.
3. Check preview.
4. Save as Draft.
5. Reviewer checks the text and records their name and review date.
6. Admin clicks Publish.
7. Entry appears on homepage library and `/dhikr`.
8. Any later edit returns the entry to Draft and repeats review/publish.

## 7. Data Model

### Questions Additions

Extends the existing `questions` table.

```sql
alter table questions
  add column status text not null default 'pending'
    check (status in ('pending','draft','answered','archived')),
  add column draft_answer text,
  add column answer text,
  add column answered_by uuid references auth.users(id),
  add column answered_at timestamptz,
  add column needs_review boolean not null default false,
  add column internal_notes text,
  add column archive_reason text,
  add column public_question text,
  add column is_published boolean not null default false,
  add column published_at timestamptz;

alter table questions
  add constraint private_never_published
  check (not (is_private and is_published));
```

### Admins

```sql
create table admins (
  email text primary key,
  role text not null default 'admin' check (role in ('admin','reviewer')),
  added_by text,
  created_at timestamptz default now()
);
```

### Audit Log

```sql
create table audit_log (
  id bigint generated always as identity primary key,
  question_id uuid,
  ticket_id text,
  actor_email text not null,
  action text not null,
  detail jsonb,
  created_at timestamptz default now()
);
```

Actions include:

- `draft_saved`
- `reply_sent`
- `published`
- `unpublished`
- `archived`
- `restored`
- `deleted`
- `correction_sent`

### Email Log

```sql
create table email_log (
  id bigint generated always as identity primary key,
  question_id uuid,
  to_email text not null,
  kind text not null,
  status text not null,
  error text,
  created_at timestamptz default now()
);
```

Email kinds:

- `reply`
- `correction`

Email statuses:

- `sent`
- `failed`

### RLS

```sql
alter table admins enable row level security;
alter table audit_log enable row level security;
alter table email_log enable row level security;
```

No public policies. All access uses server routes/actions with the service role.

### Content Tables

```sql
create table issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issue_date date not null,
  description text,
  cover_path text not null,
  pdf_path text not null,
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz default now()
);

create unique index one_featured_issue on issues (is_featured) where is_featured;

create table live_status (
  id int primary key default 1 check (id = 1),
  is_live boolean not null default false,
  youtube_id text,
  title text,
  speaker text,
  updated_by text,
  updated_at timestamptz default now()
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  speaker text,
  starts_at timestamptz not null,
  venue text,
  description text,
  link_url text,
  poster_path text,
  status text not null default 'scheduled' check (status in ('scheduled','cancelled')),
  created_at timestamptz default now()
);

create table dhikr_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  arabic text not null,
  transliteration text,
  malayalam text,
  reference text,
  repeat_count text,
  occasion text,
  sort_order int not null default 0,
  status text not null default 'draft' check (status in ('draft','published')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  constraint published_needs_review
    check (status <> 'published' or (reviewed_by is not null and reviewed_at is not null))
);

alter table audit_log
  add column entity text not null default 'question',
  add column entity_id text;

alter table issues enable row level security;
alter table live_status enable row level security;
alter table programs enable row level security;
alter table dhikr_entries enable row level security;
```

Public reads go through server code. Storage buckets are public-read for published files only.

Switching the featured issue runs as one database function so the unique index is never broken halfway.

## 8. Server Actions and Routes

All admin actions live under `/admin` and run on the server. Each begins with the same guard:

1. Get the Supabase session.
2. Check that the session is `aal2`.
3. Look up the user's email in `admins`.
4. Reject if missing.
5. Check the role for the action.

### Question Actions

| Action | Role needed | Effect |
| --- | --- | --- |
| `listQuestions(filters, page)` | admin, reviewer | Filtered, paginated list |
| `getQuestion(id)` | admin, reviewer | Full record plus audit timeline |
| `saveDraft(id, text)` | admin, reviewer | Sets `draft_answer`, status `draft`, audit entry |
| `submitForReview(id)` | admin | Sets `needs_review` |
| `sendReply(id, text)` | admin, or reviewer when review is on | Sets answer, status answered, sends email, audit entry |
| `sendCorrection(id, text)` | admin | Updates answer, sends correction email |
| `publish(id, publicQuestion)` | admin | Sets `is_published`; refuses when private |
| `unpublish(id)` | admin | Clears `is_published` |
| `archive(id, reason)` / `restore(id)` | admin | Changes status |
| `deleteQuestion(id)` | admin | Hard delete plus audit entry |
| `addAdmin` / `setRole` / `removeAdmin` | admin | Manages allowlist |

The public `GET /api/qa/published` route must return only:

- `public_question`
- `answer`
- `category`

It must filter by:

- `is_published = true`
- `is_private = false`

### 8.1 Content Actions

Same guard as the question actions: signed-in `aal2` session, email on allowlist, role checked. Every action writes to `audit_log` with the entity name.

| Action | Role needed | Effect |
| --- | --- | --- |
| `saveIssue` / `publishIssue` / `setFeaturedIssue` / `deleteIssue` | admin | Manages issues and their files |
| `setLive(youtubeUrl, title, speaker)` | admin | Validates link, extracts ID, marks live |
| `endLive()` | admin | Marks offline |
| `saveProgram` / `cancelProgram` / `duplicateProgram` | admin | Manages programs |
| `saveDhikr` / `reorderDhikr` / `deleteDhikr` | admin, reviewer | Saves entries as Draft |
| `markDhikrReviewed(id)` | reviewer, or admin | Records reviewer and date |
| `publishDhikr(id)` / `unpublishDhikr(id)` | admin | Refused unless entry is reviewed |

### 8.2 Public Site Reads

- Homepage and `/dhikr` read published rows on the server instead of files under `src/data`.
- After every admin save, the action revalidates affected pages so changes appear within about a minute.
- Live status uses a shorter cache, around 30 seconds, because it changes during events.
- If the database is empty or unreachable, the site falls back to bundled `src/data` files.
- Only published, reviewed content is ever returned to visitors.

## 9. Email Behaviour

Provider:

- Resend or SMTP through Nodemailer, configured in `.env`.

Triggered only by:

- `sendReply`
- `sendCorrection`

Rules:

- Send only when the question has an email.
- Email content includes the asker's original question, reply, ticket ID, and a one-line note that this reply came from ISM Alappuzha.
- Do not include admin personal details.
- Send email after the database update succeeds.
- If sending fails, keep the reply saved, record failure in `email_log`, and show: "Reply saved, but the email could not be sent. The asker can still read it using their Ticket ID. Retry email."
- Retry email button re-sends from the detail screen.

## 10. Security Checklist

- Supabase service-role key used only in server code, never exposed to client.
- Next.js 16 `proxy.ts` redirects unauthenticated requests under `/admin` to login. This is a convenience layer; the real check is the guard inside every action.
- Sessions in secure, httpOnly cookies via `@supabase/ssr`.
- CSRF safety through Server Actions; no state changes on GET.
- Sanitise reply text on output.
- Render reply text as plain text with line breaks, not raw HTML.
- Add `X-Robots-Tag: noindex` and `robots.txt` disallow for `/admin`.
- Rate-limit login and public status endpoint using Upstash or a Supabase table, not in-memory counters.
- Never log email addresses or question text in application logs.
- TOTP is mandatory.
- Guard rejects any session below `aal2`, both in `proxy.ts` and inside every action.
- Service role bypasses database policies, so the `aal2` check must live in server code and not rely on RLS alone.
- Each admin enrols a second authenticator device or stores the setup key in a password manager.
- Rate-limit code attempts on the verify page.

## 11. Edge Cases

| Situation | Behaviour |
| --- | --- |
| Two admins open the same question | Show "Being edited by X" using `updated_at` checks; saving with stale version warns before overwriting |
| Admin tries to publish a private question | Blocked in UI and by database constraint |
| Asker used a fake email | Email fails or bounces; log records it; Check Status still works |
| Asker lost ticket ID and gave no email | Cannot be recovered; stated on success screen |
| Reply contains Arabic or Malayalam | Editor and preview use site fonts; preview before sending |
| Question includes personal or sensitive details | Admin can edit public version on publish; original stays private |
| Supabase not configured locally | Admin panel shows "Database not configured" instead of crashing |

## 12. Build Order

1. Database migration for questions columns, admins, audit log, and email log.
2. Supabase Auth setup: enable TOTP MFA, seed first admin email, and write server-side guard that checks allowlist and `aal2`.
3. Login page, authenticator setup page, code verification page, and `proxy.ts` redirect.
4. Inbox list with filters and counts.
5. Question detail with draft, send, archive, and notes.
6. Email sending, email log, and retry.
7. Publish and unpublish with public wording, plus updated public route.
8. Published manager, Team page, lost-authenticator reset, and Security page.
9. Content migration for issues, live status, programs, dhikr, storage buckets, and public-site database reads with file fallback.
10. Live broadcast screen.
11. Upcoming programs.
12. Latest issues with cover and PDF uploads.
13. Dhikr and dua management with review gate and one-time import.
14. Audit timeline, optional answer review step, and polish.
15. Tests:
    - Guard rejects non-admins and `aal1` sessions.
    - Private questions can never publish.
    - Reply visible only after answered.
    - Email failure keeps reply saved.
    - Unreviewed dhikr cannot publish.
    - Only one issue is featured.
    - Only YouTube links are accepted.

## 13. Decisions Needed From the Client

1. Is a scholar review step required before replies go out, or can any admin send directly?
2. How many admins are needed, and who are they by name and email?
3. Which email address should replies come from, for example `qa@<domain>`?
4. Does ISM already have a domain and mail provider?
5. Should askers be able to request deletion of their question, and who handles it?
6. Should the homepage show a last answered count or any statistics?
7. Will every admin use an authenticator app, and which admin is the backup who can reset a lost device?
8. Should some members manage content only without seeing questions? This would add a content editor role.
9. Can the client supply issue PDFs and covers, and what is the usual PDF size?
10. Should finished live broadcasts be saved to Speeches and Videos?
11. Should admins also manage the Speeches and Videos carousel from the panel?
