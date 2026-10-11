import { describe, expect, it } from "vitest";
import {
  assertQuestionFresh,
  canPublishQuestion,
  isPrivatePublishBlocked,
  isReplyVisibleToAsker,
  nextStatusAfterArchive,
  nextStatusAfterRestore,
} from "@/features/questions/workflow";

describe("question workflow rules", () => {
  it("blocks private questions from being published", () => {
    expect(
      canPublishQuestion({
        is_private: true,
        status: "answered",
        answer: "A reply",
      })
    ).toBe(false);
    expect(
      isPrivatePublishBlocked({
        is_private: true,
        is_published: true,
      })
    ).toBe(true);
  });

  it("keeps replies invisible until the question is answered", () => {
    expect(
      isReplyVisibleToAsker({
        status: "draft",
        answer: "Draft reply",
      })
    ).toBe(false);
    expect(
      isReplyVisibleToAsker({
        status: "answered",
        answer: "Sent reply",
      })
    ).toBe(true);
  });

  it("uses the archive and restore transitions from the workflow", () => {
    expect(nextStatusAfterArchive()).toBe("archived");
    expect(nextStatusAfterRestore()).toBe("pending");
  });

  it("detects stale saves using updated_at", () => {
    expect(assertQuestionFresh("2026-10-11T00:00:00.000Z", "2026-10-11T00:00:00.000Z")).toEqual({
      ok: true,
    });
    expect(assertQuestionFresh("2026-10-11T00:00:01.000Z", "2026-10-11T00:00:00.000Z")).toEqual({
      ok: false,
      error: "Someone else changed this question. Refresh the page before saving.",
    });
  });
});
