const fallbackSiteUrl = "https://ismalappuzha.org";

/**
 * The public origin used for canonical links, the sitemap and social previews.
 * NEXT_PUBLIC_SITE_URL wins; on Netlify the primary domain (URL) is used otherwise.
 * Deploy previews keep the production origin so shared links never point at a preview.
 */
export function getSiteUrl(): URL {
  const candidates = [process.env.NEXT_PUBLIC_SITE_URL, process.env.URL, fallbackSiteUrl];

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      return new URL(new URL(candidate).origin);
    } catch {
      // Ignore a malformed value and try the next one.
    }
  }

  return new URL(fallbackSiteUrl);
}
