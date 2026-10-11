"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Card, CardContent, CardHeader, FormField, Input } from "@/components/admin/ui";
import { ActionMessage } from "@/components/admin/ActionMessage";
import {
  facebookEmbedUrl,
  liveEmbedEnabled,
  livePlatformLabels,
  parseLiveLink,
} from "@/lib/live-links";
import { endLiveAction, setLiveAction } from "@/features/live/server/actions";
import type { LiveActionState, LiveHistoryEntry } from "@/features/live/types";

function LinkPreview({ link }: { link: string }) {
  const parsed = parseLiveLink(link);

  if (!parsed.ok) {
    return (
      <p role="alert" className="text-sm font-semibold text-red-800">
        {parsed.error}
      </p>
    );
  }

  const { platform, canonicalUrl, videoId } = parsed.data;
  const label = livePlatformLabels[platform];
  const embed =
    platform === "youtube" && videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : platform === "facebook" && liveEmbedEnabled.facebook
        ? facebookEmbedUrl(canonicalUrl)
        : null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-emerald-800">Detected: {label}</p>
      {embed && (
        <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-xl bg-black">
          <iframe
            src={embed}
            title={`${label} preview`}
            className="absolute inset-0 h-full w-full border-0"
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {!embed || platform === "facebook" ? (
        <div className="max-w-xl rounded-xl border border-border-subtle bg-primary-tint p-4 text-sm">
          {platform === "instagram" ? (
            <p className="text-text-muted">
              Instagram live cannot be embedded. Visitors see a card with a &ldquo;Watch live on
              Instagram&rdquo; button that opens Instagram.
            </p>
          ) : (
            <p className="text-text-muted">
              If the preview above stays blank, the video does not allow embedding. Visitors can
              still use the &ldquo;Watch on Facebook&rdquo; button.
            </p>
          )}
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block break-all font-semibold text-primary underline underline-offset-4"
          >
            {canonicalUrl}
          </a>
        </div>
      ) : null}
    </div>
  );
}

export function LiveControls({
  isLive,
  history,
  prefill,
}: {
  isLive: boolean;
  history: LiveHistoryEntry[];
  prefill: { title: string; speaker: string; link: string };
}) {
  const [goLiveState, goLiveAction, goLivePending] = useActionState<LiveActionState, FormData>(
    setLiveAction,
    null
  );
  const [endState, endAction, endPending] = useActionState<LiveActionState, FormData>(
    endLiveAction,
    null
  );
  const [link, setLink] = useState(prefill.link);
  const [title, setTitle] = useState(prefill.title);
  const [speaker, setSpeaker] = useState(prefill.speaker);
  const [titleMl, setTitleMl] = useState("");
  const [speakerMl, setSpeakerMl] = useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-primary">Go live</h2>
          <p className="mt-1 text-xs text-text-muted">
            Paste a YouTube, Facebook or Instagram link to the stream.
          </p>
        </CardHeader>
        <CardContent>
          <form action={goLiveAction} className="space-y-4">
            <FormField label="Stream link" htmlFor="live-link">
              <Input
                id="live-link"
                name="link"
                type="url"
                inputMode="url"
                required
                placeholder="https://youtu.be/…"
                value={link}
                onChange={(event) => setLink(event.target.value)}
              />
            </FormField>
            {link.trim() !== "" && <LinkPreview link={link} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Title" htmlFor="live-title">
                <Input
                  id="live-title"
                  name="title"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </FormField>
              <FormField label="Speaker (optional)" htmlFor="live-speaker">
                <Input
                  id="live-speaker"
                  name="speaker"
                  maxLength={120}
                  value={speaker}
                  onChange={(event) => setSpeaker(event.target.value)}
                />
              </FormField>
              <FormField label="Title (Malayalam, optional)" htmlFor="live-title-ml">
                <Input
                  id="live-title-ml"
                  name="titleMl"
                  lang="ml"
                  maxLength={200}
                  className="admin-malayalam"
                  value={titleMl}
                  onChange={(event) => setTitleMl(event.target.value)}
                />
              </FormField>
              <FormField label="Speaker (Malayalam, optional)" htmlFor="live-speaker-ml">
                <Input
                  id="live-speaker-ml"
                  name="speakerMl"
                  lang="ml"
                  maxLength={120}
                  className="admin-malayalam"
                  value={speakerMl}
                  onChange={(event) => setSpeakerMl(event.target.value)}
                />
              </FormField>
            </div>
            <p className="text-xs text-text-muted">
              Visitors who switch the site to Malayalam see the Malayalam title and speaker; left
              empty, they see the English.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={goLivePending}>
                {goLivePending ? "Going live…" : isLive ? "Switch stream" : "Go live"}
              </Button>
              <ActionMessage state={goLiveState} />
            </div>
          </form>
        </CardContent>
      </Card>

      {isLive && (
        <Card>
          <CardContent>
            <form action={endAction} className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="danger" disabled={endPending}>
                {endPending ? "Ending…" : "End broadcast"}
              </Button>
              <ActionMessage state={endState} />
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-primary">Recent links</h2>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="px-5 py-4 text-sm text-text-muted">No broadcasts yet.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {history.map((entry) => (
                <li
                  key={entry.watchUrl}
                  className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary">
                      {entry.title ?? "Untitled"}{" "}
                      <span className="font-normal text-text-muted">
                        · {livePlatformLabels[entry.platform]}
                      </span>
                    </p>
                    <p className="truncate text-xs text-text-muted">{entry.watchUrl}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setLink(entry.watchUrl);
                        setTitle(entry.title ?? "");
                        setSpeaker(entry.speaker ?? "");
                        setTitleMl(entry.titleMl ?? "");
                        setSpeakerMl(entry.speakerMl ?? "");
                      }}
                    >
                      Use this link
                    </Button>
                    <Link
                      href={`/admin/videos/new?${new URLSearchParams({
                        link: entry.watchUrl,
                        title: entry.title ?? "",
                        speaker: entry.speaker ?? "",
                      }).toString()}`}
                      className="inline-flex min-h-10 items-center rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    >
                      Add to videos
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
