import "server-only";

import { createHash } from "node:crypto";
import sharp from "sharp";
import {
  blurPlaceholderWidth,
  maxUploadBytes,
  type ImagePurposeConfig,
} from "@/lib/images/purposes";
import { largestCropForRatio } from "@/lib/images/crop";
import { sniffByteLength, sniffImageType } from "@/lib/images/sniff";

export type ProcessedImage = {
  main: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  quality: number;
  blurDataUrl: string;
  contentHash: string;
};

export type ImagePipelineError =
  | "too_large"
  | "unsupported_type"
  | "unreadable"
  | "too_small";

export type ImagePipelineResult =
  | { ok: true; data: ProcessedImage }
  | { ok: false; error: ImagePipelineError };

// Guards against decompression bombs: a small file that expands to a huge bitmap.
const maxInputPixels = 50_000_000;

function oriented(input: Buffer) {
  // Metadata (EXIF, GPS, XMP, ICC) is dropped because withMetadata() is never called.
  return sharp(input, { limitInputPixels: maxInputPixels, failOn: "error" }).autoOrient();
}

/** Decode, rotate, crop and resize once; only the cheap WebP encode is repeated. */
async function cropToTarget(input: Buffer, config: ImagePurposeConfig) {
  const position = config.crop === "attention" ? sharp.strategy.attention : "centre";

  return oriented(input)
    .resize(config.width, config.height, { fit: "cover", position })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

async function encodeWithinTarget(
  input: Buffer,
  config: ImagePurposeConfig
): Promise<{ buffer: Buffer; quality: number }> {
  const { data, info } = await cropToTarget(input, config);
  const raw = { width: info.width, height: info.height, channels: info.channels };
  let quality = config.quality.start;

  while (true) {
    const buffer = await sharp(data, { raw })
      .webp({ quality, effort: 4, smartSubsample: true })
      .toBuffer();
    const next = quality - config.quality.step;

    if (buffer.byteLength <= config.targetBytes || next < config.quality.min) {
      return { buffer, quality };
    }

    quality = next;
  }
}

export async function processImage(
  input: Buffer,
  config: ImagePurposeConfig
): Promise<ImagePipelineResult> {
  if (input.byteLength > maxUploadBytes) {
    return { ok: false, error: "too_large" };
  }

  if (!sniffImageType(input.subarray(0, sniffByteLength))) {
    return { ok: false, error: "unsupported_type" };
  }

  let sourceWidth: number;
  let sourceHeight: number;

  try {
    const metadata = await sharp(input, { limitInputPixels: maxInputPixels }).metadata();
    sourceWidth = metadata.autoOrient.width;
    sourceHeight = metadata.autoOrient.height;
  } catch {
    return { ok: false, error: "unreadable" };
  }

  const crop = largestCropForRatio(sourceWidth, sourceHeight, config);

  if (crop.width < config.minSourceWidth || crop.height < config.minSourceHeight) {
    return { ok: false, error: "too_small" };
  }

  try {
    const { buffer: main, quality } = await encodeWithinTarget(input, config);
    // main already has the target ratio, so the thumbnail is a plain resize.
    const thumb = await sharp(main)
      .resize(config.thumbWidth, config.thumbHeight)
      .webp({ quality: config.thumbQuality })
      .toBuffer();
    const blurHeight = Math.round((blurPlaceholderWidth * config.height) / config.width);
    const blur = await sharp(main)
      .resize(blurPlaceholderWidth, blurHeight)
      .webp({ quality: 40 })
      .toBuffer();

    return {
      ok: true,
      data: {
        main,
        thumb,
        width: config.width,
        height: config.height,
        thumbWidth: config.thumbWidth,
        thumbHeight: config.thumbHeight,
        quality,
        blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
        contentHash: createHash("sha256").update(main).digest("hex").slice(0, 32),
      },
    };
  } catch {
    return { ok: false, error: "unreadable" };
  }
}
