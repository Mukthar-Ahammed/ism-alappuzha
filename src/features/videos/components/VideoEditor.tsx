"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { Button, Card, CardContent, FormField, Input, Select, Skeleton } from "@/components/admin/ui";
import { ActionMessage } from "@/components/admin/ActionMessage";
import { livePlatformLabels, parseLiveLink } from "@/lib/live-links";
import { saveVideoAction } from "@/features/videos/server/actions";
import { videoCategories } from "@/features/videos/schemas";
import type { AdminVideo, VideoActionState } from "@/features/videos/types";

// Loaded only when the editor opens, keeping upload code out of every other admin page.
const ImageUploadField = dynamic(() => import("@/components/admin/ImageUploadField"), {
  ssr: false,
  loading: () => <Skeleton className="h-40 w-full" />,
});

export function VideoEditor({
  video,
  prefill,
}: {
  video: AdminVideo | null;
  prefill: { title: string; speaker: string; link: string };
}) {
  const [state, formAction, pending] = useActionState<VideoActionState, FormData>(
    saveVideoAction,
    null
  );
  const [link, setLink] = useState(video?.watchUrl ?? prefill.link);
  const parsed = link.trim() === "" ? null : parseLiveLink(link);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={video?.id ?? ""} />
          <FormField label="Video link (YouTube, Facebook or Instagram)" htmlFor="video-link">
            <Input
              id="video-link"
              name="link"
              type="url"
              inputMode="url"
              required
              placeholder="https://www.youtube.com/watch?v=…"
              value={link}
              onChange={(event) => setLink(event.target.value)}
            />
          </FormField>
          {parsed &&
            (parsed.ok ? (
              <p className="text-sm font-semibold text-emerald-800">
                Detected: {livePlatformLabels[parsed.data.platform]}
                {parsed.data.platform !== "youtube" &&
                  ". Upload a thumbnail below, otherwise a default image is used."}
              </p>
            ) : (
              <p role="alert" className="text-sm font-semibold text-red-800">
                {parsed.error}
              </p>
            ))}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Title" htmlFor="video-title">
              <Input
                id="video-title"
                name="title"
                required
                maxLength={200}
                defaultValue={video?.title ?? prefill.title}
              />
            </FormField>
            <FormField label="Speaker (optional)" htmlFor="video-speaker">
              <Input
                id="video-speaker"
                name="speaker"
                maxLength={120}
                defaultValue={video?.speaker ?? prefill.speaker}
              />
            </FormField>
            <FormField label="Title (Malayalam, optional)" htmlFor="video-title-ml">
              <Input
                id="video-title-ml"
                name="titleMl"
                lang="ml"
                maxLength={200}
                className="admin-malayalam"
                defaultValue={video?.titleMl ?? ""}
              />
            </FormField>
            <FormField label="Speaker (Malayalam, optional)" htmlFor="video-speaker-ml">
              <Input
                id="video-speaker-ml"
                name="speakerMl"
                lang="ml"
                maxLength={120}
                className="admin-malayalam"
                defaultValue={video?.speakerMl ?? ""}
              />
            </FormField>
          </div>
          <p className="text-xs text-text-muted">
            Visitors who switch the site to Malayalam see the Malayalam title and speaker; left empty,
            they see the English.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Category" htmlFor="video-category">
              <Select id="video-category" name="category" defaultValue={video?.category ?? "Speeches"}>
                {videoCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Date of the video" htmlFor="video-date">
              <Input id="video-date" name="recordedOn" type="date" required defaultValue={video?.recordedOn} />
            </FormField>
            <FormField label="Length (optional, e.g. 42:15)" htmlFor="video-duration">
              <Input
                id="video-duration"
                name="duration"
                maxLength={8}
                placeholder="42:15"
                defaultValue={video?.duration ?? ""}
              />
            </FormField>
          </div>

          <ImageUploadField
            purpose="video_thumbnail"
            mediaInputName="thumbnailMediaId"
            altInputName="thumbnailAlt"
            initial={{ media: video?.thumbnail ?? null, alt: video?.thumbnail?.alt ?? "" }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : video ? "Save changes" : "Add video as draft"}
            </Button>
            <ActionMessage state={state} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
