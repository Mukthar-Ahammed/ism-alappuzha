export const questionCategories = [
  "Prayer",
  "Faith",
  "Daily life",
  "Family",
  "Other",
] as const;

export type QuestionCategory = (typeof questionCategories)[number];

export interface Question {
  id: string;
  createdAt: string;
  name?: string | null;
  category: QuestionCategory;
  question: string;
  answer?: string | null;
  answeredBy?: string | null;
  answeredAt?: string | null;
  status: "pending" | "draft" | "answered" | "archived";
}

export interface AskQuestionPayload {
  name?: string;
  category: QuestionCategory;
  question: string;
  website?: string; // Honeypot field
}
