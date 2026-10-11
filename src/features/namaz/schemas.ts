import { z } from "zod";
import { maxGuidanceItems } from "@/features/namaz/types";
import { guidanceLines } from "@/features/namaz/workflow";

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

/** One item per line in the textarea; blank lines are ignored. */
function guidanceList(label: string) {
  return z
    .string()
    .default("")
    .transform(guidanceLines)
    .pipe(
      z
        .array(z.string().max(200, `Keep each ${label} line under 200 characters.`))
        .max(maxGuidanceItems, `Keep ${label} to ${maxGuidanceItems} lines or fewer.`)
    );
}

export const namazStepFormSchema = z.object({
  id: optionalUuid,
  name: z.string().trim().min(1, "Enter the step name.").max(120, "Keep the name under 120 characters."),
  nameMl: optionalMlText(120, "Keep the Malayalam name under 120 characters."),
  whatToDo: z
    .string()
    .trim()
    .min(1, "Describe what to do in this step.")
    .max(600, "Keep the description under 600 characters."),
  whatToDoMl: optionalMlText(600, "Keep the Malayalam description under 600 characters."),
  arabic: z.string().trim().min(1, "Enter the Arabic text.").max(2000, "Keep the Arabic under 2000 characters."),
  transliteration: optionalText(1000, "Keep the transliteration under 1000 characters."),
  transliterationMl: optionalMlText(1000, "Keep the Malayalam pronunciation under 1000 characters."),
  malayalam: optionalText(2000, "Keep the Malayalam explanation under 2000 characters."),
  dos: guidanceList("the Do"),
  dosMl: guidanceList("the Malayalam Do"),
  donts: guidanceList("the Don't"),
  dontsMl: guidanceList("the Malayalam Don't"),
  // A checkbox: present ("on") when ticked, absent otherwise.
  isRepeatNode: z.literal("on").optional().transform((value) => value === "on"),
});

export const namazRowActionSchema = z.object({
  id: z.string().uuid(),
  intent: z.enum(["publish", "unpublish", "up", "down", "delete"]),
});

export const namazIdParamSchema = z.union([z.literal("new"), z.string().uuid()]);

export type NamazStepFormInput = z.infer<typeof namazStepFormSchema>;
