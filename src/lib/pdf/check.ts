export const maxPdfBytes = 25 * 1024 * 1024;

const pdfHeader = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const pdfTrailer = [0x25, 0x25, 0x45, 0x4f, 0x46]; // "%%EOF"
// The end-of-file marker may be followed by whitespace or incremental-update padding.
const trailerSearchBytes = 1024;

/** Quick check on the first bytes, usable in the browser before uploading. */
export function hasPdfHeader(bytes: Uint8Array): boolean {
  return pdfHeader.every((value, index) => bytes[index] === value);
}

function containsSequence(bytes: Uint8Array, sequence: readonly number[], from: number): boolean {
  for (let start = Math.max(0, from); start <= bytes.length - sequence.length; start += 1) {
    if (sequence.every((value, index) => bytes[start + index] === value)) {
      return true;
    }
  }

  return false;
}

export type PdfCheckError = "too_large" | "empty" | "not_pdf";

/**
 * Server-side check on the real bytes: a PDF header at the start and an end-of-file
 * marker near the end. File names and browser-reported types are never trusted.
 */
export function checkPdf(bytes: Uint8Array): PdfCheckError | null {
  if (bytes.length === 0) {
    return "empty";
  }

  if (bytes.length > maxPdfBytes) {
    return "too_large";
  }

  if (!hasPdfHeader(bytes) || !containsSequence(bytes, pdfTrailer, bytes.length - trailerSearchBytes)) {
    return "not_pdf";
  }

  return null;
}
