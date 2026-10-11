import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dhikrCategories, dhikrEntryCategories } from "@/data/dhikr";
import { dhikrFormSchema, dhikrRowActionSchema } from "@/features/dhikr/schemas";
import type { AdminDhikr } from "@/features/dhikr/types";
import { adminDhikrToPublic, dhikrErrorMessage, sortDhikr } from "@/features/dhikr/workflow";

const state = vi.hoisted(() => ({
  guardCalls: [] as unknown[],
  rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
  rpcResult: { data: null as unknown, error: null as { message: string } | null },
  redirects: [] as string[],
  allowed: false,
}));

const entryId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const denied = { ok: false, error: "You do not have access to this admin area." } as const;

vi.mock("@/lib/auth/guard", () => ({
  requireAdminActor: async (options: unknown) => {
    state.guardCalls.push(options);
    return state.allowed ? { ok: true, actor: "reviewer@example.com" } : denied;
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  unstable_cache: <T>(fn: T) => fn,
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    state.redirects.push(path);
    throw new Error("NEXT_REDIRECT");
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      state.rpcCalls.push({ name, args });
      return state.rpcResult;
    },
  }),
}));

function form(values: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

const validEntry = {
  id: "",
  title: "After eating",
  category: "Food",
  arabic: "الْحَمْدُ لِلَّهِ",
  transliteration: "Alhamdulillah",
  malayalam: "",
  reference: "Sunan At-Tirmidhi 3458",
  repeatCount: "",
};

function entry(overrides: Partial<AdminDhikr>): AdminDhikr {
  return {
    id: "e",
    title: "Entry",
    category: "Food",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: null,
    transliterationMl: null,
    malayalam: null,
    reference: null,
    referenceMl: null,
    repeatCount: null,
    sortOrder: 1,
    status: "published",
    reviewedBy: "reviewer@example.com",
    reviewedAt: "2026-10-11T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  state.guardCalls.length = 0;
  state.rpcCalls.length = 0;
  state.redirects.length = 0;
  state.rpcResult = { data: null, error: null };
  state.allowed = false;
});

describe("dhikrFormSchema", () => {
  it("accepts an entry and turns empty optional fields into null", () => {
    const parsed = dhikrFormSchema.parse(validEntry);

    expect(parsed).toMatchObject({ id: null, malayalam: null, repeatCount: null, category: "Food" });
  });

  it("keeps the Malayalam pronunciation and source, and treats missing ones as empty", () => {
    expect(dhikrFormSchema.parse(validEntry)).toMatchObject({ transliterationMl: null, referenceMl: null });
    expect(
      dhikrFormSchema.parse({ ...validEntry, transliterationMl: "  MLTEXT  ", referenceMl: "MLSOURCE" })
    ).toMatchObject({ transliterationMl: "MLTEXT", referenceMl: "MLSOURCE" });
    expect(dhikrFormSchema.safeParse({ ...validEntry, referenceMl: "x".repeat(301) }).success).toBe(false);
  });

  it("requires Arabic text, a name and a known category", () => {
    expect(dhikrFormSchema.safeParse({ ...validEntry, arabic: "  " }).success).toBe(false);
    expect(dhikrFormSchema.safeParse({ ...validEntry, title: "" }).success).toBe(false);
    expect(dhikrFormSchema.safeParse({ ...validEntry, category: "All" }).success).toBe(false);
    expect(dhikrFormSchema.safeParse({ ...validEntry, category: "Favorites" }).success).toBe(false);
  });

  it("accepts a whole repeat count from 1 to 1000 only", () => {
    expect(dhikrFormSchema.parse({ ...validEntry, repeatCount: "33" }).repeatCount).toBe(33);

    for (const repeatCount of ["0", "1001", "2.5", "-3", "abc"]) {
      expect(dhikrFormSchema.safeParse({ ...validEntry, repeatCount }).success).toBe(false);
    }
  });

  it("limits row actions to known intents", () => {
    expect(dhikrRowActionSchema.safeParse({ id: entryId, intent: "feature" }).success).toBe(false);
    expect(dhikrRowActionSchema.safeParse({ id: "1", intent: "publish" }).success).toBe(false);
  });

  it("keeps the filter chips and the entry categories in step", () => {
    expect(dhikrCategories).toEqual(["All", ...dhikrEntryCategories]);
  });
});

describe("public dhikr", () => {
  it("orders by category, then by the admin order", () => {
    const sorted = sortDhikr([
      entry({ id: "food-2", category: "Food", sortOrder: 2 }),
      entry({ id: "sleep-1", category: "Sleep", sortOrder: 1 }),
      entry({ id: "food-1", category: "Food", sortOrder: 1 }),
      entry({ id: "morning-1", category: "Morning & Evening", sortOrder: 1 }),
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["morning-1", "sleep-1", "food-1", "food-2"]);
  });

  it("maps admin entries to the cards visitors see", () => {
    expect(adminDhikrToPublic(entry({ reference: "Sahih Muslim 591", repeatCount: 3 }))).toEqual({
      id: "e",
      category: "Food",
      arabic: "بِسْمِ اللَّهِ",
      transliteration: "",
      malayalam: "",
      source: "Sahih Muslim 591",
      repeat: 3,
    });
  });

  it("shows an empty state instead of sample dhikr", async () => {
    const { DhikrLibrary } = await import("@/components/sections/DhikrLibrary");
    const html = renderToStaticMarkup(createElement(DhikrLibrary, { items: [], isHomePage: true }));

    expect(html).toContain("Dhikr and dua will be published here soon.");
    expect(html).not.toContain("Show all dhikr");
    expect(html).not.toContain("TODO");
  });

  it("explains why an unchecked entry cannot be published", () => {
    expect(dhikrErrorMessage("dhikr_not_reviewed")).toBe("Mark the text as checked before publishing it.");
  });
});

describe("dhikr actions", () => {
  it("refuses a visitor without touching data", async () => {
    const { saveDhikrAction, dhikrRowAction } = await import("@/features/dhikr/server/actions");

    await expect(saveDhikrAction(null, form(validEntry))).resolves.toEqual(denied);
    await expect(dhikrRowAction(null, form({ id: entryId, intent: "publish" }))).resolves.toEqual(denied);
    expect(state.guardCalls).toEqual([{ roles: ["admin", "reviewer"] }, { roles: ["admin", "reviewer"] }]);
    expect(state.rpcCalls).toEqual([]);
  });

  it("does not reach the guard with an invalid form", async () => {
    const { saveDhikrAction } = await import("@/features/dhikr/server/actions");
    const result = await saveDhikrAction(null, form({ ...validEntry, arabic: "" }));

    expect(result).toEqual({ ok: false, error: "Enter the Arabic text." });
    expect(state.guardCalls).toEqual([]);
  });

  it("creates a draft and opens it in the editor", async () => {
    state.allowed = true;
    state.rpcResult = { data: { id: entryId, review_cleared: false }, error: null };
    const { saveDhikrAction } = await import("@/features/dhikr/server/actions");

    await expect(saveDhikrAction(null, form({ ...validEntry, repeatCount: "3" }))).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(state.rpcCalls).toEqual([
      {
        name: "admin_save_dhikr",
        args: {
          p_id: null,
          p_title: "After eating",
          p_category: "Food",
          p_arabic: "الْحَمْدُ لِلَّهِ",
          p_transliteration: "Alhamdulillah",
          p_transliteration_ml: null,
          p_malayalam: null,
          p_reference: "Sunan At-Tirmidhi 3458",
          p_reference_ml: null,
          p_repeat_count: 3,
          p_actor_email: "reviewer@example.com",
        },
      },
    ]);
    expect(state.redirects).toEqual([`/admin/dhikr/${entryId}?created=1`]);
  });

  it("tells the editor when a text change sent a checked entry back to drafts", async () => {
    state.allowed = true;
    state.rpcResult = { data: { id: entryId, review_cleared: true }, error: null };
    const { saveDhikrAction } = await import("@/features/dhikr/server/actions");
    const result = await saveDhikrAction(null, form({ ...validEntry, id: entryId }));

    expect(result).toEqual({
      ok: true,
      data: { message: "Saved. The text changed, so it is back in drafts until it is checked again." },
    });
  });

  it.each([
    ["check", "admin_set_dhikr_review", { p_reviewed: true }],
    ["uncheck", "admin_set_dhikr_review", { p_reviewed: false }],
    ["publish", "admin_set_dhikr_status", { p_status: "published" }],
    ["unpublish", "admin_set_dhikr_status", { p_status: "draft" }],
    ["up", "admin_move_dhikr", { p_direction: "up" }],
    ["down", "admin_move_dhikr", { p_direction: "down" }],
    ["delete", "admin_delete_dhikr", {}],
  ])("%s calls %s", async (intent, rpc, args) => {
    state.allowed = true;
    const { dhikrRowAction } = await import("@/features/dhikr/server/actions");
    const result = await dhikrRowAction(null, form({ id: entryId, intent }));

    expect(result?.ok).toBe(true);
    expect(state.rpcCalls).toEqual([
      { name: rpc, args: { p_id: entryId, p_actor_email: "reviewer@example.com", ...args } },
    ]);
  });

  it("names the SQL file to run when the phase 9 functions are missing", async () => {
    state.allowed = true;
    state.rpcResult = {
      data: null,
      error: { message: "Could not find the function public.admin_save_dhikr", code: "PGRST202" } as {
        message: string;
      },
    };
    const { saveDhikrAction } = await import("@/features/dhikr/server/actions");

    await expect(saveDhikrAction(null, form(validEntry))).resolves.toEqual({
      ok: false,
      error:
        "Database setup is incomplete. Run supabase/phase9-dhikr-combined.sql, then supabase/phase12-malayalam-content-combined.sql in the Supabase SQL Editor, then try again.",
    });
  });

  it("reports an unchecked entry the database refused to publish", async () => {
    state.allowed = true;
    state.rpcResult = { data: null, error: { message: "dhikr_not_reviewed" } };
    const { dhikrRowAction } = await import("@/features/dhikr/server/actions");

    await expect(dhikrRowAction(null, form({ id: entryId, intent: "publish" }))).resolves.toEqual({
      ok: false,
      error: "Mark the text as checked before publishing it.",
    });
  });
});
