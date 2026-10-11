import { z } from "zod";
import { maxPdfBytes } from "@/lib/pdf/check";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
// Matches the names finalizePdfUploadAction gives stored PDFs, so a form cannot
// point an issue at any other file.
const storedPdfPathPattern =
  /^issues\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.string().uuid().nullable());

// Malayalam versions are optional, and older forms may not send them at all.
const optionalMalayalam = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const issueFormSchema = z.object({
  id: optionalUuid,
  title: z.string().trim().min(1, "Enter a title.").max(200),
  issueDate: z
    .string()
    .trim()
    .refine(
      (value) => datePattern.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()),
      "Enter the issue date."
    ),
  description: z
    .string()
    .trim()
    .max(500, "Keep the description under 500 characters.")
    .transform((value) => (value === "" ? null : value)),
  coverMediaId: z.string().trim().uuid("Upload a cover image."),
  coverAlt: z.string().trim().max(200).default(""),
  pdfPath: z.string().trim().regex(storedPdfPathPattern, "Upload the issue PDF."),
  pdfBytes: z.coerce.number().int().positive().max(maxPdfBytes),
  titleMl: optionalMalayalam(200),
  descriptionMl: optionalMalayalam(500),
});

export const issueRowActionSchema = z.object({
  id: z.string().uuid(),
  intent: z.enum(["publish", "unpublish", "feature", "delete"]),
});

export const issueIdParamSchema = z.union([z.literal("new"), z.string().uuid()]);

export const issueListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export type IssueFormInput = z.infer<typeof issueFormSchema>;
