# Phase 0 Analysis

## Architecture Summary

This project is a Next.js 16.3.6 App Router application using TypeScript, Tailwind CSS v4, React 19.2.8, Supabase JS 2.117.2, Framer Motion, GSAP/Lenis, and React Three Fiber/Three.js. It uses the optional `src` directory and currently serves a public ISM Alappuzha website with mostly static/data-file-driven content.

`docs/admin-workflow.md` exists and is the admin requirements source of truth. `docs/design/` does not exist in this checkout, so Phase 0 derives the visual source of truth from `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`, and the existing component implementation.

Current public routes:

- `/` via `src/app/page.tsx`
- `/dhikr` via `src/app/dhikr/page.tsx`
- `/api/qa/ask` via `src/app/api/qa/ask/route.ts`
- `/api/qa/published` via `src/app/api/qa/published/route.ts`

Current homepage order:

1. `Hero`
2. `LiveNow`
3. `Videos`
4. `LatestIssue`
5. `NamazGuide`
6. `DhikrLibrary`
7. `QnASection`
8. `Leadership`
9. `Footer`

There are no current admin routes, no `proxy.ts`, no `middleware.ts`, no `loading.tsx`, no `error.tsx`, and no `not-found.tsx` files under `src/app`.

## Versions and Scripts

Installed direct package versions:

- `next`: `16.3.6`
- `react`: `19.2.8`
- `@supabase/supabase-js`: `2.117.2`
- `@supabase/ssr`: not installed

Scripts in `package.json`:

- `npm run dev` -> `next dev`
- `npm run build` -> `next build`
- `npm run start` -> `next start`
- `npm run lint` -> `eslint`

There is no explicit `typecheck` script and no `test` script.

## Next.js 16 Convention Check

Local Next docs confirm:

- `proxy.ts` replaces the old `middleware.ts` convention.
- `cookies()` and `headers()` are async.
- `params` and `searchParams` are async in pages, layouts, and route handlers.
- Route handler `context.params` is a promise.

Current repo status:

- No `proxy.ts` or `middleware.ts` exists.
- Current pages do not use route params or search params.
- Current route handlers do not use dynamic route params.
- Current code does not call `cookies()` or `headers()`.
- Route handlers use App Router `route.ts` files correctly.

## Environment Variable Decision

Canonical Supabase env names for Phase 1:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Do not use the legacy names:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The local env files expose the canonical variable names. Current code still expects the legacy anon/service-role names in `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`; Phase 1 must update those helpers and `.env.example` to the canonical names without printing or logging secret values.

First admin email:

```text
ismalappuzhaofficial@gmail.com
```

## Design Tokens

Design source: `docs/design/` is absent, so the design source for this analysis is `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`, and existing rendered components.

Global CSS tokens:

```text
--bg: #FFFFFF
--primary: #10241E
--primary-hover: #16302A
--primary-tint: rgba(16, 36, 30, 0.05)
--secondary: #C9A24B
--secondary-hover: #B8923B
--secondary-tint: rgba(201, 162, 75, 0.12)
--text-main: #111827
--text-muted: #4B5563
--border-subtle: rgba(16, 36, 30, 0.12)
--radius-card: 22px
--shadow-soft: 0 10px 30px -10px rgba(16, 36, 30, 0.08)
```

Tailwind names:

- `bg`
- `primary`, `primary-hover`, `primary-tint`
- `secondary`, `secondary-hover`, `secondary-tint`
- `text-main`
- `text-muted`
- `border-subtle`
- `font-display`
- `font-body`
- `font-arabic`
- `font-malayalam`
- `rounded-card`
- `shadow-soft`
- `shadow-floating`
- `max-w-site`

Visual palette:

- Dominant base: white.
- Primary: deep ink green.
- Accent: muted gold/brass.
- Support: gray text and subtle borders.
- Red appears only for live states and errors.
- Green/emerald appears for success states.
- Platform colors appear in media badges.

Important token mismatch:

- Some older primitives and unused placeholders reference inactive token names: `bg-background`, `text-foreground`, `bg-surface`, and `accent`.
- Affected files include `Button`, `Section`, `SectionHeading`, and unused sections such as `About`, `Events`, `FAQ`, `MediaFeed`, `Programs`, `JoinCTA`, and `Testimonials`.
- New admin UI should use the active token set unless these primitives are normalized first.

## Font Setup

Fonts are configured in `src/app/layout.tsx` through `next/font/google`.

- `Fraunces` -> `--font-display`; used for brand, hero, section headings, and editorial card titles.
- `Inter` -> `--font-body`; used for paragraphs, navigation, labels, forms, metadata, and controls.
- `Noto Naskh Arabic` -> `--font-arabic`; used for Arabic prayer, dhikr, and dua text.
- `Noto Sans Malayalam` -> `--font-malayalam`; used for Malayalam explanations and translations.

Admin UI should keep the public font stack but use a denser operational layout: smaller headings, compact controls, clear labels, and restrained cards.

## Design Language

The current public site is editorial and cinematic, with Islamic visual cues through deep green, muted gold, geometric detailing, Arabic typography, Malayalam support, and a 3D Quran model.

Section-specific public design:

- Hero: split layout, large display type, CTA buttons, soft background shapes, 3D Quran on the right.
- Live: centered broadcast/program panel in a primary-tinted band.
- Videos: horizontal media carousel with platform badges.
- Issue: publication spotlight with magazine cover tilt and PDF modal.
- Namaz: instructional scroll timeline and Rakah selector.
- Dhikr: searchable Arabic-first card library with favorites and study mode.
- Q&A: deep primary band with a white ask form and answer accordion.
- Leadership: editorial profile grid with a quote accent card.

Admin design recommendation:

- Preserve tokens, fonts, and brand restraint.
- Use a quiet, dense dashboard style rather than a marketing layout.
- Prefer tables/lists, tabs, filters, labelled forms, status badges, and confirmation dialogs.
- Avoid heavy 3D or decorative motion in admin screens.
- Keep focus states visible and dialogs keyboard-operable with focus traps.

## Reusable Component Inventory

Layout and global UI:

- `Container`
- `Navbar`
- `ScrollProgressBar`
- `SmoothScroll`
- `Section`
- `SectionHeading`
- `Button`

Content UI:

- `Chips`
- `VideoCard`
- `VideoModal`
- `IssueCover`
- `ArchiveCarousel`
- `PdfModal`
- `AskForm`
- `QaAccordion`
- `DhikrCard`
- `AudioButton`
- `StudyMode`
- `TimelineStep`
- `PostureStage`
- `LeaderCard`

3D and visual components:

- `HeroQuranCanvas`
- `SceneCanvas`
- `QuranModel`
- `GoldParticles`
- `ModelPoster`
- `GirihPattern`

Program components:

- `NextProgramCard`
- `ProgramCalendar`
- `ProgramDetails`
- `ProgramList`

Admin reuse guidance:

- Reuse tokens and `Container` ideas, but do not reuse public marketing sections directly.
- Build admin-specific components for sidebar, page headers, tables, filters, status badges, dialogs, and form fields.
- Reuse `Chips` only if it is normalized for active tokens and keyboard behavior.
- Existing `VideoModal` and `PdfModal` need stronger focus trapping before they become a shared admin dialog pattern.

## Data and Constants Map

Static data and config files:

- `src/data/site.ts`
- `src/data/siteConfig.ts`
- `src/data/live.ts`
- `src/data/videos.ts`
- `src/data/videos.json`
- `src/data/issues.ts`
- `src/data/issues.json`
- `src/data/namaz.ts`
- `src/data/namaz.json`
- `src/data/dhikr.ts`
- `src/data/dhikr.json`
- `src/data/qa.ts`
- `src/data/programs.ts`
- `src/data/leaders.json`
- `src/data/scene.ts`
- `src/lib/constants/colors.ts`
- `src/lib/constants/content.ts`
- `src/lib/constants/leaders.ts`

Supabase files:

- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `supabase/migrations/20260928000000_create_questions.sql`
- `supabase/seed.sql`

Utilities and hooks:

- `src/lib/utils/cn.ts`
- `src/lib/utils/dateUtils.ts`
- `src/lib/utils/webgl.ts`
- `src/lib/hooks/usePrefersReducedMotion.ts`
- `src/lib/hooks/useScrollProgress.ts`

## Admin Workflow Requirements Summary

`docs/admin-workflow.md` requires:

- Login and MFA setup/verify pages using Supabase Auth TOTP.
- `aal2` enforcement on every admin screen and action.
- Email allowlist in `admins`.
- Roles: `admin` and optional `reviewer`.
- Admin inbox at `/admin` with filters, search, counts, sorting, and 25-item pagination.
- Question detail at `/admin/questions/[id]` with notes, timeline, draft/send/archive/publish controls.
- Published manager at `/admin/published`.
- Team management at `/admin/team`.
- Security page at `/admin/security`.
- Content management routes for issues, live broadcast, programs, and dhikr.
- Audit log for every state-changing action.
- Email log and retry behavior.
- Server-side-only email sending.
- Public site reads from Supabase with fallback to bundled files.
- Cache revalidation after admin writes.

## API Route Analysis

### `/api/qa/ask`

Current behavior:

- Parses JSON with `await request.json()`.
- Manually strips HTML tags.
- Manually validates category and question length.
- Uses a hidden honeypot field named `website`.
- Applies an in-memory IP rate limiter with a module-level `Map`.
- Inserts into Supabase if a server client is available.
- Falls back to local success when Supabase env vars are absent.

Gaps:

- No zod validation at the server boundary.
- Uses a type assertion for category.
- In-memory rate limiter is not production-safe.
- Logs errors server-side.
- Secret-bearing helper is not marked `server-only`.
- Env names need Phase 1 canonical update.
- Response shape is not the requested typed result union.

### `/api/qa/published`

Current behavior:

- Imports `getSupabaseBrowserClient()` in a route handler.
- Selects published question fields from Supabase.
- Falls back to static `fallbackQuestions`.

Gaps:

- Uses browser-named Supabase helper in server route code.
- No pagination.
- No zod validation of query/search params.
- No cache tags or revalidation strategy.
- No typed result union.
- Logs errors server-side.
- Admin workflow requires this endpoint to return public-only wording and never private questions.

## Database and Indexing

Current migration creates `public.questions` with:

- `id`
- `created_at`
- `name`
- `category`
- `question`
- `answer`
- `answered_by`
- `answered_at`
- `status`

Current index:

- `(status, category, answered_at DESC)`

Current RLS:

- Public can select only rows where `status = 'published'`.
- Public direct inserts are blocked.

Admin workflow requires additions:

- Question fields for draft answers, internal notes, review flag, archive reason, public wording, published flag, and timestamps.
- `admins`, `audit_log`, `email_log`, `issues`, `live_status`, `programs`, and `dhikr_entries`.
- Check constraints for private questions and reviewed dhikr publishing.
- Additional indexes for filtered/sorted admin lists.
- A database function for switching featured issue atomically.

## Tests

The `tests/` directory exists but currently has no files. There is no test script in `package.json`.

Phase 1 should add a test runner and cover:

- Guard rejects non-admins and `aal1` sessions.
- Private questions can never publish.
- Reply is visible only after answered.
- Email failure keeps reply saved.
- Unreviewed dhikr cannot publish.
- Only one issue is featured.
- Only YouTube links are accepted.

## Gaps Against `docs/admin-workflow.md`

- No admin route structure exists.
- No Supabase SSR session setup.
- `@supabase/ssr` is not installed.
- No TOTP MFA setup/verify/security pages.
- No shared `aal2` + allowlist authorization guard.
- No admin allowlist table in current migration.
- No server actions.
- No zod validation in source.
- Zod is transitive in the lockfile but not a direct dependency in `package.json`.
- No `server-only` imports in secret-bearing modules.
- Current Supabase helper env names are legacy names and must change in Phase 1.
- No typed action result helper.
- No admin sidebar, inbox, question detail, published manager, team page, or content routes.
- No route segment `loading.tsx` or `error.tsx`.
- No cache tag/revalidation strategy.
- No 25-item server pagination pattern.
- No admin audit log or email log implementation.
- No upload validation/storage bucket flow.
- Public reads are still mostly hard-coded `src/data` reads.
- Public Q&A route does not yet implement `is_published` and `is_private` filtering.

## Risks

1. Current Supabase client/server helpers use legacy env names and will not follow the chosen env contract until Phase 1 updates them.
2. Secret-bearing Supabase server code is not marked `server-only`.
3. `@supabase/ssr` is missing, but the admin workflow requires secure cookie sessions.
4. MFA/`aal2` enforcement must be duplicated in `proxy.ts` only as a convenience and enforced in the shared server guard for every action.
5. Service-role access bypasses RLS, so guard correctness is critical.
6. In-memory rate limiting is not production-safe.
7. Current Q&A validation is manual and should move to zod.
8. Existing error logging patterns need tightening so emails, question text, and secrets are never logged.
9. Many public sections are client components; admin should avoid copying that pattern.
10. Dhikr favorites and client rate limiting use localStorage; acceptable for public convenience features, not for admin security.
11. `VideoModal` and `PdfModal` do not implement a full focus trap.
12. Many source data files contain `TODO`, dummy PDFs, placeholder media IDs, and scholar-review warnings.
13. Older primitives and unused placeholders reference inactive token names.
14. No route-level loading/error UI exists.
15. No test runner or test script exists.
16. Public content migration must preserve the current site via file fallback until Supabase content is ready.
17. The initial migration and the admin workflow additions conflict around the meaning of `status = published`; Phase 1 must migrate carefully to `status = answered` plus `is_published`.
18. Existing `.env.example` should be sanitized to placeholder values in Phase 1 if it contains real-looking secrets.

## Proposed Admin Folder Structure

```text
src/
  app/
    admin/
      layout.tsx
      loading.tsx
      error.tsx
      page.tsx
      login/
        page.tsx
        loading.tsx
        error.tsx
        setup/
          page.tsx
          loading.tsx
          error.tsx
        verify/
          page.tsx
          loading.tsx
          error.tsx
      questions/
        [id]/
          page.tsx
          loading.tsx
          error.tsx
      published/
        page.tsx
        loading.tsx
        error.tsx
      team/
        page.tsx
        loading.tsx
        error.tsx
      security/
        page.tsx
        loading.tsx
        error.tsx
      issues/
        page.tsx
        loading.tsx
        error.tsx
      live/
        page.tsx
        loading.tsx
        error.tsx
      programs/
        page.tsx
        loading.tsx
        error.tsx
      dhikr/
        page.tsx
        loading.tsx
        error.tsx
  features/
    admin/
      components/
      actions/
      queries/
      schemas/
    qa/
      actions/
      queries/
      schemas/
    issues/
      actions/
      queries/
      schemas/
    live/
      actions/
      queries/
      schemas/
    programs/
      actions/
      queries/
      schemas/
    dhikr/
      actions/
      queries/
      schemas/
  lib/
    auth/
      guard.ts
      roles.ts
      session.ts
    supabase/
      admin.ts
      server.ts
      browser.ts
      types.ts
    validation/
      action-result.ts
      form-data.ts
      pagination.ts
```

Principles:

- Keep route files thin.
- Put zod schemas next to the feature that owns the data.
- Put all authorization in one shared guard called by every server action and route handler.
- Put secret-bearing clients in server-only modules.
- Keep client components limited to forms, dialogs, filters, and optimistic interactivity.
- Paginate server-side at 25 rows maximum.
- Use cache tags for public reads and revalidate on admin writes.
- Preserve public `src/data` fallback while database content is introduced.

## Remaining Open Questions

1. Confirm whether answer sending requires a scholar review step, or whether admins can send directly.
2. Confirm the reply email provider and sender address.
3. Confirm issue PDF upload size limit; workflow proposes 25 MB but says it needs client confirmation.
4. Confirm whether a content-only role is needed beyond Admin and Reviewer.
5. Confirm whether completed live broadcasts should also be managed in the Speeches and Videos carousel.
