import { beforeEach, describe, expect, it, vi } from "vitest";
import { leaderFormSchema, leaderIdParamSchema } from "@/features/leaders/schemas";
import { buildLeaderImportEntries } from "@/features/leaders/workflow";
import { isOwnTemporaryUpload, requestUploadSchema, temporaryUploadPath } from "@/features/media/schemas";
import { LEADERS } from "@/lib/constants/leaders";
import type { Leader } from "@/lib/types/leader";

const guard = vi.hoisted(() => ({
  calls: [] as unknown[],
  result: { ok: false, error: "You do not have access to this admin area." } as
    | { ok: false; error: string }
    | { ok: true; data: { user: { id: string; email: string } } },
}));

const storage = vi.hoisted(() => ({
  downloads: [] as string[],
  removed: [] as string[][],
  downloadBody: Buffer.from("not an image"),
}));

vi.mock("@/lib/auth/guard", () => ({
  requireAdminAction: async (options: unknown) => {
    guard.calls.push(options);
    return guard.result;
  },
  requireAdminActor: async (options: unknown) => {
    guard.calls.push(options);
    const result = guard.result;
    return result.ok ? { ok: true, actor: result.data.user.email, admin: result.data } : result;
  },
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" },
}));

vi.mock("@/lib/auth/rate-limit", () => ({ checkRateLimit: async () => true }));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  unstable_cache: <T,>(fn: T) => fn,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc: () => {
      throw new Error("database must not be touched without access");
    },
    from: () => {
      throw new Error("database must not be touched without access");
    },
    storage: {
      from: () => ({
        download: async (path: string) => {
          storage.downloads.push(path);
          return { data: new Blob([storage.downloadBody]), error: null };
        },
        remove: async (paths: string[]) => {
          storage.removed.push(paths);
          return { data: [], error: null };
        },
        createSignedUploadUrl: async () => {
          throw new Error("must not issue upload URLs without access");
        },
      }),
    },
  }),
}));

const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const uploadId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const leaderId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function form(values: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

function validForm(overrides: Record<string, string> = {}) {
  return {
    id: "",
    name: "Amina",
    role: "General Secretary",
    bio: "Leads the district study circles since 2024.",
    linkedin: "",
    instagram: "",
    photoMediaId: "",
    photoAlt: "",
    ...overrides,
  };
}

beforeEach(() => {
  guard.calls.length = 0;
  guard.result = { ok: false, error: "You do not have access to this admin area." };
  storage.downloads.length = 0;
  storage.removed.length = 0;
});

describe("leaderFormSchema", () => {
  it("accepts a valid leader and normalises empty optional fields to null", () => {
    const parsed = leaderFormSchema.parse(validForm());

    expect(parsed).toMatchObject({ id: null, linkedin: null, instagram: null, photoMediaId: null });
  });

  it("accepts https profile links on the right hosts", () => {
    const parsed = leaderFormSchema.parse(
      validForm({
        linkedin: "https://www.linkedin.com/in/amina",
        instagram: "https://instagram.com/amina",
      })
    );

    expect(parsed.linkedin).toBe("https://www.linkedin.com/in/amina");
    expect(parsed.instagram).toBe("https://instagram.com/amina");
  });

  it.each([
    ["http link", { linkedin: "http://www.linkedin.com/in/amina" }],
    ["lookalike host", { linkedin: "https://www.linkedin.com.evil.example/in/amina" }],
    ["wrong platform", { instagram: "https://www.linkedin.com/in/amina" }],
    ["credentials", { instagram: "https://user:pass@instagram.com/amina" }],
    ["javascript scheme", { linkedin: "javascript:alert(1)" }],
    ["data scheme", { instagram: "data:text/html,<script>alert(1)</script>" }],
    ["not a url", { linkedin: "linkedin amina" }],
  ])("rejects a %s", (_label, overrides) => {
    expect(leaderFormSchema.safeParse(validForm(overrides)).success).toBe(false);
  });

  it.each([
    "Email me at amina@example.com",
    "Call +91 98765 43210",
    "Phone (0477) 223-3445",
  ])("rejects contact details in the bio: %s", (bio) => {
    expect(leaderFormSchema.safeParse(validForm({ bio })).success).toBe(false);
  });

  it("rejects empty names and over-long bios", () => {
    expect(leaderFormSchema.safeParse(validForm({ name: "  " })).success).toBe(false);
    expect(leaderFormSchema.safeParse(validForm({ bio: "a".repeat(601) })).success).toBe(false);
  });

  it("keeps Malayalam fields and stores empty or missing ones as null", () => {
    const filled = leaderFormSchema.parse(
      validForm({ nameMl: " അമീന ", roleMl: "സെക്രട്ടറി", bioMl: "" })
    );

    expect(filled).toMatchObject({
      nameMl: "അമീന",
      roleMl: "സെക്രട്ടറി",
      bioMl: null,
    });
    expect(leaderFormSchema.parse(validForm())).toMatchObject({ nameMl: null, roleMl: null, bioMl: null });
  });

  it("applies the bio rules to the Malayalam bio too", () => {
    expect(leaderFormSchema.safeParse(validForm({ bioMl: "a".repeat(601) })).success).toBe(false);
    expect(leaderFormSchema.safeParse(validForm({ bioMl: "amina@example.com" })).success).toBe(false);
    expect(leaderFormSchema.safeParse(validForm({ nameMl: "a".repeat(121) })).success).toBe(false);
  });

  it("only accepts new or a uuid as the editor id", () => {
    expect(leaderIdParamSchema.safeParse("new").success).toBe(true);
    expect(leaderIdParamSchema.safeParse(leaderId).success).toBe(true);
    expect(leaderIdParamSchema.safeParse("../team").success).toBe(false);
  });
});

describe("leader import", () => {
  it("uses stable keys so importing twice is a no-op", () => {
    const first = buildLeaderImportEntries(LEADERS);
    const second = buildLeaderImportEntries(LEADERS);

    expect(first.map((entry) => entry.import_key)).toEqual(second.map((entry) => entry.import_key));
    expect(new Set(first.map((entry) => entry.import_key)).size).toBe(LEADERS.length);
  });

  it("never imports email addresses", () => {
    expect(JSON.stringify(buildLeaderImportEntries(LEADERS))).not.toMatch(/@/);
  });

  it("skips SVG placeholders and unsafe paths but keeps raster photos", () => {
    const leaders: Leader[] = [
      { id: "a", name: "A", role: "R", bio: "", photo: "/images/leaders/a.svg" },
      { id: "b", name: "B", role: "R", bio: "", photo: "/images/leaders/b.jpg" },
      { id: "c", name: "C", role: "R", bio: "", photo: "/images/../../.env.png" },
      { id: "d", name: "D", role: "R", bio: "", photo: "https://evil.example/d.png" },
    ];

    expect(buildLeaderImportEntries(leaders).map((entry) => entry.sourcePhoto)).toEqual([
      null,
      "/images/leaders/b.jpg",
      null,
      null,
    ]);
  });
});

describe("getPublicLeaders", () => {
  it("never shows the bundled placeholder leaders, even when the database fails", async () => {
    const { getPublicLeaders } = await import("@/features/leaders/server/data");

    await expect(getPublicLeaders()).resolves.toEqual([]);
  });
});

describe("temporary upload paths", () => {
  it("only lets an admin finalize their own uploads", () => {
    const path = temporaryUploadPath(adminId, uploadId);

    expect(isOwnTemporaryUpload(adminId, path)).toBe(true);
    expect(isOwnTemporaryUpload(otherId, path)).toBe(false);
    expect(isOwnTemporaryUpload(adminId, `${adminId}/../${otherId}/${uploadId}`)).toBe(false);
    expect(isOwnTemporaryUpload(adminId, `${adminId}/${uploadId}/extra`)).toBe(false);
  });

  it("rejects disallowed types and sizes before issuing a URL", () => {
    expect(
      requestUploadSchema.safeParse({ purpose: "leader_photo", contentType: "image/gif", size: 100 }).success
    ).toBe(false);
    expect(
      requestUploadSchema.safeParse({ purpose: "leader_photo", contentType: "image/jpeg", size: 9 * 1024 * 1024 }).success
    ).toBe(false);
    expect(
      requestUploadSchema.safeParse({ purpose: "avatar", contentType: "image/jpeg", size: 100 }).success
    ).toBe(false);
  });
});

describe("actions require the admin role", () => {
  const adminOnly = { roles: ["admin"] };

  it.each([
    [
      "saveLeaderAction",
      async () => (await import("@/features/leaders/server/actions")).saveLeaderAction(null, form(validForm())),
    ],
    [
      "leaderRowAction",
      async () =>
        (await import("@/features/leaders/server/actions")).leaderRowAction(
          null,
          form({ id: leaderId, intent: "delete" })
        ),
    ],
    [
      "importLeadersAction",
      async () => (await import("@/features/leaders/server/actions")).importLeadersAction(null, form({})),
    ],
    [
      "requestImageUploadAction",
      async () =>
        (await import("@/features/media/server/actions")).requestImageUploadAction({
          purpose: "leader_photo",
          contentType: "image/jpeg",
          size: 1000,
        }),
    ],
    [
      "finalizeImageUploadAction",
      async () =>
        (await import("@/features/media/server/actions")).finalizeImageUploadAction({
          purpose: "leader_photo",
          uploadPath: temporaryUploadPath(adminId, uploadId),
        }),
    ],
  ])("%s rejects a reviewer without touching data", async (_name, run) => {
    await expect(run()).resolves.toEqual({
      ok: false,
      error: "You do not have access to this admin area.",
    });
    expect(guard.calls).toEqual([adminOnly]);
    expect(storage.downloads).toEqual([]);
  });
});

describe("finalizeImageUploadAction", () => {
  beforeEach(() => {
    guard.result = { ok: true, data: { user: { id: adminId, email: "admin@example.com" } } };
  });

  it("refuses another admin's upload without reading it", async () => {
    const { finalizeImageUploadAction } = await import("@/features/media/server/actions");
    const result = await finalizeImageUploadAction({
      purpose: "leader_photo",
      uploadPath: temporaryUploadPath(otherId, uploadId),
    });

    expect(result.ok).toBe(false);
    expect(storage.downloads).toEqual([]);
  });

  it("rejects a fake image and still deletes the temporary file", async () => {
    const { finalizeImageUploadAction } = await import("@/features/media/server/actions");
    const path = temporaryUploadPath(adminId, uploadId);
    const result = await finalizeImageUploadAction({ purpose: "leader_photo", uploadPath: path });

    expect(result).toEqual({ ok: false, error: "This file is not a JPG, PNG or WebP image." });
    expect(storage.removed).toEqual([[path]]);
  });
});
