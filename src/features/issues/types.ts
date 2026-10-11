import type { MediaPreview, StoredPdf } from "@/features/media/types";
import type { MessageActionState } from "@/lib/auth/types";

export const issuesCacheTag = "published-issues";

export const issuesPageSize = 25;

export type AdminIssue = {
  id: string;
  title: string;
  issueDate: string;
  description: string | null;
  status: "draft" | "published";
  isFeatured: boolean;
  cover: MediaPreview | null;
  pdf: StoredPdf;
  titleMl: string | null;
  descriptionMl: string | null;
};

export type IssueActionState = MessageActionState;
