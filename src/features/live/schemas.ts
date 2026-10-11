import { z } from "zod";
import { livePlatforms, parseLiveLink } from "@/lib/live-links";

/** Optional Malayalam version of a field; left empty, the site shows the English. */
function optionalMalayalam(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .default("")
    .transform((value) => (value === "" ? null : value));
}

export const setLiveSchema = z.object({
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
  title: z.string().trim().min(1, "Enter a title for the broadcast.").max(200),
  titleMl: optionalMalayalam(200),
  speaker: z.string().trim().max(120).default(""),
  speakerMl: optionalMalayalam(120),
});

/** Values passed from "Use for live broadcast"; anything invalid is ignored. */
export const livePrefillSchema = z.object({
  title: z.string().trim().max(200).catch(""),
  speaker: z.string().trim().max(120).catch(""),
  link: z
    .string()
    .trim()
    .max(2048)
    .catch("")
    .transform((value) => (parseLiveLink(value).ok ? value : "")),
});

export const liveHistoryDetailSchema = z.object({
  platform: z.enum(livePlatforms),
  watch_url: z.string().url(),
  title: z.string().nullable().catch(null),
  title_ml: z.string().nullable().catch(null),
  speaker: z.string().nullable().catch(null),
  speaker_ml: z.string().nullable().catch(null),
});

export type SetLiveInput = z.infer<typeof setLiveSchema>;
