export const livePlatforms = ["youtube", "facebook", "instagram"] as const;

export type LivePlatform = (typeof livePlatforms)[number];

export type ParsedLiveLink = {
  platform: LivePlatform;
  canonicalUrl: string;
  videoId?: string;
};

export type LiveLinkResult =
  | { ok: true; data: ParsedLiveLink }
  | { ok: false; error: string };

/**
 * Whether the public site may embed a platform's player (always behind a click).
 * Facebook was checked against a real public video on 2026-10-11; flip to false
 * if Meta retires the video plugin and the site falls back to a link card.
 */
export const liveEmbedEnabled: Record<LivePlatform, boolean> = {
  youtube: true,
  facebook: true,
  instagram: false,
};

export const livePlatformLabels = {
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
} as const satisfies Record<LivePlatform, string>;

export const liveLinkError = "Paste a YouTube, Facebook or Instagram link that starts with https://";

const youtubeHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const facebookHosts = new Set(["facebook.com", "www.facebook.com", "m.facebook.com"]);
const instagramHosts = new Set(["instagram.com", "www.instagram.com"]);

const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;
const numericIdPattern = /^\d{5,25}$/;
const facebookNamePattern = /^[A-Za-z0-9.\-_]{1,80}$/;
const fbWatchCodePattern = /^[A-Za-z0-9_-]{5,32}$/;
const instagramUserPattern = /^[A-Za-z0-9._]{1,30}$/;
const instagramCodePattern = /^[A-Za-z0-9_-]{5,64}$/;
// Instagram paths that look like usernames but are app pages.
const instagramReserved = new Set(["accounts", "explore", "direct", "stories", "about", "legal", "developer", "p", "reel", "reels", "tv"]);

const maxLinkLength = 2048;

function pathSegments(url: URL): string[] {
  return url.pathname.split("/").filter((segment) => segment !== "");
}

function youtube(url: URL): ParsedLiveLink | null {
  const segments = pathSegments(url);
  let id: string | null = null;

  if (url.hostname === "youtu.be") {
    id = segments.length === 1 ? segments[0] ?? null : null;
  } else if (segments.length === 1 && segments[0] === "watch") {
    id = url.searchParams.get("v");
  } else if (segments.length === 2 && ["live", "shorts", "embed"].includes(segments[0] ?? "")) {
    id = segments[1] ?? null;
  }

  if (!id || !youtubeIdPattern.test(id)) {
    return null;
  }

  return {
    platform: "youtube",
    canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
    videoId: id,
  };
}

function facebook(url: URL): ParsedLiveLink | null {
  const segments = pathSegments(url);

  if (url.hostname === "fb.watch") {
    const code = segments.length === 1 ? segments[0] : undefined;

    return code && fbWatchCodePattern.test(code)
      ? { platform: "facebook", canonicalUrl: `https://fb.watch/${code}/` }
      : null;
  }

  const [first, second, third, fourth] = segments;
  const found = (path: string, videoId?: string): ParsedLiveLink => ({
    platform: "facebook",
    canonicalUrl: `https://www.facebook.com/${path}`,
    ...(videoId ? { videoId } : {}),
  });

  // /watch/?v=123 and /video.php?v=123
  if (segments.length === 1 && (first === "watch" || first === "video.php")) {
    const id = url.searchParams.get("v");
    return id && numericIdPattern.test(id) ? found(`watch/?v=${id}`, id) : null;
  }

  // /reel/123
  if (segments.length === 2 && first === "reel" && second && numericIdPattern.test(second)) {
    return found(`reel/${second}/`, second);
  }

  if (!first || !facebookNamePattern.test(first) || first === "watch" || first === "reel") {
    return null;
  }

  // /{page}/live and /{page}/live_videos: the page's live tab
  if (segments.length === 2 && (second === "live" || second === "live_videos")) {
    return found(`${first}/${second}/`);
  }

  // /{page}/videos/123 and /{page}/videos/{slug}/123
  if (second === "videos") {
    const id = segments.length === 3 ? third : segments.length === 4 ? fourth : undefined;

    if (segments.length === 4 && (!third || !facebookNamePattern.test(third))) {
      return null;
    }

    return id && numericIdPattern.test(id) ? found(`${first}/videos/${id}/`, id) : null;
  }

  return null;
}

function instagram(url: URL): ParsedLiveLink | null {
  const segments = pathSegments(url);
  const [first, second] = segments;
  const found = (path: string, videoId?: string): ParsedLiveLink => ({
    platform: "instagram",
    canonicalUrl: `https://www.instagram.com/${path}/`,
    ...(videoId ? { videoId } : {}),
  });

  if (!first) {
    return null;
  }

  // /reel/{code}, /reels/{code}, /p/{code}, /tv/{code}
  if (segments.length === 2 && ["reel", "reels", "p", "tv"].includes(first)) {
    return second && instagramCodePattern.test(second)
      ? found(`${first === "reels" ? "reel" : first}/${second}`, second)
      : null;
  }

  if (!instagramUserPattern.test(first) || instagramReserved.has(first.toLowerCase())) {
    return null;
  }

  // /{user} and /{user}/live
  if (segments.length === 1) {
    return found(first);
  }

  return segments.length === 2 && second === "live" ? found(`${first}/live`) : null;
}

/**
 * Validates a pasted live link and rebuilds it from the parts we understand, which
 * drops tracking parameters, fragments and anything else we did not ask for.
 */
export function parseLiveLink(input: string): LiveLinkResult {
  const value = input.trim();

  if (value === "" || value.length > maxLinkLength) {
    return { ok: false, error: liveLinkError };
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: liveLinkError };
  }

  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.port !== "") {
    return { ok: false, error: liveLinkError };
  }

  const host = url.hostname.toLowerCase();
  let parsed: ParsedLiveLink | null = null;

  if (youtubeHosts.has(host) || host === "youtu.be") {
    parsed = youtube(url);
  } else if (facebookHosts.has(host) || host === "fb.watch") {
    parsed = facebook(url);
  } else if (instagramHosts.has(host)) {
    parsed = instagram(url);
  }

  return parsed ? { ok: true, data: parsed } : { ok: false, error: liveLinkError };
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function facebookEmbedUrl(canonicalUrl: string): string {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(canonicalUrl)}&show_text=false&autoplay=true`;
}
