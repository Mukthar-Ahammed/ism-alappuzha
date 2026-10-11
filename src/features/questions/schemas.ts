import { z } from "zod";
import {
  questionCategories,
  questionSorts,
  questionStatuses,
} from "@/features/questions/types";

const optionalCheckboxSchema = z
  .union([z.literal("on"), z.literal("true"), z.literal("1")])
  .optional()
  .transform((value) => value !== undefined);

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

export const questionFiltersSchema = z.object({
  status: z.enum(questionStatuses).catch("pending"),
  category: z.enum(questionCategories).optional().catch(undefined),
  private: optionalCheckboxSchema,
  published: optionalCheckboxSchema,
  hasEmail: optionalCheckboxSchema,
  search: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : null)),
  sort: z.enum(questionSorts).catch("newest"),
  page: z.coerce.number().int().min(1).catch(1),
});

export const questionIdSchema = z.string().uuid();

export const baseQuestionActionSchema = z.object({
  id: questionIdSchema,
  updatedAt: z.string().datetime({ offset: true }),
});

export const replyActionSchema = baseQuestionActionSchema.extend({
  answer: z.string().trim().min(1, "Write a reply before saving.").max(8000),
});

export const notesActionSchema = baseQuestionActionSchema.extend({
  notes: z.string().trim().max(5000).transform((value) => value || null),
});

export const archiveActionSchema = baseQuestionActionSchema.extend({
  reason: z.enum(["Spam", "Duplicate", "Out of scope"]),
});

export const publishActionSchema = baseQuestionActionSchema.extend({
  publicQuestion: z
    .string()
    .trim()
    .min(10, "Public wording must be at least 10 characters.")
    .max(2000),
});

export const deleteActionSchema = baseQuestionActionSchema.extend({
  confirm: z.literal("DELETE"),
});

export const nullableFormTextSchema = optionalTextSchema;

export type QuestionFilters = z.infer<typeof questionFiltersSchema>;
