import type { QuestionRow, QuestionStatus } from "@/features/questions/types";

export const QUESTION_REVIEW_REQUIRED = false;

export function canPublishQuestion(
  question: Pick<QuestionRow, "is_private" | "status" | "answer">
): boolean {
  return !question.is_private && question.status === "answered" && Boolean(question.answer);
}

export function assertQuestionFresh(
  currentUpdatedAt: string,
  expectedUpdatedAt: string
): { ok: true } | { ok: false; error: string } {
  if (currentUpdatedAt !== expectedUpdatedAt) {
    return {
      ok: false,
      error: "Someone else changed this question. Refresh the page before saving.",
    };
  }

  return { ok: true };
}

export function nextStatusAfterArchive(): QuestionStatus {
  return "archived";
}

export function nextStatusAfterRestore(): QuestionStatus {
  return "pending";
}

export function isReplyVisibleToAsker(
  question: Pick<QuestionRow, "status" | "answer">
): boolean {
  return question.status === "answered" && Boolean(question.answer);
}

export function isPrivatePublishBlocked(
  question: Pick<QuestionRow, "is_private" | "is_published">
): boolean {
  return question.is_private && question.is_published;
}
