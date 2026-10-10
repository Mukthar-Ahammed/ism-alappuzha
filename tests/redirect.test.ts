import { describe, expect, it } from "vitest";
import { sanitizeAdminNext } from "@/lib/auth/redirect";

describe("sanitizeAdminNext", () => {
  it("keeps relative admin paths", () => {
    expect(sanitizeAdminNext("/admin/security?tab=mfa")).toBe(
      "/admin/security?tab=mfa"
    );
  });

  it("rejects external URLs", () => {
    expect(sanitizeAdminNext("https://example.com/admin")).toBe("/admin");
  });

  it("rejects protocol-relative redirects", () => {
    expect(sanitizeAdminNext("//example.com/admin")).toBe("/admin");
  });

  it("rejects public paths", () => {
    expect(sanitizeAdminNext("/dhikr")).toBe("/admin");
  });
});
