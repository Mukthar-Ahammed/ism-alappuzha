import type { Database } from "@/types/database";

export const questionStatuses = ["pending", "draft", "answered", "archived"] as const;
export const questionCategories = ["Prayer", "Faith", "Daily life", "Family", "Other"] as const;
export const questionSorts = ["newest", "oldest"] as const;

export type QuestionStatus = (typeof questionStatuses)[number];
export type QuestionCategory = (typeof questionCategories)[number];
export type QuestionSort = (typeof questionSorts)[number];
export type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
export type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"];

export type QuestionListItem = Pick<
  QuestionRow,
  | "id"
  | "ticket_id"
  | "created_at"
  | "updated_at"
  | "category"
  | "question"
  | "status"
  | "is_private"
  | "is_published"
  | "email"
>;

export type QuestionStatusCounts = Record<QuestionStatus, number>;

export type QuestionActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
};
