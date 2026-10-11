# Deploying to Netlify

Netlify detects Next.js and builds it with its own OpenNext adapter. There is no plugin to
install. The repository's `netlify.toml` sets the build command, the publish folder and
Node 22.

## 1. Before the first deploy

1. **Commit everything.** Netlify builds from the Git repository, not from this computer.
2. **Supabase SQL.** Every `supabase/phase*-combined.sql` file must have been run in the
   Supabase SQL Editor, in phase order. Phase 11 (`phase11-namaz-combined.sql`, the Namaz guide editor)
   is the latest. Phase 10 (admin session policy) must run after the phase 6 files.
   Do **not** run `dev-seed-questions.sql` on the production project; it adds test questions.
3. **Supabase session settings** (*Authentication → Sessions / JWT*):
   - JWT expiry: **900** seconds (the 15-minute access token).
   - Refresh token rotation: **on**, with a short reuse interval (10 s, the default).
   - If your plan offers them, also set *Time-box user sessions* to 8 h and *Inactivity
     timeout* to 30 min. The app enforces both limits itself (phase 10), so this is
     an extra layer, not a requirement.
4. **Admin accounts.** Login is email and password only, so Supabase Auth needs no redirect
   URLs. Make sure the first admin account exists before launch.

## 2. Create the Netlify site

1. Netlify → *Add new site* → *Import an existing project* → choose the Git repository.
2. Leave the build settings as detected; `netlify.toml` supplies them.
3. Under *Site configuration → Environment variables*, add:

| Name | Value | Scopes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key | All |
| `SUPABASE_SECRET_KEY` | Supabase secret (service role) key | Builds, Functions |
| `NEXT_PUBLIC_SITE_URL` | `https://ismalappuzha.org` (your real domain) | All |

Mark `SUPABASE_SECRET_KEY` as a secret, and never give it a `NEXT_PUBLIC_` name. The
build fails with a clear message if any Supabase value is missing or still a placeholder.

4. Deploy. Then add the custom domain under *Domain management* and turn on HTTPS. The site
   sends HSTS, so serve the domain only over HTTPS from then on.

## 3. After the first deploy

- Sign in at `/admin/login` and check each admin area. An area showing "Setup required"
  names the SQL file still to run.
- Upload one image (leader photo or poster) and one issue PDF. Image processing runs in a
  Netlify Function, so this confirms the image library works there.
- Open `/robots.txt` and `/sitemap.xml` and check they use your domain.
- Publish something in the admin and confirm it appears on the homepage straight away.
  Netlify's adapter handles the cache tags the app uses for this.

## 4. Every later change

Run `npm run verify` (type check, lint, tests, production build) before pushing. Pushing to
the production branch deploys automatically, and pull requests get preview URLs. Previews
keep the production domain in canonical links, so they never compete with the real site in
search results.

## Notes

- **Function time limit:** image uploads are resized and compressed on the server. Very large
  photos take the longest, and uploads are capped at 8 MB. If one ever times out, check
  the function time limit for your Netlify plan.
- **Cache:** files in `public/` (the 3D model, hero image, logos) are cached for a day. When
  you replace one, give it a new file name so visitors get the new version straight away.
