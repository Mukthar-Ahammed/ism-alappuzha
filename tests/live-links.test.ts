import { describe, expect, it } from "vitest";
import { facebookEmbedUrl, parseLiveLink } from "@/lib/live-links";

const id = "dQw4w9WgXcQ";

function parsed(url: string) {
  const result = parseLiveLink(url);

  if (!result.ok) {
    throw new Error(`Expected ${url} to parse: ${result.error}`);
  }

  return result.data;
}

describe("parseLiveLink: YouTube", () => {
  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s&list=PL123&si=tracking`,
    `https://m.youtube.com/watch?feature=share&v=${id}`,
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abc123&t=10`,
    `https://www.youtube.com/live/${id}?feature=shared`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}?start=5`,
    `  https://www.youtube.com/watch?v=${id}#comments  `,
    `https://WWW.YOUTUBE.COM/watch?v=${id}`,
  ])("accepts %s", (url) => {
    expect(parsed(url)).toEqual({
      platform: "youtube",
      canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
      videoId: id,
    });
  });

  it.each([
    `http://www.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/watch?v=${id.slice(0, 10)}`,
    `https://www.youtube.com/watch?v=${id}x`,
    `https://www.youtube.com/watch?v=dQw4w9WgX%3C`,
    `https://www.youtube.com/watch`,
    `https://www.youtube.com/channel/UC1234567890`,
    `https://www.youtube.com/@ism_alappuzha`,
    `https://www.youtube.com/live/${id}/extra`,
    `https://youtu.be/`,
    `https://youtu.be/${id}/more`,
    `https://music.youtube.com/watch?v=${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://youtube.com.evil.example/watch?v=${id}`,
    `https://evil-youtube.com/watch?v=${id}`,
    `https://www.youtube.com.@evil.example/watch?v=${id}`,
    `https://user:pass@www.youtube.com/watch?v=${id}`,
    `https://www.youtube.com:8443/watch?v=${id}`,
    `https://youtube.com./watch?v=${id}`,
    `https://xn--yutube-wqf.com/watch?v=${id}`,
  ])("rejects %s", (url) => {
    expect(parseLiveLink(url).ok).toBe(false);
  });
});

describe("parseLiveLink: Facebook", () => {
  it.each([
    ["https://www.facebook.com/ISMAlappuzha/videos/1234567890123456/", "https://www.facebook.com/ISMAlappuzha/videos/1234567890123456/", "1234567890123456"],
    ["https://facebook.com/ISMAlappuzha/videos/annual-meet/1234567890123456?mibextid=abc", "https://www.facebook.com/ISMAlappuzha/videos/1234567890123456/", "1234567890123456"],
    ["https://m.facebook.com/watch/?v=1234567890&rdid=xyz&fbclid=tracking", "https://www.facebook.com/watch/?v=1234567890", "1234567890"],
    ["https://www.facebook.com/watch?v=1234567890", "https://www.facebook.com/watch/?v=1234567890", "1234567890"],
    ["https://www.facebook.com/video.php?v=1234567890", "https://www.facebook.com/watch/?v=1234567890", "1234567890"],
    ["https://www.facebook.com/reel/987654321012345?s=ifu", "https://www.facebook.com/reel/987654321012345/", "987654321012345"],
  ])("accepts %s", (url, canonicalUrl, videoId) => {
    expect(parsed(url)).toEqual({ platform: "facebook", canonicalUrl, videoId });
  });

  it("accepts a page's live tab and fb.watch short links without an id", () => {
    expect(parsed("https://www.facebook.com/ISMAlappuzha/live/")).toEqual({
      platform: "facebook",
      canonicalUrl: "https://www.facebook.com/ISMAlappuzha/live/",
    });
    expect(parsed("https://fb.watch/aBcD123_x/?mibextid=share")).toEqual({
      platform: "facebook",
      canonicalUrl: "https://fb.watch/aBcD123_x/",
    });
  });

  it.each([
    "http://www.facebook.com/ISMAlappuzha/videos/1234567890/",
    "https://www.facebook.com/ISMAlappuzha/",
    "https://www.facebook.com/ISMAlappuzha/photos/1234567890/",
    "https://www.facebook.com/ISMAlappuzha/videos/not-a-number/",
    "https://www.facebook.com/watch/?v=abc",
    "https://www.facebook.com/watch/",
    "https://www.facebook.com/reel/",
    "https://www.facebook.com/login.php?next=https%3A%2F%2Fevil.example",
    "https://www.facebook.com/l.php?u=https%3A%2F%2Fevil.example",
    "https://l.facebook.com/l.php?u=https%3A%2F%2Fevil.example",
    "https://business.facebook.com/ISMAlappuzha/videos/1234567890/",
    "https://facebook.com.evil.example/ISM/videos/1234567890/",
    "https://www.facebook.co/ISM/videos/1234567890/",
    "https://fb.watch/",
    "https://fb.watch/a/",
    "https://fb.watch.evil.example/aBcD123/",
  ])("rejects %s", (url) => {
    expect(parseLiveLink(url).ok).toBe(false);
  });
});

describe("parseLiveLink: Instagram", () => {
  it.each([
    ["https://www.instagram.com/ism_alappuzha/", "https://www.instagram.com/ism_alappuzha/", undefined],
    ["https://instagram.com/ism_alappuzha?igsh=tracking&utm_source=qr", "https://www.instagram.com/ism_alappuzha/", undefined],
    ["https://www.instagram.com/ism_alappuzha/live/", "https://www.instagram.com/ism_alappuzha/live/", undefined],
    ["https://www.instagram.com/reel/C1a2B3c4D5e/?igsh=x", "https://www.instagram.com/reel/C1a2B3c4D5e/", "C1a2B3c4D5e"],
    ["https://www.instagram.com/reels/C1a2B3c4D5e/", "https://www.instagram.com/reel/C1a2B3c4D5e/", "C1a2B3c4D5e"],
    ["https://www.instagram.com/p/C1a2B3c4D5e/", "https://www.instagram.com/p/C1a2B3c4D5e/", "C1a2B3c4D5e"],
  ])("accepts %s", (url, canonicalUrl, videoId) => {
    expect(parsed(url)).toEqual({
      platform: "instagram",
      canonicalUrl,
      ...(videoId ? { videoId } : {}),
    });
  });

  it.each([
    "http://www.instagram.com/ism_alappuzha/",
    "https://www.instagram.com/",
    "https://www.instagram.com/accounts/login/",
    "https://www.instagram.com/explore/tags/islam/",
    "https://www.instagram.com/stories/ism_alappuzha/123/",
    "https://www.instagram.com/ism_alappuzha/tagged/",
    "https://www.instagram.com/reel/",
    "https://www.instagram.com/p/<script>/",
    "https://m.instagram.com/ism_alappuzha/",
    "https://instagr.am/ism_alappuzha/",
    "https://instagram.com.evil.example/ism_alappuzha/",
    "https://www.lnstagram.com/ism_alappuzha/",
  ])("rejects %s", (url) => {
    expect(parseLiveLink(url).ok).toBe(false);
  });
});

describe("parseLiveLink: malformed and malicious input", () => {
  it.each([
    "",
    "   ",
    "youtube.com/watch?v=dQw4w9WgXcQ",
    "www.youtube.com/watch?v=dQw4w9WgXcQ",
    "//www.youtube.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(document.cookie)",
    "JavaScript://www.youtube.com/%0Aalert(1)",
    "data:text/html,<script>alert(1)</script>",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://evil.example/?u=https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://127.0.0.1/watch?v=dQw4w9WgXcQ",
    "not a url at all",
    `https://www.youtube.com/watch?v=dQw4w9WgXcQ&x=${"a".repeat(2100)}`,
  ])("rejects %j", (url) => {
    expect(parseLiveLink(url).ok).toBe(false);
  });

  it("encodes the Facebook video URL inside the plugin href", () => {
    const canonical = parsed("https://www.facebook.com/watch/?v=1234567890").canonicalUrl;
    const embed = new URL(facebookEmbedUrl(canonical));

    expect(embed.origin).toBe("https://www.facebook.com");
    expect(embed.pathname).toBe("/plugins/video.php");
    expect(embed.searchParams.get("href")).toBe(canonical);
  });
});
