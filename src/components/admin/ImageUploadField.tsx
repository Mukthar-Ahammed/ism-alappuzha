"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { Button, FormField, Input } from "@/components/admin/ui";
import {
  finalizeImageUploadAction,
  requestImageUploadAction,
} from "@/features/media/server/actions";
import type { MediaPreview } from "@/features/media/types";
import {
  acceptedUploadTypes,
  describeImageRules,
  imagePurposes,
  maxUploadBytes,
  type ImagePurpose,
} from "@/lib/images/purposes";
import { largestCropForRatio } from "@/lib/images/crop";
import { sniffByteLength, sniffImageType } from "@/lib/images/sniff";
import { formatBytes, putWithProgress } from "@/components/admin/upload-client";

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; progress: number }
  | { phase: "processing" }
  | { phase: "error"; message: string };

export type ImageFieldValue = { media: MediaPreview | null; alt: string };

/** Quick browser-side check; the server repeats every rule on the real bytes. */
async function precheck(file: File, purpose: ImagePurpose): Promise<string | null> {
  if (file.size > maxUploadBytes) {
    return "Images must be 8 MB or smaller.";
  }

  const head = new Uint8Array(await file.slice(0, sniffByteLength).arrayBuffer());

  if (!sniffImageType(head)) {
    return "Choose a JPG, PNG or WebP image.";
  }

  try {
    const bitmap = await createImageBitmap(file);
    const config = imagePurposes[purpose];
    const crop = largestCropForRatio(bitmap.width, bitmap.height, config);
    bitmap.close();

    if (crop.width < config.minSourceWidth || crop.height < config.minSourceHeight) {
      return `This image is too small. After cropping it must be at least ${config.minSourceWidth}×${config.minSourceHeight} px.`;
    }
  } catch {
    // Some browsers cannot decode every file; the server makes the final call.
  }

  return null;
}

export default function ImageUploadField({
  purpose,
  mediaInputName,
  altInputName,
  initial,
  onChange,
}: {
  purpose: ImagePurpose;
  mediaInputName: string;
  altInputName: string;
  initial: ImageFieldValue;
  onChange?: (value: ImageFieldValue) => void;
}) {
  const inputId = useId();
  const config = imagePurposes[purpose];
  const [value, setValue] = useState<ImageFieldValue>(initial);
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const busy = state.phase === "uploading" || state.phase === "processing";

  function update(next: ImageFieldValue) {
    setValue(next);
    onChange?.(next);
  }

  async function handleFile(file: File) {
    const problem = await precheck(file, purpose);

    if (problem) {
      setState({ phase: "error", message: problem });
      return;
    }

    const contentType = acceptedUploadTypes.find((type) => type === file.type) ?? "image/jpeg";
    const issued = await requestImageUploadAction({ purpose, contentType, size: file.size });

    if (!issued.ok) {
      setState({ phase: "error", message: issued.error });
      return;
    }

    setState({ phase: "uploading", progress: 0 });
    const uploaded = await putWithProgress(issued.data.signedUrl, file, (progress) =>
      setState({ phase: "uploading", progress })
    );

    if (!uploaded) {
      setState({ phase: "error", message: "The upload did not finish. Check your connection and try again." });
      return;
    }

    setState({ phase: "processing" });
    const finalized = await finalizeImageUploadAction({
      purpose,
      uploadPath: issued.data.uploadPath,
    });

    if (!finalized.ok) {
      setState({ phase: "error", message: finalized.error });
      return;
    }

    setState({ phase: "idle" });
    update({ media: finalized.data, alt: value.alt || finalized.data.alt });
  }

  return (
    <fieldset className="space-y-3 rounded-xl border border-border-subtle p-4">
      <legend className="px-1 text-sm font-semibold text-primary">{config.label}</legend>
      <p className="text-xs leading-5 text-text-muted">{describeImageRules(config)}</p>

      <input type="hidden" name={mediaInputName} value={value.media?.id ?? ""} />

      {value.media && (
        <div className="flex flex-wrap items-end gap-4">
          <Image
            src={value.media.url}
            alt={value.alt || "Uploaded image preview"}
            width={value.media.width}
            height={value.media.height}
            placeholder="blur"
            blurDataURL={value.media.blurDataUrl}
            sizes="160px"
            className="h-auto w-32 rounded-lg border border-border-subtle object-cover"
          />
          <div className="space-y-2 text-xs text-text-muted">
            <p>
              Saved as {value.media.width}×{value.media.height} WebP, {formatBytes(value.media.bytes)}
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => update({ media: null, alt: "" })}
              disabled={busy}
            >
              Remove photo
            </Button>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor={inputId}
          className="inline-flex min-h-10 cursor-pointer items-center rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-primary focus-within:ring-2 focus-within:ring-secondary hover:bg-primary-tint"
        >
          {value.media ? "Replace image" : "Choose image"}
          <input
            id={inputId}
            type="file"
            accept={acceptedUploadTypes.join(",")}
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";

              if (file) {
                void handleFile(file);
              }
            }}
          />
        </label>
      </div>

      {state.phase === "uploading" && (
        <div className="space-y-1">
          <progress
            max={100}
            value={state.progress}
            aria-label="Upload progress"
            className="h-2 w-full overflow-hidden rounded-full accent-secondary"
          />
          <p className="text-xs text-text-muted" aria-live="polite">
            Uploading… {state.progress}%
          </p>
        </div>
      )}
      {state.phase === "processing" && (
        <p className="text-xs text-text-muted" aria-live="polite">
          Optimising image…
        </p>
      )}
      {state.phase === "error" && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
          {state.message}
        </p>
      )}

      {value.media && (
        <FormField label="Alt text (describe the photo)" htmlFor={`${inputId}-alt`}>
          <Input
            id={`${inputId}-alt`}
            name={altInputName}
            value={value.alt}
            maxLength={200}
            onChange={(event) => update({ media: value.media, alt: event.target.value })}
          />
        </FormField>
      )}
    </fieldset>
  );
}
