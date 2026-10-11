import { randomBytes, createHash } from "node:crypto";
import { questionCategories } from "@/lib/types/qa";
export { askQuestionSchema, statusRequestSchema } from "@/lib/qa/schemas";

const ticketAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ticketRandomLength = 12;

export const publishedQaCacheTag = "published-qa";
export const REQUIRE_EMAIL_FOR_STATUS_CHECK = false;

export type StatusFailureBody = {
  ok: false;
  success: false;
  error: string;
};

export type PublishedQuestionRow = {
  id?: string;
  created_at?: string;
  category: (typeof questionCategories)[number];
  public_question: string | null;
  answer: string | null;
  answered_at?: string | null;
  is_private?: boolean;
  is_published?: boolean;
};

export const genericStatusFailure: StatusFailureBody = {
  ok: false,
  success: false,
  error: "We could not find an answer for those details.",
};

export function generateTicketId(): string {
  const bytes = randomBytes(ticketRandomLength);
  let value = "";

  for (const byte of bytes) {
    value += ticketAlphabet[byte % ticketAlphabet.length];
  }

  return `Q-${value}`;
}

export function hashClientIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function qaRateLimitKey(scope: string, ip: string): string {
  return `qa:${scope}:ip:${hashClientIp(ip)}`;
}

export function ticketRateLimitKey(ticketId: string): string {
  return `qa:status:ticket:${hashClientIp(ticketId.toUpperCase())}`;
}

export function publishedRowsToQuestions(rows: PublishedQuestionRow[]) {
  return rows
    .filter(
      (item) =>
        item.is_private !== true &&
        item.is_published !== false &&
        Boolean(item.public_question) &&
        Boolean(item.answer)
    )
    .map((item, index) => ({
      id: item.id ?? `published-${index}`,
      createdAt: item.created_at ?? item.answered_at ?? new Date(0).toISOString(),
      name: null,
      category: item.category,
      question: item.public_question ?? "",
      answer: item.answer,
      answeredBy: null,
      answeredAt: item.answered_at ?? null,
      status: "answered" as const,
    }));
}
