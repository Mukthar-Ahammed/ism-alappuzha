import { z } from "zod";
import { istToUtcIso } from "@/lib/programs/schedule";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

// Malayalam versions are optional, and older forms may not send them at all.
const optionalMalayalam = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.string().uuid().nullable());

const optionalHttpsUrl = z
  .string()
  .trim()
  .max(500)
  .transform((value, context) => {
    if (value === "") {
      return null;
    }

    let url: URL;

    try {
      url = new URL(value);
    } catch {
      context.addIssue({ code: "custom", message: "Enter a full link starting with https://" });
      return z.NEVER;
    }

    if (url.protocol !== "https:" || url.username !== "" || url.password !== "") {
      context.addIssue({ code: "custom", message: "The link must start with https://" });
      return z.NEVER;
    }

    return url.toString();
  });

export const programFormats = ["in_person", "online", "hybrid"] as const;

export type ProgramFormat = (typeof programFormats)[number];

export const programFormSchema = z
  .object({
    id: optionalUuid,
    title: z.string().trim().min(1, "Enter a title.").max(200),
    speaker: z.string().trim().min(1, "Enter the speaker.").max(120),
    date: z.string().trim(),
    startTime: z.string().trim(),
    endTime: z.string().trim().default(""),
    format: z.enum(programFormats, { message: "Choose how people attend." }),
    venue: z.string().trim().max(200),
    description: optionalText(1000),
    link: optionalHttpsUrl,
    posterMediaId: optionalUuid,
    posterAlt: z.string().trim().max(200).default(""),
    titleMl: optionalMalayalam(200),
    speakerMl: optionalMalayalam(120),
    venueMl: optionalMalayalam(200),
    descriptionMl: optionalMalayalam(1000),
  })
  .transform((value, context) => {
    const startsAt = istToUtcIso(value.date, value.startTime);

    if (!startsAt) {
      context.addIssue({ code: "custom", message: "Enter a valid date and start time." });
      return z.NEVER;
    }

    let endsAt: string | null = null;

    if (value.endTime !== "") {
      endsAt = istToUtcIso(value.date, value.endTime);

      if (!endsAt || endsAt <= startsAt) {
        context.addIssue({ code: "custom", message: "The end time must be after the start time." });
        return z.NEVER;
      }
    }

    // Online-only programs have no venue; everything else needs one.
    if (value.format !== "online" && value.venue === "") {
      context.addIssue({ code: "custom", message: "Enter the venue." });
      return z.NEVER;
    }

    return { ...value, startsAt, endsAt };
  });

export const programRowActionSchema = z.object({
  id: z.string().uuid(),
  intent: z.enum(["cancel", "duplicate"]),
});

export const programIdParamSchema = z.union([z.literal("new"), z.string().uuid()]);

export const programListParamsSchema = z.object({
  tab: z.enum(["upcoming", "past"]).catch("upcoming"),
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export type ProgramFormInput = z.infer<typeof programFormSchema>;
export type ProgramTab = z.infer<typeof programListParamsSchema>["tab"];
