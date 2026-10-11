import { z } from "zod";
import { dhikrEntryCategories } from "@/data/dhikr";

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.string().uuid().nullable());

function optionalText(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value));
}

/** A Malayalam version: optional, and a form without the field counts as empty. */
function optionalMlText(max: number, message: string) {
  return z.string().default("").pipe(optionalText(max, message));
}

export const dhikrFormSchema = z.object({
  id: optionalUuid,
  title: z.string().trim().min(1, "Enter a short name.").max(120, "Keep the name under 120 characters."),
  category: z.enum(dhikrEntryCategories, { message: "Choose a category." }),
  arabic: z.string().trim().min(1, "Enter the Arabic text.").max(2000, "Keep the Arabic under 2000 characters."),
  transliteration: optionalText(2000, "Keep the transliteration under 2000 characters."),
  transliterationMl: optionalMlText(2000, "Keep the Malayalam pronunciation under 2000 characters."),
  malayalam: optionalText(3000, "Keep the Malayalam meaning under 3000 characters."),
  reference: optionalText(300, "Keep the source under 300 characters."),
  referenceMl: optionalMlText(300, "Keep the Malayalam source under 300 characters."),
  repeatCount: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Enter how many times, as a whole number.")
    .transform((value) => (value === "" ? null : Number(value)))
    .pipe(z.number().min(1, "Enter at least 1.").max(1000, "Enter 1000 or fewer.").nullable()),
});

export const dhikrRowActionSchema = z.object({
  id: z.string().uuid(),
  intent: z.enum(["check", "uncheck", "publish", "unpublish", "up", "down", "delete"]),
});

export const dhikrIdParamSchema = z.union([z.literal("new"), z.string().uuid()]);

export type DhikrFormInput = z.infer<typeof dhikrFormSchema>;
