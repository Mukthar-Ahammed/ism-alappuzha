import { z } from "zod";
import { questionCategories } from "@/lib/types/qa";

export const askQuestionSchema = z.object({
  name: z
    .string()
    .trim()
    .max(50, "Name must be 50 characters or fewer.")
    .optional()
    .transform((value) => sanitizePublicText(value ?? "") || null),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value.toLowerCase() : null)),
  category: z.enum(questionCategories),
  question: z
    .string()
    .trim()
    .min(10, "Your question must be between 10 and 500 characters long.")
    .max(500, "Your question must be between 10 and 500 characters long.")
    .transform(sanitizePublicText),
  isPrivate: z.boolean().optional().default(false),
  website: z.string().optional(),
});

export const statusRequestSchema = z.object({
  ticketId: z.string().trim().toUpperCase().regex(/^Q-[A-HJ-NP-Z2-9]{10,}$/),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value.toLowerCase() : null)),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
export type StatusRequestInput = z.infer<typeof statusRequestSchema>;

export function sanitizePublicText(value: string): string {
  return value
    .replace(/<[^>]*>?/gm, "")
    .replace(/[<>]/g, "")
    .replace(/\p{C}/gu, "")
    .trim();
}
