import { z } from "zod";
import { parseLiveLink } from "@/lib/live-links";

export const videoCategories = ["Speeches", "Campaigns", "Youth"] as const;

export type VideoCategoryValue = (typeof videoCategories)[number];

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.string().uuid().nullable());

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
// "42:15" or "1:05:30"; must match the database check.
const durationPattern = /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/;

/** Optional Malayalam version of a field; left empty, the site shows the English. */
function optionalMalayalam(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .default("")
    .transform((value) => (value === "" ? null : value));
}

export const videoFormSchema = z.object({
  id: optionalUuid,
  title: z.string().trim().min(1, "Enter a title.").max(200),
  titleMl: optionalMalayalam(200),
  speaker: z.string().trim().max(120).default(""),
  speakerMl: optionalMalayalam(120),
  category: z.enum(videoCategories, { message: "Choose a category." }),
  link: z
    .string()
    .max(2048)
    .transform((value, context) => {
      const parsed = parseLiveLink(value);

      if (!parsed.ok) {
        context.addIssue({ code: "custom", message: parsed.error });
        return z.NEVER;
      }

      return parsed.data;
    }),
  recordedOn: z
    .string()
    .trim()
    .refine(
      (value) => datePattern.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()),
      "Enter the date of the video."
    ),
  duration: z
    .string()
    .trim()
    .refine((value) => value === "" || durationPattern.test(value), "Write the length as 42:15 or 1:05:30.")
    .transform((value) => (value === "" ? null : value)),
  thumbnailMediaId: optionalUuid,
  thumbnailAlt: z.string().trim().max(200).default(""),
});

export const videoRowActionSchema = z.object({
  id: z.string().uuid(),
  intent: z.enum(["publish", "unpublish", "delete"]),
});

export const videoIdParamSchema = z.union([z.literal("new"), z.string().uuid()]);

export const videoListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

/** Values passed from "Add to videos" on the live screen; anything invalid is ignored. */
export const videoPrefillSchema = z.object({
  title: z.string().trim().max(200).catch(""),
  speaker: z.string().trim().max(120).catch(""),
  link: z
    .string()
    .trim()
    .max(2048)
    .catch("")
    .transform((value) => (parseLiveLink(value).ok ? value : "")),
});

export type VideoFormInput = z.infer<typeof videoFormSchema>;
