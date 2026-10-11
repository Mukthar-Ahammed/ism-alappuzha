import "server-only";

import type { QuestionRow } from "@/features/questions/types";

export type QuestionEmailKind = "reply" | "correction";

export type QuestionEmailResult =
  | { ok: true; skipped: boolean }
  | { ok: false; error: string };

export async function sendQuestionEmail(
  question: Pick<QuestionRow, "email" | "ticket_id">,
  kind: QuestionEmailKind
): Promise<QuestionEmailResult> {
  if (!question.email) {
    return { ok: true, skipped: true };
  }

  void question.ticket_id;
  void kind;
  return { ok: true, skipped: true };
}
