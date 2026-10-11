import { z } from "zod";
import {
  acceptedUploadTypes,
  imagePurposeKeys,
  maxUploadBytes,
} from "@/lib/images/purposes";
import { maxPdfBytes } from "@/lib/pdf/check";

export const requestUploadSchema = z.object({
  purpose: z.enum(imagePurposeKeys),
  contentType: z.enum(acceptedUploadTypes, { message: "Use a JPG, PNG or WebP image." }),
  size: z
    .number()
    .int()
    .positive()
    .max(maxUploadBytes, { message: "Images must be 8 MB or smaller." }),
});

export const finalizeUploadSchema = z.object({
  purpose: z.enum(imagePurposeKeys),
  uploadPath: z.string().max(200),
});

export const requestPdfUploadSchema = z.object({
  size: z
    .number()
    .int()
    .positive()
    .max(maxPdfBytes, { message: "PDFs must be 25 MB or smaller." }),
});

export const finalizePdfUploadSchema = z.object({
  uploadPath: z.string().max(200),
});

const uuidPattern = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * Temporary uploads live under the uploader's user id, so one admin can never
 * finalize (and so read or delete) a file another admin uploaded.
 */
export function temporaryUploadPath(userId: string, uploadId: string): string {
  return `${userId}/${uploadId}`;
}

export function isOwnTemporaryUpload(userId: string, uploadPath: string): boolean {
  return new RegExp(`^${uuidPattern}/${uuidPattern}$`, "i").test(uploadPath) &&
    uploadPath.toLowerCase().startsWith(`${userId.toLowerCase()}/`);
}

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;
export type FinalizeUploadInput = z.infer<typeof finalizeUploadSchema>;
