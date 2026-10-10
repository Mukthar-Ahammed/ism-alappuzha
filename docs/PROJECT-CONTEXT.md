# ISM Alappuzha Project Context

## Product Identity

ISM Alappuzha is a public web platform for the Islamic Students Movement Alappuzha District Committee. The site is positioned as an Islamic youth education and community portal built around the tagline:

```text
Learn. Practise. Serve.
```

The experience combines organizational identity, educational resources, publications, media, live programming, prayer guidance, dhikr and dua study, public Q&A, and leadership profiles.

## Current App Shape

This is a Next.js 16.3.6 App Router project using the optional `src` directory.

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
    dhikr/page.tsx
    api/qa/ask/route.ts
    api/qa/published/route.ts
  components/
    3d/
    patterns/
    program/
    sections/
    ui/
  data/
  lib/
    constants/
    hooks/
    supabase/
    types/
    utils/
public/
  images/
  models/
supabase/
  migrations/
  seed.sql
```

Main public routes:

- `/` - primary one-page site.
- `/dhikr` - expanded dhikr and dua library.
- `/api/qa/ask` - question submission endpoint.
- `/api/qa/published` - published questions endpoint.

The homepage is composed in `src/app/page.tsx` with this order:

1. `Hero`
2. `LiveNow`
3. `Videos`
4. `LatestIssue`
5. `NamazGuide`
6. `DhikrLibrary`
7. `QnASection`
8. `Leadership`
9. `Footer`

## Framework and Runtime

Core stack:

- Next.js 16.3.6
- React 19.2.8
- TypeScript 5
- Tailwind CSS 4
- Framer Motion 13
- GSAP 3 and Lenis for scroll behavior
- Three.js with `@react-three/fiber` and `@react-three/drei`
- Supabase JS for optional Q&A persistence

Important project rules:

- This project has `AGENTS.md` warning that this Next.js version may differ from older conventions.
- Before changing Next.js routing, layouts, metadata, images, or route handlers, check the local docs in `node_modules/next/dist/docs/`.
- App code uses the `@/*` alias mapped to `src/*`.

## Fonts

Fonts are configured in `src/app/layout.tsx` with `next/font/google`.

Primary fonts:

- Display: `Fraunces`
  - CSS variable: `--font-display`
  - Tailwind family: `font-display`
  - Used for brand title, large section headings, card titles, editorial display type.
  - Configured axes: `SOFT`, `WONK`, `opsz`.

- Body: `Inter`
  - CSS variable: `--font-body`
  - Tailwind family: `font-body`
  - Used for navigation, paragraphs, controls, labels, forms, metadata.

- Arabic: `Noto Naskh Arabic`
  - CSS variable: `--font-arabic`
  - Tailwind family: `font-arabic`
  - Weights: 400, 500, 600, 700.
  - Used for Arabic prayer, dhikr, and dua text.

- Malayalam: `Noto Sans Malayalam`
  - CSS variable: `--font-malayalam`
  - Tailwind family: `font-malayalam`
  - Weights: 400, 500, 600, 700.
  - Used for Malayalam explanations and translations.

Typography style:

- Large editorial headings use `font-display`, usually `text-4xl` through `text-7xl`.
- Body text uses `font-body`, usually `text-sm` to `text-xl`.
- Arabic text is larger and high line-height, often `text-2xl` with `leading-[1.9]`.
- Malayalam text is usually smaller explanatory text with comfortable line height.
- The design uses tight headings, but letter spacing is generally normal or tracking-tight.

## Design Tokens

The source of truth is `src/app/globals.css`, mirrored for programmatic use in `src/lib/constants/colors.ts`.

Color tokens:

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

Tailwind names exposed in `tailwind.config.ts`:

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
- Social/platform colors appear in media badges.

Important token mismatch:

- Some older shared primitives reference `bg-background`, `text-foreground`, `bg-surface`, and `accent`.
- Those tokens are not part of the active CSS/Tailwind theme.
- Affected files include `src/components/ui/Button.tsx`, `src/components/ui/Section.tsx`, `src/components/ui/SectionHeading.tsx`, and several currently unused section placeholders such as `About`, `Events`, `FAQ`, `MediaFeed`, `Programs`, `JoinCTA`, and `Testimonials`.
- Most current sections bypass these older tokens and use `bg`, `primary`, `secondary`, `text-main`, and `text-muted`.
- Future styling should prefer the active token set unless first normalizing these primitives.

## Layout System

The root layout:

- Applies all font variables to `<html>`.
- Sets the body to `min-h-full bg-bg text-text-main font-body`.
- Mounts `ScrollProgressBar` and `Navbar` above page content.

Page layout:

- Homepage main element uses `min-h-screen`, `bg-bg`, `text-text-main`, `overflow-x-hidden`, and `pt-20` to account for the fixed navbar.
- Section spacing is usually `py-20 md:py-28` or `py-24 md:py-32`.
- The main container primitive is `Container`, which gives:

```text
w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8
```

Responsive approach:

- Mobile-first Tailwind classes.
- Single-column mobile layouts, split grid layouts on `lg`.
- Horizontal carousels use `overflow-x-auto`, snap behavior, and fixed responsive card widths.
- Fixed navbar collapses to a mobile drawer under `md`.

## Component Structure

### Sections

`src/components/sections` contains page-level sections:

- `Hero` - editorial opening section with tagline, description, calls to action, and 3D Quran canvas.
- `LiveNow` - live broadcast status or next program card.
- `Videos` - media carousel with category chips and video modal.
- `LatestIssue` - featured magazine issue, PDF modal, archive carousel.
- `NamazGuide` - prayer guide with scroll-driven timeline and Rakah selector.
- `DhikrLibrary` - searchable dhikr grid, favorites, study mode, dedicated page variant.
- `QnASection` - public question form plus published answer accordion.
- `Leadership` - editorial leadership grid.
- `Footer` - closing site information.
- Other section files exist (`About`, `Events`, `FAQ`, `Programs`, `MediaFeed`, `JoinCTA`, `Testimonials`) but are not currently rendered on the homepage.

### UI Primitives

`src/components/ui` contains reusable pieces:

- `Navbar` - fixed responsive navigation with live pill and development live toggle.
- `ScrollProgressBar` - global scroll indicator.
- `Container` - page width and horizontal padding.
- `Chips` - category filters.
- `VideoCard`, `VideoModal` - media item and playback modal.
- `IssueCover`, `PdfModal`, `ArchiveCarousel` - publication UI.
- `AskForm`, `QaAccordion` - Q&A UI.
- `DhikrCard`, `AudioButton`, `StudyMode` - dhikr library UI.
- `TimelineStep`, `PostureStage` - namaz guide UI.
- `SmoothScroll` - Lenis and GSAP integration.
- `Button`, `Section`, `SectionHeading` - older generic primitives with token mismatch noted above.

### Program Components

`src/components/program` contains:

- `NextProgramCard`
- `ProgramCalendar`
- `ProgramDetails`
- `ProgramList`

Program data exists in `src/data/programs.ts`, but the current homepage uses `NextProgramCard` mainly through the live/offline section.

### 3D Components

`src/components/3d` contains:

- `HeroQuranCanvas` - active hero 3D Quran implementation.
- `QuranModel` - GLB loading, material tuning, animation, mouse parallax.
- `SceneCanvas` - older/fixed scroll scene canvas; not currently mounted in `page.tsx`.
- `GoldParticles` - ambient particle field for 3D scene.
- `ModelPoster` - fallback poster for reduced motion or unsupported WebGL.

The GLB model is:

```text
public/models/quran_3d_free.glb
```

3D behavior:

- Checks WebGL support before rendering.
- Respects `prefers-reduced-motion`.
- Uses `Canvas` from React Three Fiber.
- Uses `useGLTF`, `OrbitControls`, and `ContactShadows` from Drei.
- Normalizes and centers the GLB model on mount.
- Applies subtle bobbing, mouse tilt, and warm directional lighting.

## Motion and Interaction Patterns

Motion libraries:

- Framer Motion for section reveals, card entrance, and small UI transitions.
- GSAP ScrollTrigger plus Lenis for smooth scrolling.
- Three.js frame loop for 3D model movement.

Interaction conventions:

- Category chips for filtering.
- Horizontal snap carousel for media and archives.
- Modals for video and PDF reading.
- Accordions for Q&A.
- Favorites for dhikr stored in localStorage.
- Study mode modal for dhikr review.
- Copy-to-clipboard on dhikr cards.
- Audio playback buttons for dhikr entries.
- Scroll timeline for namaz steps.

Accessibility and motion:

- Several components use `aria-label`, `aria-expanded`, `aria-live`, and focus rings.
- Reduced motion is respected in smooth scroll and several motion-heavy components.
- WebGL fallback exists through `ModelPoster`.

## Data Model and Content Sources

Data is mostly static TypeScript/JSON, with Supabase as optional persistence for public Q&A.

Key data files:

- `src/data/site.ts` - site identity, contact, social links, nav links.
- `src/data/siteConfig.ts` - alternate site config with live stream metadata.
- `src/data/live.ts` - live state, channel ID, live YouTube ID, featured speech, next program.
- `src/data/videos.ts` - video categories and media items.
- `src/data/issues.ts` - publication issues, cover images, PDF links.
- `src/data/namaz.ts` - prayer steps, Arabic, transliteration, Malayalam notes, Rakah structure.
- `src/data/dhikr.ts` - dhikr and dua entries, categories, scholar note.
- `src/data/qa.ts` - fallback Q&A.
- `src/data/programs.ts` - event/program items.
- `src/lib/constants/leaders.ts` - leadership profiles.
- `src/data/scene.ts` - scroll transform positions for the older `SceneCanvas`.

Content readiness:

- Many religious and publication entries still contain `TODO`.
- The project explicitly warns that namaz, dhikr, dua, Arabic text, Malayalam meaning, and Q&A content require scholar review before production publishing.
- Placeholder YouTube IDs, PDFs, social links, and contact details should be replaced before launch.

## API and Supabase

Supabase helper files:

- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`

Environment variables expected:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If Supabase env values are absent or placeholder values, helper functions return `null`, and the app falls back gracefully.

### POST `/api/qa/ask`

Purpose:

- Accept public questions for scholar review.

Behavior:

- Reads IP from `x-forwarded-for` or `x-real-ip`.
- Applies in-memory rate limiting of 3 submissions per hour per IP.
- Uses a hidden honeypot field named `website`.
- Strips basic HTML tags.
- Validates category and question length.
- Inserts a `pending` row into Supabase when configured.
- Returns success even without Supabase in local development.

### GET `/api/qa/published`

Purpose:

- Return published Q&A entries.

Behavior:

- Fetches rows where `status = published`.
- Orders by `answered_at` descending.
- Falls back to `fallbackQuestions` if Supabase is unavailable, empty, or errors.

Database migration:

```text
supabase/migrations/20260928000000_create_questions.sql
```

Table:

```text
public.questions
```

Statuses:

- `pending`
- `published`
- `hidden`

RLS:

- Public can read only published questions.
- Direct public inserts are intentionally blocked; submissions go through the server route.

## Assets

Local assets:

- Logo: `public/images/logo/ism-logo.png`
- Issue covers: `public/images/issues/latest-issue.png`
- Past issues: `public/images/past issue/*.png`
- Leadership SVGs: `public/images/leaders/*.svg`
- 3D model: `public/models/quran_3d_free.glb`

Remote image hosts allowed in `next.config.ts`:

- `images.unsplash.com`
- `img.youtube.com`
- `i.ytimg.com`
- `cdn.ism.org.in`

Image output formats:

- AVIF
- WebP

## Design Language

The current visual direction is:

- Editorial and cinematic, not a plain admin app.
- Islamic visual cues through green, gold, geometric patterns, Arabic typography, and Quran model.
- Large expressive headings with calm body text.
- White cards with deep green text, subtle borders, and soft shadows.
- Gold used for important interactive accents, play controls, progress lines, and category highlights.
- Rounded cards often use `22px`, while buttons and pills are often fully rounded.

Section-specific notes:

- Hero: split grid, large display type, soft blurred background shapes, 3D Quran on the right.
- Live: centered broadcast/program panel inside a tinted primary band.
- Videos: editorial carousel with media cards and platform badges.
- Issue: publication spotlight with a magazine-like 3D tilt card.
- Namaz: instructional timeline, strong vertical rhythm, scholar-audit note.
- Dhikr: calm searchable library, Arabic-first card hierarchy.
- Q&A: deep primary background with white form card.
- Leadership: more editorial and grid-based, with photo/profile cards and a quote accent card.

## Code Conventions

General conventions:

- Components are mostly React function components.
- Client-only interactive components start with `"use client"`.
- Data types are colocated with data files or in `src/lib/types`.
- `cn()` combines `clsx` and `tailwind-merge`.
- Prefer `@/` imports for source files.
- Use static data files for content-heavy sections unless dynamic behavior is required.

When adding new UI:

- Prefer existing tokens: `bg`, `primary`, `secondary`, `text-main`, `text-muted`, `border-subtle`.
- Reuse `Container` for normal content width.
- Follow section spacing: `py-20 md:py-28` or `py-24 md:py-32`.
- Use `font-display` for headings and `font-body` for controls/body.
- Use `font-arabic` and `font-malayalam` for religious language content.
- Respect `prefers-reduced-motion` for heavy animation.
- Keep content data in `src/data` where possible.
- Check for `TODO` content before treating any religious or organizational text as final.

## Known Gaps and Risks

- `Button`, `Section`, `SectionHeading`, and several unused/placeholder sections reference inactive token names.
- The navbar contains visible development live-state toggles.
- Many content entries still include `TODO`.
- Religious content has explicit scholar-review warnings.
- Some old components exist but are not wired into the current homepage.
- `SceneCanvas` and `sceneConfig` appear to be older scroll-scene infrastructure; current hero uses `HeroQuranCanvas`.
- `tests` directory exists but appears empty from the current scan.
- `git status` did not work in this workspace because `D:\ISM` is not detected as a Git repository.

## Local Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Current dev behavior observed:

- A Next dev server was already running on port `3000`.
- A second `npm run dev` attempt reported port `3001`, then warned another server was already active for `D:\ISM`.
- Use `http://localhost:3000` for the existing active server unless the process changes.

## Best Next Steps Before Production

1. Replace all placeholder and `TODO` content.
2. Remove or hide the navbar development live toggle.
3. Normalize old token names in shared primitives.
4. Verify religious content with qualified scholars.
5. Replace dummy PDFs and placeholder media URLs.
6. Configure Supabase environment variables and confirm RLS behavior.
7. Add tests for Q&A API validation and key UI behavior.
8. Run lint and production build.

## Recommended Answers

These answer the Phase 0 open questions with the safest defaults that keep the public site working exactly as it does today.

1. Where is `docs/admin-workflow.md`, or should the admin plan be created from the prompt?

Recommended answer: Use `docs/admin-workflow.md` as the admin requirements source of truth.

Reason: It now exists in the repo and gives explicit screens, roles, rules, data model, security requirements, and build order.

2. Are there design files under `docs/design/`, or should current styling be treated as source of truth?

Recommended answer: Treat `docs/PROJECT-CONTEXT.md` plus `src/app/globals.css` and current components as the design source of truth.

Reason: There is no `docs/design/` directory, and this keeps the new admin visually aligned without inventing a second design language.

3. Which Supabase env naming should be canonical?

Recommended answer: Use `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY`.

Reason: These match the current env decision and avoid continuing the legacy anon/service-role naming.

4. Should `@supabase/ssr` be added for admin authentication/session handling?

Recommended answer: Yes, add `@supabase/ssr` in Phase 1.

Reason: The workflow requires secure cookie sessions and Supabase Auth MFA, and `@supabase/ssr` is the appropriate App Router integration.

5. What admin roles are required?

Recommended answer: Start with `admin` and `reviewer` exactly as `docs/admin-workflow.md` defines.

Reason: This covers the Q&A review path and dhikr review gate while avoiding extra roles until needed.

6. Which content areas must be editable in Phase 1?

Recommended answer: Build in workflow order: Q&A admin foundation first, then issues, live status, programs, and dhikr.

Reason: Q&A has the strongest security/data impact, and the public site can keep using current static files until each content area is safely migrated.

7. Should religious content changes require scholar review before publication?

Recommended answer: Yes for dhikr and dua publishing, and use the optional Q&A review setting only if ISM wants reviewer approval before replies go out.

Reason: The public site already warns that religious content needs review; this prevents unreviewed text from going live accidentally.

8. Should hard-coded public data remain as fallback after Supabase is introduced?

Recommended answer: Yes, keep bundled `src/data` fallbacks.

Reason: This preserves the public site exactly as it works today if Supabase is empty, offline, or still being populated.

9. What storage bucket and upload limits should media/PDF/image uploads use?

Recommended answer: NEEDS MY INPUT for final bucket names and limits; use the workflow's 25 MB PDF limit as a provisional maximum.

Reason: Upload size and bucket policy affect hosting cost, moderation, and storage security, so the final values should be confirmed.

10. Should placeholder and `TODO` content be removed during admin implementation?

Recommended answer: Keep it as fallback content until real content is supplied, but never publish imported TODO content from the admin database.

Reason: Removing it now may break the current public site; marking imported entries as drafts preserves behavior and prevents accidental publication.

11. Should the existing public design be preserved exactly, or should admin use a denser dashboard design?

Recommended answer: Preserve the public site exactly; build the admin as a denser operational dashboard derived from the same tokens.

Reason: Admin users need scanning, filtering, and repeated action more than cinematic presentation.

12. Which test runner should be used for logic tests?

Recommended answer: Use Vitest for server-side logic and validation tests.

Reason: It fits TypeScript projects well, is lightweight, and can cover guards, schemas, and pure workflow logic without forcing a full browser stack.
