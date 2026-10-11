"use client";

import { useActionState, useState } from "react";
import { Button, Card, CardContent, FormField, Input } from "@/components/admin/ui";
import { ActionMessage } from "@/components/admin/ActionMessage";
import { livePlatformLabels, parseLiveLink } from "@/lib/live-links";
import { saveVideoAction } from "@/features/videos/server/actions";
import type { AdminVideo, VideoActionState } from "@/features/videos/types";

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
          {/* Only link, title and speaker are asked for. An existing video keeps its other
              stored details; a new one gets the defaults in videoFormSchema. */}
          {video && (
            <>
              <input type="hidden" name="titleMl" value={video.titleMl ?? ""} />
              <input type="hidden" name="speakerMl" value={video.speakerMl ?? ""} />
              <input type="hidden" name="category" value={video.category} />
              <input type="hidden" name="recordedOn" value={video.recordedOn} />
              <input type="hidden" name="duration" value={video.duration ?? ""} />
              <input type="hidden" name="thumbnailMediaId" value={video.thumbnail?.id ?? ""} />
              <input type="hidden" name="thumbnailAlt" value={video.thumbnail?.alt ?? ""} />
            </>
          )}
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
                {parsed.data.platform !== "youtube" && ". A default image is shown as its thumbnail."}
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
            <FormField label="Speaker" htmlFor="video-speaker">
              <Input
                id="video-speaker"
                name="speaker"
                required
                maxLength={120}
                defaultValue={video?.speaker ?? prefill.speaker}
              />
            </FormField>
          </div>

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
