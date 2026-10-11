"use client";

import Image from "next/image";
import { useState } from "react";
import { youtubeThumbnailUrl } from "@/lib/live-links";
import { liveEmbedSource } from "@/features/live/embed";
import type { PublicLive } from "@/features/live/types";
import { defineCopy, pickText, useCopy, useLocale } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: { play: (title: string) => `Play live stream: ${title}` },
  ml: { play: (title: string) => `തത്സമയ സംപ്രേഷണം പ്ലേ ചെയ്യുക: ${title}` },
});

/**
 * Click-to-load facade: no Google or Meta iframe, script or cookie is loaded until
 * the visitor chooses to play. Returns null for platforms that cannot be embedded.
 */
export function LivePlayer({ live }: { live: PublicLive }) {
  const [playing, setPlaying] = useState(false);
  const t = useCopy(copy);
  const title = pickText(useLocale(), live.title, live.titleMl);
  const source = liveEmbedSource(live);

  if (!source) {
    return null;
  }

  if (playing) {
    return (
      <iframe
        src={source}
        title={title}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group absolute inset-0 flex h-full w-full items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-secondary"
      aria-label={t.play(title)}
    >
      {live.platform === "youtube" && live.youtubeId ? (
        <Image
          src={youtubeThumbnailUrl(live.youtubeId)}
          alt=""
          fill
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-primary to-black" />
      )}
      <span
        aria-hidden="true"
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-floating transition-transform group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      >
        <svg className="ml-1 h-7 w-7 fill-current" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}
