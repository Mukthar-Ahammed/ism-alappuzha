// Single source of truth for every stored image. Shared by the server pipeline and
// the upload field so admins see exactly the rules the server enforces.

export const imagePurposeKeys = ["leader_photo", "issue_cover", "program_poster", "video_thumbnail"] as const;

export type ImagePurpose = (typeof imagePurposeKeys)[number];

export type ImagePurposeConfig = {
  label: string;
  /** Final stored size; every upload is cropped to this ratio and resized to exactly this. */
  width: number;
  height: number;
  /** Smallest source crop accepted, so stored images are never blurry upscales. */
  minSourceWidth: number;
  minSourceHeight: number;
  thumbWidth: number;
  thumbHeight: number;
  /** WebP quality steps down from start to min until the file fits targetBytes. */
  quality: { start: number; min: number; step: number };
  targetBytes: number;
  thumbQuality: number;
  /** Portraits keep faces in frame; posters keep the centre. */
  crop: "attention" | "centre";
};

export const imagePurposes: Record<ImagePurpose, ImagePurposeConfig> = {
  leader_photo: {
    label: "Leader photo",
    width: 900,
    height: 1200,
    minSourceWidth: 600,
    minSourceHeight: 800,
    thumbWidth: 240,
    thumbHeight: 320,
    quality: { start: 80, min: 55, step: 5 },
    targetBytes: 150 * 1024,
    thumbQuality: 70,
    crop: "attention",
  },
  issue_cover: {
    label: "Issue cover",
    width: 1200,
    height: 1600,
    minSourceWidth: 750,
    minSourceHeight: 1000,
    thumbWidth: 300,
    thumbHeight: 400,
    quality: { start: 82, min: 60, step: 4 },
    targetBytes: 250 * 1024,
    thumbQuality: 70,
    crop: "centre",
  },
  program_poster: {
    label: "Program poster",
    // 3:4 so the poster fills the homepage card's poster column (320px wide, as tall as the calendar).
    width: 1080,
    height: 1440,
    minSourceWidth: 720,
    minSourceHeight: 960,
    thumbWidth: 300,
    thumbHeight: 400,
    quality: { start: 80, min: 58, step: 4 },
    targetBytes: 220 * 1024,
    thumbQuality: 70,
    crop: "centre",
  },
  video_thumbnail: {
    label: "Video thumbnail",
    width: 1280,
    height: 720,
    minSourceWidth: 640,
    minSourceHeight: 360,
    thumbWidth: 400,
    thumbHeight: 225,
    quality: { start: 80, min: 58, step: 4 },
    targetBytes: 160 * 1024,
    thumbQuality: 70,
    crop: "centre",
  },
};

export const maxUploadBytes = 8 * 1024 * 1024;

export const acceptedUploadTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export type AcceptedUploadType = (typeof acceptedUploadTypes)[number];

export const blurPlaceholderWidth = 16;

export function aspectRatioLabel(config: ImagePurposeConfig): string {
  const divisor = greatestCommonDivisor(config.width, config.height);

  return `${config.width / divisor}:${config.height / divisor}`;
}

function greatestCommonDivisor(left: number, right: number): number {
  return right === 0 ? left : greatestCommonDivisor(right, left % right);
}

export function describeImageRules(config: ImagePurposeConfig): string {
  return `${aspectRatioLabel(config)} ratio, at least ${config.minSourceWidth}×${config.minSourceHeight} px. JPG, PNG or WebP up to ${maxUploadBytes / 1024 / 1024} MB. Saved as ${config.width}×${config.height} WebP.`;
}
