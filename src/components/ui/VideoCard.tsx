"use client";

import React from "react";
import Image from "next/image";
import { VideoItem, VideoPlatform, getThumbnailUrl } from "@/data/videos";
import { cn } from "@/lib/utils/cn";
import { localizeMonthName } from "@/lib/utils/dateUtils";
import { defineCopy, pickText, useCopy, useLocale, type Locale } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: {
    categories: {
      Speeches: "Speeches",
      Campaigns: "Campaigns",
      Youth: "Youth",
    } as Record<VideoItem["category"], string>,
    platforms: {
      YouTube: "YouTube",
      Instagram: "Instagram",
      Facebook: "Facebook",
    } as Record<VideoPlatform, string>,
    watch: "Watch Speech →",
    viewPost: "View Post ↗",
  },
  ml: {
    categories: {
      Speeches: "പ്രഭാഷണങ്ങൾ",
      Campaigns: "കാമ്പയിനുകൾ",
      Youth: "യുവജനം",
    },
    platforms: {
      YouTube: "യൂട്യൂബ്",
      Instagram: "ഇൻസ്റ്റഗ്രാം",
      Facebook: "ഫേസ്ബുക്ക്",
    },
    watch: "പ്രഭാഷണം കാണുക →",
    viewPost: "പോസ്റ്റ് കാണുക ↗",
  },
});

/** The server formats video dates as "Sep 2026"; Malayalam re-renders that month name. */
function localizeVideoDate(date: string, locale: Locale): string {
  const match = /^(\S+) (\d{4})$/.exec(date);
  if (locale === "en" || !match) return date;

  return `${match[2]} ${localizeMonthName(match[1], locale, "short")}`;
}

export interface VideoCardProps {
  video: VideoItem;
  onPlayClick?: (video: VideoItem) => void;
  className?: string;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPlayClick,
  className,
}) => {
  const locale = useLocale();
  const t = useCopy(copy);
  const title = pickText(locale, video.title, video.titleMl);
  const speaker = pickText(locale, video.speaker, video.speakerMl);
  const isYouTube = video.platform === "YouTube";
  const thumbnailUrl = getThumbnailUrl(video);

  const handleClick = (e: React.MouseEvent) => {
    if (isYouTube && onPlayClick) {
      e.preventDefault();
      onPlayClick(video);
    }
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col bg-white rounded-[22px] overflow-hidden border border-primary/10 shadow-soft hover:shadow-floating transition-all duration-300 font-body h-full",
        className
      )}
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video w-full bg-primary-tint overflow-hidden">
        <Image
          src={thumbnailUrl}
          alt={title}
          width={600}
          height={338}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          placeholder={video.thumbnailBlurDataUrl ? "blur" : "empty"}
          blurDataURL={video.thumbnailBlurDataUrl}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay Darkening */}
        <div className="absolute inset-0 bg-primary/20 transition-opacity duration-300 group-hover:bg-primary/10" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-white/90 backdrop-blur-md text-primary px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider shadow-xs">
            {t.categories[video.category] ?? video.category}
          </span>
        </div>

        {/* Platform Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-xs",
              video.platform === "YouTube" && "bg-red-600 text-white",
              video.platform === "Instagram" && "bg-pink-600 text-white",
              video.platform === "Facebook" && "bg-blue-600 text-white"
            )}
          >
            {t.platforms[video.platform] ?? video.platform}
          </span>
        </div>

        {/* Duration Pill (if YouTube) */}
        {video.duration && (
          <div className="absolute bottom-3 right-3 z-10">
            <span className="bg-primary/90 text-white px-2 py-0.5 rounded text-[10px] font-mono">
              {video.duration}
            </span>
          </div>
        )}

        {/* Gold Play Button / External Link Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isYouTube ? (
            <div className="w-12 h-12 rounded-full bg-secondary text-primary flex items-center justify-center shadow-floating transition-transform duration-300 group-hover:scale-110">
              <svg
                className="w-5 h-5 translate-x-0.5 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-floating transition-transform duration-300 group-hover:scale-110">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-primary leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
            {isYouTube ? (
              <button
                type="button"
                onClick={handleClick}
                className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-xs"
              >
                {title}
              </button>
            ) : (
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-xs"
              >
                {title}
              </a>
            )}
          </h3>
          <p className="text-xs text-text-muted mt-2 font-medium">
            {speaker}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-primary/10 flex items-center justify-between text-[11px] text-text-muted">
          <span>{localizeVideoDate(video.date, locale)}</span>
          <span className="font-semibold text-primary group-hover:text-secondary transition-colors">
            {isYouTube ? t.watch : t.viewPost}
          </span>
        </div>
      </div>
    </article>
  );
};
