import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { namazSteps as bundledSteps } from "@/data/namaz";
import { namazRowActionSchema, namazStepFormSchema } from "@/features/namaz/schemas";
import type { AdminNamazStep } from "@/features/namaz/types";
import { guidanceLines, toPrayerSteps } from "@/features/namaz/workflow";

const state = vi.hoisted(() => ({
  guardCalls: [] as unknown[],
  rpcCalls: [] as { name: string; args: Record<string, unknown> }[],
  rpcResult: { data: null as unknown, error: null as { message: string; code?: string } | null },
  selectResult: { data: [] as unknown[], error: null as { message: string; code?: string } | null },
  /** Results handed out before selectResult, one per query. */
  selectQueue: [] as { data: unknown[] | null; error: { message: string; code?: string } | null }[],
  selectedColumns: [] as string[],
  redirects: [] as string[],
  allowed: false,
}));

const stepId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
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

vi.mock("@/lib/supabase/admin", () => {
  const query = {
    select: (columns: string) => {
      state.selectedColumns.push(columns);
      return query;
    },
    eq: () => query,
    order: () => query,
    limit: () => query,
    overrideTypes: async () => state.selectQueue.shift() ?? state.selectResult,
  };

  return {
    createSupabaseAdminClient: () => ({
      from: () => query,
      rpc: async (name: string, args: Record<string, unknown>) => {
        state.rpcCalls.push({ name, args });
        return state.rpcResult;
      },
    }),
  };
});

function form(values: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

const validStep = {
  id: "",
  name: "Ruku (Bowing)",
  whatToDo: "Bow with a straight back.",
  arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
  transliteration: "Subhana Rabbiyal Azeem",
  malayalam: "",
  dos: "Keep back flat\n\n  Hands on knees  \n",
  donts: "",
};

function adminStep(overrides: Partial<AdminNamazStep>): AdminNamazStep {
  return {
    id: "s",
    position: 1,
    name: "Step",
    whatToDo: "Do it.",
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: null,
    malayalam: null,
    dos: [],
    donts: [],
    nameMl: null,
    whatToDoMl: null,
    transliterationMl: null,
    dosMl: [],
    dontsMl: [],
    isRepeatNode: false,
    status: "published",
    ...overrides,
  };
}

const dbRow = (position: number, name: string) => ({
  id: `id-${position}`,
  position,
  name,
  what_to_do: "Do it.",
  arabic: "اللَّهُ أَكْبَرُ",
  transliteration: "Allahu Akbar",
  malayalam: null,
  dos: ["A"],
  donts: null,
  is_repeat_node: false,
  status: "published",
});

beforeEach(() => {
  state.guardCalls.length = 0;
  state.rpcCalls.length = 0;
  state.redirects.length = 0;
  state.rpcResult = { data: null, error: null };
  state.selectResult = { data: [], error: null };
  state.selectQueue.length = 0;
  state.selectedColumns.length = 0;
  state.allowed = false;
});

describe("namazStepFormSchema", () => {
  it("turns the Do and Don't textareas into trimmed lists, one item per line", () => {
    const parsed = namazStepFormSchema.parse(validStep);

    expect(parsed).toMatchObject({
      id: null,
      dos: ["Keep back flat", "Hands on knees"],
      donts: [],
      malayalam: null,
      isRepeatNode: false,
    });
    expect(guidanceLines("a\r\nb\n\n")).toEqual(["a", "b"]);
  });

  it("keeps the Malayalam versions, and treats a form without them as empty", () => {
    expect(namazStepFormSchema.parse(validStep)).toMatchObject({
      nameMl: null,
      whatToDoMl: null,
      transliterationMl: null,
      dosMl: [],
      dontsMl: [],
    });
    expect(
      namazStepFormSchema.parse({
        ...validStep,
        nameMl: " റുകൂഅ് ",
        whatToDoMl: "മുതുക് നിവർത്തി കുനിയുക.",
        transliterationMl: "സുബ്ഹാന റബ്ബിയൽ അളീം",
        dosMl: "മുതുക് നിവർത്തുക\n\n കൈകൾ കാൽമുട്ടുകളിൽ ",
      })
    ).toMatchObject({
      nameMl: "റുകൂഅ്",
      transliterationMl: "സുബ്ഹാന റബ്ബിയൽ അളീം",
      dosMl: ["മുതുക് നിവർത്തുക", "കൈകൾ കാൽമുട്ടുകളിൽ"],
    });
    expect(namazStepFormSchema.safeParse({ ...validStep, nameMl: "x".repeat(121) }).success).toBe(false);
    expect(namazStepFormSchema.safeParse({ ...validStep, dontsMl: "1\n2\n3\n4\n5\n6\n7\n8\n9" }).success).toBe(false);
  });

  it("reads the repeat-cycle checkbox", () => {
    expect(namazStepFormSchema.parse({ ...validStep, isRepeatNode: "on" }).isRepeatNode).toBe(true);
  });

  it("requires a name, instructions and Arabic, and caps the lists at 8 lines", () => {
    expect(namazStepFormSchema.safeParse({ ...validStep, name: " " }).success).toBe(false);
    expect(namazStepFormSchema.safeParse({ ...validStep, whatToDo: "" }).success).toBe(false);
    expect(namazStepFormSchema.safeParse({ ...validStep, arabic: "" }).success).toBe(false);
    expect(namazStepFormSchema.safeParse({ ...validStep, dos: "1\n2\n3\n4\n5\n6\n7\n8\n9" }).success).toBe(false);
    expect(namazStepFormSchema.safeParse({ ...validStep, dos: "x".repeat(201) }).success).toBe(false);
  });

  it("limits row actions to known intents", () => {
    expect(namazRowActionSchema.safeParse({ id: stepId, intent: "feature" }).success).toBe(false);
  });
});

describe("public Namaz guide", () => {
  it("numbers published steps 1..n in admin order", () => {
    const steps = toPrayerSteps([
      adminStep({ id: "b", position: 5, name: "Second" }),
      adminStep({ id: "a", position: 2, name: "First", isRepeatNode: true }),
    ]);

    expect(steps.map((step) => [step.stepNumber, step.name, step.isRepeatNode])).toEqual([
      [1, "First", true],
      [2, "Second", undefined],
    ]);
  });

  it("shows exactly what is published once the table exists", async () => {
    state.selectResult = { data: [dbRow(1, "Niyyah"), dbRow(2, "Takbeer")], error: null };
    const { getPublicNamazSteps } = await import("@/features/namaz/server/data");

    const steps = await getPublicNamazSteps();
    expect(steps.map((step) => step.name)).toEqual(["Niyyah", "Takbeer"]);
    expect(steps[0]).toMatchObject({ transliteration: "Allahu Akbar", malayalam: "", donts: [] });
  });

  it("passes the Malayalam versions through, leaving empty lists out", async () => {
    state.selectResult = {
      data: [{ ...dbRow(1, "Niyyah"), name_ml: "നിയ്യത്ത്", dos_ml: [], donts_ml: ["സംസാരിക്കരുത്"] }],
      error: null,
    };
    const { getPublicNamazSteps } = await import("@/features/namaz/server/data");

    const [step] = await getPublicNamazSteps();
    expect(step).toMatchObject({ name: "Niyyah", nameMl: "നിയ്യത്ത്", dontsMl: ["സംസാരിക്കരുത്"] });
    expect(step.dosMl).toBeUndefined();
  });

  it("still reads the steps before the Malayalam columns have been added", async () => {
    state.selectQueue.push({ data: null, error: { message: "column does not exist", code: "42703" } });
    state.selectResult = { data: [dbRow(1, "Niyyah")], error: null };
    const { getPublicNamazSteps } = await import("@/features/namaz/server/data");

    await expect(getPublicNamazSteps()).resolves.toMatchObject([{ name: "Niyyah" }]);
    expect(state.selectedColumns[0]).toContain("name_ml");
    expect(state.selectedColumns[1]).not.toContain("_ml");
  });

  it("keeps the existing guide on the site until the phase 11 SQL has been run", async () => {
    state.selectResult = { data: [], error: { message: "relation does not exist", code: "PGRST205" } };
    const { getPublicNamazSteps } = await import("@/features/namaz/server/data");

    await expect(getPublicNamazSteps()).resolves.toBe(bundledSteps);
    expect(bundledSteps).toHaveLength(12);
  });

  it("hides the section when every step has been unpublished", async () => {
    const { NamazGuide } = await import("@/components/sections/NamazGuide");

    expect(renderToStaticMarkup(createElement(NamazGuide, { steps: [] }))).toBe("");
  });

  it("renders the featured first step, the timeline and a skip control", async () => {
    const { NamazGuide } = await import("@/components/sections/NamazGuide");
    const html = renderToStaticMarkup(createElement(NamazGuide, { steps: bundledSteps }));

    expect(html).toContain("Niyyah (Intention)");
    expect(html).toContain("Tasleem (Salam)");
    expect(html).toContain("Skip the step-by-step guide");
    expect(html).toContain("Skip to Dhikr &amp; Dua");
  });
});

describe("Namaz admin actions", () => {
  it("refuses a visitor without touching data", async () => {
    const { saveNamazStepAction, namazRowAction } = await import("@/features/namaz/server/actions");

    await expect(saveNamazStepAction(null, form(validStep))).resolves.toEqual(denied);
    await expect(namazRowAction(null, form({ id: stepId, intent: "publish" }))).resolves.toEqual(denied);
    expect(state.guardCalls).toEqual([{ roles: ["admin", "reviewer"] }, { roles: ["admin", "reviewer"] }]);
    expect(state.rpcCalls).toEqual([]);
  });

  it("adds a step as a draft and opens it in the editor", async () => {
    state.allowed = true;
    state.rpcResult = { data: { id: stepId }, error: null };
    const { saveNamazStepAction } = await import("@/features/namaz/server/actions");

    await expect(saveNamazStepAction(null, form({ ...validStep, isRepeatNode: "on" }))).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(state.rpcCalls).toEqual([
      {
        name: "admin_save_namaz_step",
        args: {
          p_id: null,
          p_name: "Ruku (Bowing)",
          p_name_ml: null,
          p_what_to_do: "Bow with a straight back.",
          p_what_to_do_ml: null,
          p_arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ",
          p_transliteration: "Subhana Rabbiyal Azeem",
          p_transliteration_ml: null,
          p_malayalam: null,
          p_dos: ["Keep back flat", "Hands on knees"],
          p_dos_ml: [],
          p_donts: [],
          p_donts_ml: [],
          p_is_repeat_node: true,
          p_actor_email: "reviewer@example.com",
        },
      },
    ]);
    expect(state.redirects).toEqual([`/admin/namaz/${stepId}?created=1`]);
  });

  it("edits an existing step in place", async () => {
    state.allowed = true;
    state.rpcResult = { data: { id: stepId }, error: null };
    const { saveNamazStepAction } = await import("@/features/namaz/server/actions");

    await expect(saveNamazStepAction(null, form({ ...validStep, id: stepId }))).resolves.toEqual({
      ok: true,
      data: { message: "Saved." },
    });
    expect(state.rpcCalls[0]?.args.p_id).toBe(stepId);
  });

  it.each([
    ["publish", "admin_set_namaz_step_status", { p_status: "published" }],
    ["unpublish", "admin_set_namaz_step_status", { p_status: "draft" }],
    ["up", "admin_move_namaz_step", { p_direction: "up" }],
    ["down", "admin_move_namaz_step", { p_direction: "down" }],
    ["delete", "admin_delete_namaz_step", {}],
  ])("%s calls %s", async (intent, rpc, args) => {
    state.allowed = true;
    const { namazRowAction } = await import("@/features/namaz/server/actions");
    const result = await namazRowAction(null, form({ id: stepId, intent }));

    expect(result?.ok).toBe(true);
    expect(state.rpcCalls).toEqual([
      { name: rpc, args: { p_id: stepId, p_actor_email: "reviewer@example.com", ...args } },
    ]);
  });

  it("names the SQL file to run when the phase 11 functions are missing", async () => {
    state.allowed = true;
    state.rpcResult = { data: null, error: { message: "Could not find the function", code: "PGRST202" } };
    const { saveNamazStepAction } = await import("@/features/namaz/server/actions");

    await expect(saveNamazStepAction(null, form(validStep))).resolves.toEqual({
      ok: false,
      error:
        "Database setup is incomplete. Run supabase/phase11-namaz-combined.sql, then supabase/phase12-malayalam-content-combined.sql in the Supabase SQL Editor, then try again.",
    });
  });
});
