import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc,
  }),
}));

describe("checkRateLimit", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("returns true when the database function allows the hit", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const { checkRateLimit } = await import("@/lib/auth/rate-limit");

    await expect(checkRateLimit("admin:login:test", 5, 900)).resolves.toBe(
      true
    );
    expect(rpc).toHaveBeenCalledWith("check_rate_limit", {
      key: "admin:login:test",
      max_hits: 5,
      window_seconds: 900,
    });
  });

  it("returns false when the database function blocks the hit", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const { checkRateLimit } = await import("@/lib/auth/rate-limit");

    await expect(checkRateLimit("admin:verify:test", 5, 600)).resolves.toBe(
      false
    );
  });

  it("fails closed on database errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "nope" } });
    const { checkRateLimit } = await import("@/lib/auth/rate-limit");

    await expect(checkRateLimit("admin:login:test", 5, 900)).resolves.toBe(
      false
    );
  });

  it("allows local development when the unapplied SQL repair is detected", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "development");
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: "42702",
        message: 'column reference "key" is ambiguous',
      },
    });
    const { checkRateLimit } = await import("@/lib/auth/rate-limit");

    await expect(checkRateLimit("admin:login:test", 5, 900)).resolves.toBe(
      true
    );
    vi.stubEnv("NODE_ENV", originalNodeEnv);
  });
});
