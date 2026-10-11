import { z } from "zod";

const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// Seven or more digits, allowing spaces, dots, dashes and brackets between them.
const phonePattern = /(?:\+?\d[\s().-]*){7,}/;

function profileUrl(hosts: readonly string[], label: string) {
  return z
    .string()
    .trim()
    .max(300)
    .transform((value, context) => {
      if (value === "") {
        return null;
      }

      let url: URL;

      try {
        url = new URL(value);
      } catch {
        context.addIssue({ code: "custom", message: `Enter a full ${label} link.` });
        return z.NEVER;
      }

      if (
        url.protocol !== "https:" ||
        url.username !== "" ||
        url.password !== "" ||
        !hosts.includes(url.hostname.toLowerCase())
      ) {
        context.addIssue({
          code: "custom",
          message: `Use an https link on ${hosts[0]}.`,
        });
        return z.NEVER;
      }

      return url.toString();
    });
}

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.string().uuid().nullable());

/** Optional Malayalam version of a field; left empty, the site shows the English. */
function optionalMalayalam(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .default("")
    .transform((value) => (value === "" ? null : value));
}

function bioField(label: string) {
  return z
    .string()
    .trim()
    .max(600, `Keep the ${label} under 600 characters.`)
    .refine((value) => !emailPattern.test(value) && !phonePattern.test(value), {
      message: "Do not include email addresses or phone numbers.",
    });
}

export const leaderFormSchema = z.object({
  id: optionalUuid,
  name: z.string().trim().min(1, "Enter a name.").max(120),
  nameMl: optionalMalayalam(120),
  role: z.string().trim().min(1, "Enter a role.").max(120),
  roleMl: optionalMalayalam(120),
  bio: bioField("bio"),
  bioMl: bioField("Malayalam bio")
    .default("")
    .transform((value) => (value === "" ? null : value)),
  linkedin: profileUrl(["linkedin.com", "www.linkedin.com", "in.linkedin.com"], "LinkedIn"),
  instagram: profileUrl(["instagram.com", "www.instagram.com"], "Instagram"),
  photoMediaId: optionalUuid,
  photoAlt: z.string().trim().max(200).default(""),
});

export const leaderRowActionSchema = z.object({
  id: z.string().uuid(),
  intent: z.enum(["up", "down", "publish", "unpublish", "delete"]),
});

export const leaderIdParamSchema = z.union([z.literal("new"), z.string().uuid()]);

export const leaderListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export type LeaderFormInput = z.infer<typeof leaderFormSchema>;
export type LeaderRowAction = z.infer<typeof leaderRowActionSchema>;
