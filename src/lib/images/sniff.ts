import type { AcceptedUploadType } from "@/lib/images/purposes";

/** Bytes needed to recognise every accepted type. */
export const sniffByteLength = 12;

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

/**
 * Detects the real image type from leading bytes. File names and browser-reported
 * MIME types are attacker-controlled, so they are never trusted.
 */
export function sniffImageType(bytes: Uint8Array): AcceptedUploadType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }

  // "RIFF" ... "WEBP"
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }

  return null;
}
