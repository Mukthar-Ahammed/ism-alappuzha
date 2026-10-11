import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Issue } from "@/data/issues";
import { issueFormSchema } from "@/features/issues/schemas";
import { issueMonthYear, splitFeaturedIssue } from "@/features/issues/workflow";
import { temporaryUploadPath } from "@/features/media/schemas";
import { checkPdf, maxPdfBytes } from "@/lib/pdf/check";

const state = vi.hoisted(() => {
  const downloadBody: Uint8Array = new Uint8Array();

  return {
    guardCalls: [] as unknown[],
    rpcCalls: [] as string[],
    uploads: [] as { bucket: string; path: string; contentType: string | undefined }[],
    removed: [] as { bucket: string; paths: string[] }[],
    downloadBody,
    allowed: false,
  };
});

const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const uploadId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const denied = { ok: false, error: "You do not have access to this admin area." } as const;

vi.mock("@/lib/auth/guard", () => ({
  requireAdminAction: async (options: unknown) => {
    state.guardCalls.push(options);
    return state.allowed
      ? { ok: true, data: { user: { id: adminId, email: "admin@example.com" } } }
      : denied;
  },
  requireAdminActor: async (options: unknown) => {
    state.guardCalls.push(options);
    return state.allowed ? { ok: true, actor: "admin@example.com" } : denied;
  },
}));

vi.mock("@/lib/auth/rate-limit", () => ({ checkRateLimit: async () => true }));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  unstable_cache: <T>(fn: T) => fn,
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co" },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc: async (name: string) => {
      state.rpcCalls.push(name);
      return { data: null, error: null };
    },
    storage: {
      from: (bucket: string) => ({
        download: async () => ({ data: new Blob([state.downloadBody.slice()]), error: null }),
        upload: async (path: string, _body: unknown, options: { contentType?: string }) => {
          state.uploads.push({ bucket, path, contentType: options.contentType });
          return { data: { path }, error: null };
        },
        remove: async (paths: string[]) => {
          state.removed.push({ bucket, paths });
          return { data: [], error: null };
        },
        createSignedUploadUrl: async (path: string) => ({
          data: { signedUrl: `https://project.supabase.co/upload/${path}` },
          error: null,
        }),
      }),
    },
  }),
}));

function pdfBytes(body = "1 0 obj << >> endobj", trailer = "%%EOF\n"): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.7\n${body}\ntrailer << >>\n${trailer}`);
}

function form(values: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

const validIssue = {
  id: "",
  title: "Voice of Truth",
  issueDate: "2026-09-01",
  description: "Youth and campus special.",
  coverMediaId: "11111111-1111-4111-8111-111111111111",
  coverAlt: "",
  pdfPath: "issues/22222222-2222-4222-8222-222222222222.pdf",
  pdfBytes: "120000",
};

beforeEach(() => {
  state.guardCalls.length = 0;
  state.rpcCalls.length = 0;
  state.uploads.length = 0;
  state.removed.length = 0;
  state.allowed = false;
  state.downloadBody = pdfBytes();
});

describe("checkPdf", () => {
  it("accepts a PDF with a header and an end-of-file marker", () => {
    expect(checkPdf(pdfBytes())).toBeNull();
    expect(checkPdf(pdfBytes("x", "%%EOF\r\n\n   \n"))).toBeNull();
  });

  it.each([
    ["no end-of-file marker", pdfBytes("x", "")],
    ["an HTML page", new TextEncoder().encode("<html><script>alert(1)</script></html>%%EOF")],
    ["a header that is not at the start", new TextEncoder().encode(" %PDF-1.7\n%%EOF")],
    [
      "an image renamed to .pdf",
      new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x25, 0x25, 0x45, 0x4f, 0x46]),
    ],
  ])("rejects %s", (_label, bytes) => {
    expect(checkPdf(bytes)).toBe("not_pdf");
  });

  it("rejects empty and oversized files", () => {
    expect(checkPdf(new Uint8Array())).toBe("empty");
    expect(checkPdf(new Uint8Array(maxPdfBytes + 1))).toBe("too_large");
  });
});

describe("issueFormSchema", () => {
  it("accepts a complete issue", () => {
    expect(issueFormSchema.parse(validIssue)).toMatchObject({ id: null, pdfBytes: 120000 });
  });

  it("requires a cover and a PDF", () => {
    expect(issueFormSchema.safeParse({ ...validIssue, coverMediaId: "" }).success).toBe(false);
    expect(issueFormSchema.safeParse({ ...validIssue, pdfPath: "" }).success).toBe(false);
  });

  it.each([
    "issues/../uploads-tmp/x.pdf",
    "uploads/22222222-2222-4222-8222-222222222222.pdf",
    "issues/22222222-2222-4222-8222-222222222222.html",
    "https://evil.example/issue.pdf",
  ])("only accepts PDFs stored by the upload flow, not %s", (pdfPath) => {
    expect(issueFormSchema.safeParse({ ...validIssue, pdfPath }).success).toBe(false);
  });

  it("limits the description and requires a real date", () => {
    expect(issueFormSchema.safeParse({ ...validIssue, description: "a".repeat(501) }).success).toBe(
      false
    );
    expect(issueFormSchema.safeParse({ ...validIssue, issueDate: "September 2026" }).success).toBe(
      false
    );
  });

  it("keeps optional Malayalam text and turns blank or missing fields into null", () => {
    expect(issueFormSchema.parse(validIssue)).toMatchObject({ titleMl: null, descriptionMl: null });
    expect(
      issueFormSchema.parse({ ...validIssue, titleMl: "  പുതിയ ലക്കം  ", descriptionMl: "   " })
    ).toMatchObject({ titleMl: "പുതിയ ലക്കം", descriptionMl: null });
    expect(issueFormSchema.safeParse({ ...validIssue, descriptionMl: "അ".repeat(501) }).success).toBe(
      false
    );
  });
});

describe("homepage issue selection", () => {
  const issue = (id: string, isFeatured = false): Issue => ({
    id,
    title: id,
    month: "September",
    year: 2026,
    summary: "",
    pdfUrl: `https://project.supabase.co/${id}.pdf`,
    isFeatured,
  });

  it("spotlights the featured issue and archives the rest in order", () => {
    const { featured, archive } = splitFeaturedIssue([
      issue("sep"),
      issue("aug", true),
      issue("jul"),
    ]);

    expect(featured?.id).toBe("aug");
    expect(archive.map((item) => item.id)).toEqual(["sep", "jul"]);
  });

  it("falls back to the newest issue when none is featured", () => {
    const { featured, archive } = splitFeaturedIssue([issue("sep"), issue("aug")]);

    expect(featured?.id).toBe("sep");
    expect(archive.map((item) => item.id)).toEqual(["aug"]);
  });

  it("has nothing to show when no issue is published", () => {
    expect(splitFeaturedIssue([])).toEqual({ featured: null, archive: [] });
  });

  it("labels issues by month and year", () => {
    expect(issueMonthYear("2026-09-01")).toEqual({ month: "September", year: 2026 });
    expect(issueMonthYear("2026-12-31")).toEqual({ month: "December", year: 2026 });
  });

  it("shows an empty state instead of sample issues", async () => {
    const { LatestIssue } = await import("@/components/sections/LatestIssue");
    const html = renderToStaticMarkup(createElement(LatestIssue, { issues: [] }));

    expect(html).toContain("The first issue will be published here soon.");
  });

  it("renders the featured issue without loading the PDF", async () => {
    const { LatestIssue } = await import("@/components/sections/LatestIssue");
    const html = renderToStaticMarkup(
      createElement(LatestIssue, { issues: [issue("Voice of Truth", true)] })
    );

    expect(html).toContain("Voice of Truth");
    expect(html).not.toContain("<iframe");
  });
});

describe("issue and PDF actions", () => {
  it.each([
    [
      "saveIssueAction",
      async () =>
        (await import("@/features/issues/server/actions")).saveIssueAction(null, form(validIssue)),
    ],
    [
      "issueRowAction",
      async () =>
        (await import("@/features/issues/server/actions")).issueRowAction(
          null,
          form({ id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", intent: "feature" })
        ),
    ],
    [
      "requestPdfUploadAction",
      async () =>
        (await import("@/features/media/server/actions")).requestPdfUploadAction({ size: 1000 }),
    ],
    [
      "finalizePdfUploadAction",
      async () =>
        (await import("@/features/media/server/actions")).finalizePdfUploadAction({
          uploadPath: temporaryUploadPath(adminId, uploadId),
        }),
    ],
  ])("%s rejects a reviewer without touching data", async (_name, run) => {
    await expect(run()).resolves.toEqual(denied);
    expect(state.guardCalls).toEqual([{ roles: ["admin"] }]);
    expect(state.rpcCalls).toEqual([]);
    expect(state.uploads).toEqual([]);
  });

  it("refuses PDFs over 25 MB before issuing an upload URL", async () => {
    state.allowed = true;
    const { requestPdfUploadAction } = await import("@/features/media/server/actions");

    expect((await requestPdfUploadAction({ size: maxPdfBytes + 1 })).ok).toBe(false);
    expect(state.guardCalls).toEqual([]);
  });

  it("stores a real PDF publicly under a random name and deletes the upload", async () => {
    state.allowed = true;
    const { finalizePdfUploadAction } = await import("@/features/media/server/actions");
    const uploadPath = temporaryUploadPath(adminId, uploadId);
    const result = await finalizePdfUploadAction({ uploadPath });

    expect(result.ok).toBe(true);
    expect(state.uploads).toHaveLength(1);
    expect(state.uploads[0]).toMatchObject({
      bucket: "issue-pdfs",
      contentType: "application/pdf",
    });
    expect(state.uploads[0]?.path).toMatch(/^issues\/[0-9a-f-]{36}\.pdf$/);
    expect(state.removed).toEqual([{ bucket: "uploads-tmp", paths: [uploadPath] }]);
  });

  it("rejects a disguised file, never publishes it, and still deletes the upload", async () => {
    state.allowed = true;
    state.downloadBody = new TextEncoder().encode("<html>not a pdf</html>");
    const { finalizePdfUploadAction } = await import("@/features/media/server/actions");
    const uploadPath = temporaryUploadPath(adminId, uploadId);
    const result = await finalizePdfUploadAction({ uploadPath });

    expect(result.ok).toBe(false);
    expect(state.uploads).toEqual([]);
    expect(state.removed).toEqual([{ bucket: "uploads-tmp", paths: [uploadPath] }]);
  });

  it("refuses another admin's upload", async () => {
    state.allowed = true;
    const { finalizePdfUploadAction } = await import("@/features/media/server/actions");
    const result = await finalizePdfUploadAction({
      uploadPath: temporaryUploadPath(otherId, uploadId),
    });

    expect(result.ok).toBe(false);
    expect(state.uploads).toEqual([]);
    expect(state.removed).toEqual([]);
  });
});
