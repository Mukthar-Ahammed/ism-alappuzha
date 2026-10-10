# ISM Alappuzha Website Details

## Overview

This website is a Next.js web platform for ISM Alappuzha, the Islamic Students Movement Alappuzha District Committee. The public message is centered on the tagline "Learn. Practise. Serve." and the site presents ISM Alappuzha as a youth-focused Islamic education, practice, media, and community leadership portal.

The application is built as an editorial, interactive single-page experience with a dedicated full Dhikr and Dua library route. It combines structured religious learning content, media publishing, live program promotion, public Q&A, and leadership information.

## Main Audience

- Students and youth in Alappuzha district.
- ISM members and local chapter participants.
- Visitors looking for speeches, Islamic learning resources, prayer guidance, dhikr, dua, and district updates.
- Community members who want to submit questions for scholar review.

## Public Routes

- `/` - Main homepage with all primary sections.
- `/dhikr` - Full Dhikr and Dua library page.
- `/api/qa/ask` - POST endpoint for submitting public questions.
- `/api/qa/published` - GET endpoint for published Q&A entries.

## Homepage Sections

The homepage is composed in `src/app/page.tsx` and renders these sections in order:

1. Hero
   - Presents the ISM Alappuzha tagline and description.
   - Includes calls to action for watching videos and asking a question.
   - Uses a 3D Quran canvas visual on the right side.

2. Live Now
   - Shows live broadcast status from `src/data/live.ts`.
   - If live, embeds a YouTube stream.
   - If offline, shows the next program card with title, speaker, date, time, and venue.

3. Speeches and Videos
   - Displays a horizontal media carousel.
   - Supports category filtering for All, Speeches, Campaigns, and Youth.
   - Opens YouTube videos in an accessible modal when playable.

4. Latest Issue
   - Highlights the featured publication issue.
   - Supports reading the PDF online in a modal and downloading the PDF.
   - Includes an archive carousel for previous issues.

5. Namaz Guide
   - Provides a step-by-step prayer guide.
   - Uses a scroll-driven timeline for prayer postures and recitations.
   - Includes Rakah information for Fajr, Zuhr, Asr, Maghrib, and Isha.
   - Contains a scholar review note before production publication.

6. Dhikr and Dua Library
   - Shows a searchable, filterable subset of dhikr entries on the homepage.
   - Supports favorites through local storage.
   - Includes a study mode.
   - Links to the full `/dhikr` route.

7. Public Q&A
   - Allows users to submit questions through an ask form.
   - Shows published answers in an accordion.
   - Uses Supabase when configured and fallback local questions when unavailable.

8. Leadership
   - Displays district leadership profiles.
   - Introduces scholars, educators, and student organizers guiding ISM work.

9. Footer
   - Provides closing site and contact/navigation information.

## Content Sources

Most website content is data-driven from files under `src/data` and `src/lib/constants`:

- `src/data/site.ts` and `src/data/siteConfig.ts` - Organization identity, contact details, tagline, social links, and navigation.
- `src/data/live.ts` - Live broadcast status, YouTube IDs, featured speech, and next program.
- `src/data/videos.ts` and `src/data/videos.json` - Video library items and categories.
- `src/data/issues.ts` and `src/data/issues.json` - Monthly publication details and PDF links.
- `src/data/namaz.ts` and `src/data/namaz.json` - Prayer guide steps, Arabic text, transliteration, Malayalam text, and Rakah data.
- `src/data/dhikr.ts` and `src/data/dhikr.json` - Dhikr and dua library entries.
- `src/data/qa.ts` - Fallback Q&A entries.
- `src/lib/constants/leaders.ts` and `src/data/leaders.json` - Leadership profile data.

Several content entries are still marked with `TODO`, especially contact details, some media titles, scholar review notes, and Malayalam/Arabic review placeholders. Those should be finalized before a public production launch.

## Design and Experience

The site uses an editorial visual style with Islamic design cues:

- A 3D Quran hero canvas.
- Scroll animation and reveal effects through Framer Motion.
- Smooth scrolling behavior.
- Geometric pattern components.
- Publication cover cards and modal readers.
- Search, filters, chips, carousels, and accordions for dense content browsing.

The root layout in `src/app/layout.tsx` configures optimized fonts through `next/font`, including display, body, Arabic, and Malayalam fonts.

## Technology Stack

- Framework: Next.js 16.3.6 with the App Router and Turbopack.
- Language: TypeScript.
- Styling: Tailwind CSS v4 with global CSS tokens.
- Animation: Framer Motion, GSAP, and Lenis.
- 3D: Three.js, `@react-three/fiber`, and `@react-three/drei`.
- Backend integration: Supabase for Q&A storage when environment variables are configured.
- Tests: Project includes a `tests` directory and an npm lint script.

## API Behavior

### POST `/api/qa/ask`

Accepts public question submissions with:

- Name, optional.
- Category, required.
- Question text, required.
- Honeypot field for bot protection.

The endpoint:

- Sanitizes basic HTML from user input.
- Validates category and question length.
- Applies in-memory IP rate limiting of 3 submissions per hour.
- Inserts pending questions into Supabase if server credentials exist.
- Falls back to local logging behavior when Supabase is not configured.

### GET `/api/qa/published`

Returns published Q&A entries:

- Reads from Supabase when configured and populated.
- Falls back to bundled local Q&A data when Supabase is unavailable or empty.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The expected local URL is:

```text
http://localhost:3000
```

If port 3000 is already occupied, Next.js may choose another port such as `http://localhost:3001`.

## Environment Variables

The repository includes `.env.example`. Supabase-backed Q&A requires local environment values for the Supabase URL and keys. Without those values, the app still runs and uses graceful fallbacks for public Q&A.

## Production Readiness Notes

Before production launch, review these items:

- Replace placeholder YouTube channel IDs, video IDs, social links, and PDF links.
- Confirm official contact address, phone, and email.
- Complete all `TODO` content in data files.
- Have Arabic, Malayalam, prayer, dhikr, and dua content reviewed by qualified scholars.
- Replace placeholder media imagery and dummy PDFs with official assets.
- Configure Supabase tables, policies, and environment variables for Q&A.
- Run linting and a production build before deployment.
