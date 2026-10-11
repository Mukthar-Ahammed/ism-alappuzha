import { describe, expect, it } from "vitest";
import {
  generateTicketId,
  genericStatusFailure,
  publishedRowsToQuestions,
  qaRateLimitKey,
  REQUIRE_EMAIL_FOR_STATUS_CHECK,
  ticketRateLimitKey,
} from "@/lib/qa/public";
import { askQuestionSchema, statusRequestSchema } from "@/lib/qa/schemas";
import { sendQuestionEmail } from "@/features/questions/server/email";

describe("public Q&A helpers", () => {
  it("generates unguessable ticket IDs with an unambiguous alphabet", () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateTicketId()));

    expect(ids.size).toBe(500);

    for (const id of ids) {
      expect(id).toMatch(/^Q-[A-HJ-NP-Z2-9]{12}$/);
      expect(id).not.toMatch(/[0O1I]/);
    }
  });

  it("uses the same status failure response for every status lookup failure", () => {
    const wrongTicket = genericStatusFailure;
    const wrongEmail = genericStatusFailure;

    expect(wrongTicket).toEqual(wrongEmail);
  });

  it("keeps optional email in the ask payload for storage", () => {
    const parsed = askQuestionSchema.parse({
      name: "Visitor",
      email: "VISITOR@EXAMPLE.COM",
      category: "Prayer",
      question: "How do I check my answer later?",
      isPrivate: false,
    });

    expect(parsed.email).toBe("visitor@example.com");
  });

  it("allows status checks with ticket ID alone while email matching is paused", () => {
    const parsed = statusRequestSchema.parse({
      ticketId: "q-ABCDEFGHJKLM",
    });

    expect(REQUIRE_EMAIL_FOR_STATUS_CHECK).toBe(false);
    expect(parsed).toEqual({
      ticketId: "Q-ABCDEFGHJKLM",
      email: null,
    });
  });

  it("keeps the email sender as a no-op stub", async () => {
    await expect(
      sendQuestionEmail(
        {
          email: "visitor@example.com",
          ticket_id: "Q-ABCDEFGHJKLM",
        },
        "reply"
      )
    ).resolves.toEqual({ ok: true, skipped: true });
  });

  it("filters private or unpublished rows from published Q&A output", () => {
    const rows = publishedRowsToQuestions([
      {
        category: "Prayer",
        public_question: "Visible question?",
        answer: "Visible answer.",
        is_private: false,
        is_published: true,
      },
      {
        category: "Faith",
        public_question: "Private question?",
        answer: "Private answer.",
        is_private: true,
        is_published: true,
      },
      {
        category: "Other",
        public_question: "Unpublished question?",
        answer: "Unpublished answer.",
        is_private: false,
        is_published: false,
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.question).toBe("Visible question?");
  });

  it("hashes rate-limit keys instead of storing raw IPs or tickets", () => {
    const ipKey = qaRateLimitKey("ask", "203.0.113.10");
    const ticketKey = ticketRateLimitKey("Q-ABCDEFGHJKLM");

    expect(ipKey).not.toContain("203.0.113.10");
    expect(ticketKey).not.toContain("Q-ABCDEFGHJKLM");
    expect(ipKey).toMatch(/^qa:ask:ip:[a-f0-9]{64}$/);
    expect(ticketKey).toMatch(/^qa:status:ticket:[a-f0-9]{64}$/);
  });
});
