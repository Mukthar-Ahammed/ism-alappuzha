import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { programFormSchema } from "@/features/programs/schemas";
import type { PublicLive } from "@/features/live/types";
import {
  istToUtcIso,
  selectNextProgram,
  to12Hour,
  to24Hour,
  utcToIstInputs,
} from "@/lib/programs/schedule";

const guard = vi.hoisted(() => ({
  calls: [] as unknown[],
  rpcCalls: [] as string[],
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

vi.mock("@/lib/env.server", () => ({
  serverEnv: { NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc: async (name: string) => {
      guard.rpcCalls.push(name);
      return { data: null, error: null };
    },
  }),
}));

const hour = 60 * 60 * 1000;

function program(id: string, startsAt: string, status: "scheduled" | "cancelled" = "scheduled") {
  return { id, startsAt, status };
}

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

describe("IST conversion", () => {
  it("stores IST wall-clock times as UTC", () => {
    expect(istToUtcIso("2026-10-04", "18:00")).toBe("2026-10-04T12:30:00.000Z");
    expect(utcToIstInputs("2026-10-04T12:30:00.000Z")).toEqual({ date: "2026-10-04", time: "18:00" });
  });

  it("handles times that fall on the previous UTC day", () => {
    // 02:00 IST on the 5th is 20:30 UTC on the 4th.
    expect(istToUtcIso("2026-10-05", "02:00")).toBe("2026-10-04T20:30:00.000Z");
    expect(utcToIstInputs("2026-10-04T20:30:00.000Z")).toEqual({ date: "2026-10-05", time: "02:00" });
  });

  it.each([
    ["2026-02-30", "10:00"],
    ["2026-13-01", "10:00"],
    ["2026-10-04", "24:00"],
    ["2026-10-04", "9:00"],
    ["04/10/2026", "10:00"],
    ["", ""],
  ])("rejects %s %s", (date, time) => {
    expect(istToUtcIso(date, time)).toBeNull();
  });
});

describe("12-hour time picker conversion", () => {
  it.each([
    ["00:00", { hour: 12, minute: 0, period: "AM" }],
    ["00:30", { hour: 12, minute: 30, period: "AM" }],
    ["10:00", { hour: 10, minute: 0, period: "AM" }],
    ["12:00", { hour: 12, minute: 0, period: "PM" }],
    ["13:00", { hour: 1, minute: 0, period: "PM" }],
    ["23:55", { hour: 11, minute: 55, period: "PM" }],
  ] as const)("%s round-trips", (time, clock) => {
    expect(to12Hour(time)).toEqual(clock);
    expect(to24Hour(clock)).toBe(time);
  });

  it("rejects malformed times", () => {
    expect(to12Hour("24:00")).toBeNull();
    expect(to12Hour("1:00 PM")).toBeNull();
  });
});

describe("selectNextProgram", () => {
  const start = "2026-10-04T12:30:00.000Z";
  const startMs = new Date(start).getTime();

  it("keeps a program on the homepage until exactly 3 hours after it starts", () => {
    const programs = [program("a", start)];

    expect(selectNextProgram(programs, new Date(startMs - hour))?.id).toBe("a");
    expect(selectNextProgram(programs, new Date(startMs + 3 * hour - 1))?.id).toBe("a");
    expect(selectNextProgram(programs, new Date(startMs + 3 * hour))).toBeNull();
  });

  it("picks the earliest program still in its window", () => {
    const programs = [
      program("later", "2026-10-10T12:30:00.000Z"),
      program("running", start),
      program("finished", "2026-10-01T12:30:00.000Z"),
    ];

    expect(selectNextProgram(programs, new Date(startMs + hour))?.id).toBe("running");
    expect(selectNextProgram(programs, new Date(startMs + 4 * hour))?.id).toBe("later");
  });

  it("orders by instant across the IST date line", () => {
    // 23:30 IST on the 4th comes before 02:00 IST on the 5th, although the UTC dates differ.
    const lateEvening = istToUtcIso("2026-10-04", "23:30") ?? "";
    const earlyMorning = istToUtcIso("2026-10-05", "02:00") ?? "";
    const now = new Date(istToUtcIso("2026-10-04", "20:00") ?? "");

    expect(selectNextProgram([program("morning", earlyMorning), program("evening", lateEvening)], now)?.id).toBe(
      "evening"
    );
  });

  it("never selects cancelled programs", () => {
    const programs = [
      program("cancelled", start, "cancelled"),
      program("next", "2026-10-06T12:30:00.000Z"),
    ];

    expect(selectNextProgram(programs, new Date(startMs - hour))?.id).toBe("next");
    expect(selectNextProgram([program("only", start, "cancelled")], new Date(startMs - hour))).toBeNull();
  });
});

describe("programFormSchema", () => {
  const valid = {
    id: "",
    title: "Study circle",
    speaker: "Ustadh Rashid",
    date: "2026-10-18",
    startTime: "10:00",
    endTime: "13:00",
    format: "in_person",
    venue: "Kayamkulam",
    description: "",
    link: "",
    posterMediaId: "",
    posterAlt: "",
  };

  it("converts the IST form values to UTC", () => {
    expect(programFormSchema.parse(valid)).toMatchObject({
      startsAt: "2026-10-18T04:30:00.000Z",
      endsAt: "2026-10-18T07:30:00.000Z",
      link: null,
      description: null,
    });
  });

  it("requires a venue unless the program is online only", () => {
    expect(programFormSchema.safeParse({ ...valid, venue: "" }).success).toBe(false);
    expect(programFormSchema.safeParse({ ...valid, format: "hybrid", venue: "" }).success).toBe(false);
    expect(programFormSchema.parse({ ...valid, format: "online", venue: "" }).format).toBe("online");
    expect(programFormSchema.safeParse({ ...valid, format: "zoom" }).success).toBe(false);
  });

  it("allows a missing end time", () => {
    expect(programFormSchema.parse({ ...valid, endTime: "" }).endsAt).toBeNull();
  });

  it("rejects an end time before the start", () => {
    expect(programFormSchema.safeParse({ ...valid, endTime: "09:00" }).success).toBe(false);
  });

  it.each([
    "http://example.com/register",
    "javascript:alert(1)",
    "data:text/html,hi",
    "https://user:pass@example.com/",
    "example.com",
  ])("rejects the link %s", (link) => {
    expect(programFormSchema.safeParse({ ...valid, link }).success).toBe(false);
  });

  it("accepts an https link", () => {
    expect(programFormSchema.parse({ ...valid, link: "https://example.com/register" }).link).toBe(
      "https://example.com/register"
    );
  });

  it("keeps optional Malayalam text and turns blank or missing fields into null", () => {
    expect(programFormSchema.parse(valid)).toMatchObject({
      titleMl: null,
      speakerMl: null,
      venueMl: null,
      descriptionMl: null,
    });
    expect(
      programFormSchema.parse({ ...valid, titleMl: " ജില്ലാ സമ്മേളനം ", venueMl: "", speakerMl: "പ്രഭാഷകൻ" })
    ).toMatchObject({ titleMl: "ജില്ലാ സമ്മേളനം", venueMl: null, speakerMl: "പ്രഭാഷകൻ" });
    expect(programFormSchema.safeParse({ ...valid, titleMl: "അ".repeat(201) }).success).toBe(false);
  });
});

describe("live and program actions", () => {
  const validLive = { link: "https://youtu.be/dQw4w9WgXcQ", title: "Youth meet", speaker: "" };

  it.each([
    ["setLiveAction", async () => (await import("@/features/live/server/actions")).setLiveAction(null, form(validLive))],
    ["endLiveAction", async () => (await import("@/features/live/server/actions")).endLiveAction(null, form({}))],
    [
      "saveProgramAction",
      async () =>
        (await import("@/features/programs/server/actions")).saveProgramAction(
          null,
          form({
            title: "T",
            speaker: "S",
            date: "2026-10-18",
            startTime: "10:00",
            format: "in_person",
            venue: "V",
            id: "",
            endTime: "",
            description: "",
            link: "",
            posterMediaId: "",
          })
        ),
    ],
    [
      "programRowAction",
      async () =>
        (await import("@/features/programs/server/actions")).programRowAction(
          null,
          form({ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", intent: "cancel" })
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

  it.each([
    "https://evil.example/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)",
    "http://youtu.be/dQw4w9WgXcQ",
    "https://www.instagram.com/accounts/login/",
  ])("rejects the live link %s on the server", async (link) => {
    guard.result = { ok: true, actor: "admin@example.com" };
    const { setLiveAction } = await import("@/features/live/server/actions");
    const result = await setLiveAction(null, form({ ...validLive, link }));

    expect(result?.ok).toBe(false);
    expect(guard.rpcCalls).toEqual([]);
  });

  it("stores the canonical link and platform for a valid link", async () => {
    guard.result = { ok: true, actor: "admin@example.com" };
    const { setLiveAction } = await import("@/features/live/server/actions");
    const result = await setLiveAction(
      null,
      form({ ...validLive, link: "https://www.instagram.com/ism_alappuzha/live/?igsh=x" })
    );

    expect(result?.ok).toBe(true);
    expect(guard.rpcCalls).toEqual(["admin_set_live"]);
  });
});

describe("public Live Now section", () => {
  const youtube: PublicLive = {
    isLive: true,
    platform: "youtube",
    youtubeId: "dQw4w9WgXcQ",
    watchUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Youth meet",
    speaker: "Dr. Tariq",
    titleMl: null,
    speakerMl: null,
  };
  const instagram: PublicLive = {
    isLive: true,
    platform: "instagram",
    youtubeId: null,
    watchUrl: "https://www.instagram.com/ism_alappuzha/live/",
    title: "Youth meet on Instagram",
    speaker: "Dr. Tariq",
    titleMl: null,
    speakerMl: null,
  };
  const facebook: PublicLive = {
    isLive: true,
    platform: "facebook",
    youtubeId: null,
    watchUrl: "https://www.facebook.com/ISMAlappuzha/videos/1234567890/",
    title: "Youth meet on Facebook",
    speaker: null,
    titleMl: null,
    speakerMl: null,
  };

  async function render(live: PublicLive): Promise<string> {
    const { LiveNow } = await import("@/components/sections/LiveNow");
    return renderToStaticMarkup(createElement(LiveNow, { live, programs: [] }));
  }

  it("never loads an iframe or third-party script before the visitor clicks", async () => {
    for (const live of [youtube, facebook, instagram]) {
      const html = await render(live);

      expect(html).not.toContain("<iframe");
      expect(html).not.toContain("<script");
      expect(html).not.toContain("youtube-nocookie.com");
      expect(html).not.toContain("plugins/video.php");
    }
  });

  it("shows a play facade for YouTube and Facebook", async () => {
    expect(await render(youtube)).toContain("Play live stream: Youth meet");
    expect(await render(facebook)).toContain("Watch on Facebook");
  });

  it("switches from the YouTube player to an Instagram card", async () => {
    const before = await render(youtube);
    const after = await render(instagram);

    expect(before).toContain("Play live stream");
    expect(before).toContain("Watch on YouTube");
    expect(after).not.toContain("Play live stream");
    expect(after).not.toContain("Watch on YouTube");
    expect(after).toContain("Youth meet on Instagram");
    expect(after).toContain("Dr. Tariq");
    expect(after).toContain("Watch live on Instagram");
    expect(after).toContain('href="https://www.instagram.com/ism_alappuzha/live/"');
    expect(after).toContain('target="_blank"');
    expect(after).toContain('rel="noopener noreferrer"');
  });

  it("keeps the program calendar visible while a broadcast is live", async () => {
    const html = await render(youtube);

    expect(html).toContain("Play live stream");
    expect(html).toContain("Upcoming programs");
    expect(html).toContain("No programs scheduled yet.");
  });

  it("shows the program schedule when not live", async () => {
    const html = await render({ ...youtube, isLive: false });

    expect(html).toContain("Upcoming Program");
    expect(html).not.toContain("Play live stream");
  });
});
