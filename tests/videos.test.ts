import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { videoFormSchema, videoPrefillSchema } from "@/features/videos/schemas";
import type { AdminVideo } from "@/features/videos/types";

const guard = vi.hoisted(() => ({
  calls: [] as unknown[],
  rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
  result: { ok: false, error: "You do not have access to this admin area." } as
    | { ok: false; error: string }
    | { ok: true; actor: string },
}));

vi.mock("@/lib/auth/guard", () => ({
  requireAdminActor: async (options: unknown) => {
    guard.calls.push(options);
    return guard.result;
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  unstable_cache: <T,>(fn: T) => fn,
}));

vi.mock("next/navigation", () => ({
  redirect: (location: string) => {
    throw new Error(`NEXT_REDIRECT:${location}`);
  },
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      guard.rpcCalls.push({ name, args });
      return { data: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", released: null }, error: null };
    },
  }),
}));

const validForm = {
  id: "",
  title: "Annual address",
  speaker: "Dr. Tariq",
  category: "Speeches",
  link: "https://youtu.be/dQw4w9WgXcQ?si=tracking",
  recordedOn: "2026-09-14",
  duration: "42:15",
  thumbnailMediaId: "",
  thumbnailAlt: "",
};

function form(values: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

beforeEach(() => {
  guard.calls.length = 0;
  guard.rpcCalls.length = 0;
  guard.result = { ok: false, error: "You do not have access to this admin area." };
});

describe("videoFormSchema", () => {
  it("accepts a YouTube, Facebook or Instagram link and keeps the canonical URL", () => {
    expect(videoFormSchema.parse(validForm).link).toEqual({
      platform: "youtube",
      canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoId: "dQw4w9WgXcQ",
    });
    expect(
      videoFormSchema.parse({ ...validForm, link: "https://www.facebook.com/ISM/videos/1234567890/" }).link.platform
    ).toBe("facebook");
    expect(
      videoFormSchema.parse({ ...validForm, link: "https://www.instagram.com/reel/C1a2B3c4D5e/" }).link.platform
    ).toBe("instagram");
  });

  it.each([
    "https://vimeo.com/123456",
    "http://youtu.be/dQw4w9WgXcQ",
    "javascript:alert(1)",
    "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
  ])("rejects the link %s", (link) => {
    expect(videoFormSchema.safeParse({ ...validForm, link }).success).toBe(false);
  });

  it.each([
    ["42:15", true],
    ["1:05:30", true],
    ["", true],
    ["90", false],
    ["42:75", false],
    ["abc", false],
  ])("duration %j valid: %s", (duration, valid) => {
    expect(videoFormSchema.safeParse({ ...validForm, duration }).success).toBe(valid);
  });

  it("keeps Malayalam title and speaker and stores empty or missing ones as null", () => {
    expect(videoFormSchema.parse({ ...validForm, titleMl: " പ്രസംഗം ", speakerMl: "" })).toMatchObject({
      titleMl: "പ്രസംഗം",
      speakerMl: null,
    });
    expect(videoFormSchema.parse(validForm)).toMatchObject({ titleMl: null, speakerMl: null });
    expect(videoFormSchema.safeParse({ ...validForm, titleMl: "a".repeat(201) }).success).toBe(false);
  });

  it("requires a real date and a known category", () => {
    expect(videoFormSchema.safeParse({ ...validForm, recordedOn: "14/09/2026" }).success).toBe(false);
    expect(videoFormSchema.safeParse({ ...validForm, category: "Music" }).success).toBe(false);
  });

  it("ignores prefilled links the site does not accept", () => {
    expect(videoPrefillSchema.parse({ link: "https://evil.example/x", title: "T" })).toEqual({
      link: "",
      title: "T",
      speaker: "",
    });
  });
});

describe("video actions", () => {
  it.each([
    [
      "saveVideoAction",
      async () => (await import("@/features/videos/server/actions")).saveVideoAction(null, form(validForm)),
    ],
    [
      "videoRowAction",
      async () =>
        (await import("@/features/videos/server/actions")).videoRowAction(
          null,
          form({ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", intent: "delete" })
        ),
    ],
  ])("%s rejects a reviewer without writing", async (_name, run) => {
    await expect(run()).resolves.toEqual({
      ok: false,
      error: "You do not have access to this admin area.",
    });
    expect(guard.calls).toEqual([{ roles: ["admin"] }]);
    expect(guard.rpcCalls).toEqual([]);
  });

  it("rejects an invalid link on the server before touching the database", async () => {
    guard.result = { ok: true, actor: "admin@example.com" };
    const { saveVideoAction } = await import("@/features/videos/server/actions");
    const result = await saveVideoAction(null, form({ ...validForm, link: "https://evil.example/v" }));

    expect(result?.ok).toBe(false);
    expect(guard.rpcCalls).toEqual([]);
  });

  it("saves the canonical link, platform and YouTube id", async () => {
    guard.result = { ok: true, actor: "admin@example.com" };
    const { saveVideoAction } = await import("@/features/videos/server/actions");

    await expect(saveVideoAction(null, form(validForm))).rejects.toThrow(
      "NEXT_REDIRECT:/admin/videos/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee?created=1"
    );
    expect(guard.rpcCalls[0]).toMatchObject({
      name: "admin_save_video",
      args: {
        p_platform: "youtube",
        p_watch_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        p_youtube_id: "dQw4w9WgXcQ",
        p_duration: "42:15",
        p_title_ml: null,
        p_speaker_ml: null,
      },
    });
  });
});

describe("public Speeches & Videos section", () => {
  const video: AdminVideo = {
    id: "v1",
    title: "Annual address",
    speaker: "Dr. Tariq",
    category: "Speeches",
    platform: "facebook",
    watchUrl: "https://www.facebook.com/ISM/videos/1234567890/",
    youtubeId: null,
    recordedOn: "2026-09-14",
    duration: null,
    status: "published",
    thumbnail: null,
    titleMl: null,
    speakerMl: null,
  };

  it("maps a database video to the card format", async () => {
    const { adminVideoToPublic } = await import("@/features/videos/server/data");

    expect(adminVideoToPublic(video)).toMatchObject({
      platform: "Facebook",
      url: "https://www.facebook.com/ISM/videos/1234567890/",
      date: "Sep 2026",
    });
  });

  it("shows an empty state instead of sample videos", async () => {
    const { Videos } = await import("@/components/sections/Videos");
    const html = renderToStaticMarkup(createElement(Videos, { videos: [] }));

    expect(html).toContain("New speeches and videos will appear here soon.");
    expect(html).not.toContain("<iframe");
  });

  it("renders published videos without loading a player", async () => {
    const { adminVideoToPublic } = await import("@/features/videos/server/data");
    const { Videos } = await import("@/components/sections/Videos");
    const html = renderToStaticMarkup(createElement(Videos, { videos: [adminVideoToPublic(video)] }));

    expect(html).toContain("Annual address");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("<iframe");
  });
});
