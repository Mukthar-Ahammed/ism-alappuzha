"use client";

import dynamic from "next/dynamic";
import { ModalLoader } from "@/components/ui/BrandLoader";
import React, { useState, useRef } from "react";
import { Container } from "@/components/ui/Container";
import { Chips } from "@/components/ui/Chips";
import { VideoCard } from "@/components/ui/VideoCard";
import {
  videoCategories,
  VideoCategory,
  VideoItem,
} from "@/data/videos";
import { defineCopy, pickText, useCopy, useLocale } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: {
    opening: "Opening the video",
    eyebrow: "Speeches & Media Library",
    title: "Speeches & Videos",
    categories: {
      All: "All",
      Speeches: "Speeches",
      Campaigns: "Campaigns",
      Youth: "Youth",
    } as Record<string, string>,
    filter: "Video categories",
    scrollLeft: "Scroll carousel left",
    scrollRight: "Scroll carousel right",
    empty: "New speeches and videos will appear here soon.",
    emptyCategory: "No videos in this category yet.",
  },
  ml: {
    opening: "വീഡിയോ തുറക്കുന്നു",
    eyebrow: "പ്രഭാഷണങ്ങളും മാധ്യമ ശേഖരവും",
    title: "പ്രഭാഷണങ്ങളും വീഡിയോകളും",
    categories: {
      All: "എല്ലാം",
      Speeches: "പ്രഭാഷണങ്ങൾ",
      Campaigns: "കാമ്പയിനുകൾ",
      Youth: "യുവജനം",
    },
    filter: "വീഡിയോ വിഭാഗങ്ങൾ",
    scrollLeft: "ഇടത്തോട്ട് നീക്കുക",
    scrollRight: "വലത്തോട്ട് നീക്കുക",
    empty: "പുതിയ പ്രഭാഷണങ്ങളും വീഡിയോകളും ഉടൻ ഇവിടെ ലഭ്യമാകും.",
    emptyCategory: "ഈ വിഭാഗത്തിൽ ഇതുവരെ വീഡിയോകളില്ല.",
  },
});

const VideoLoader: React.FC = () => <ModalLoader label={useCopy(copy).opening} />;

// Loaded when first opened, not with the page.
const VideoModal = dynamic(() => import("@/components/ui/VideoModal").then((mod) => mod.VideoModal), {
  ssr: false,
  loading: () => <VideoLoader />,
});

export const Videos: React.FC<{ videos: VideoItem[] }> = ({ videos }) => {
  const t = useCopy(copy);
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState<VideoCategory>("All");
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);

  // Filter video list based on selected chip category
  const filteredVideos =
    activeCategory === "All"
      ? videos
      : videos.filter((v) => v.category === activeCategory);

  // Desktop Carousel Scroll Controls
  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth * 0.75;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section id="videos" className="py-14 sm:py-20 md:py-28 bg-bg font-body text-text-main overflow-hidden">
      <Container>
        {/* Section Heading & Category Filter Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-10">
          <div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              {t.eyebrow}
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-primary tracking-tight mt-1">
              {t.title}
            </h2>
          </div>

          <div className="flex min-w-0 items-center gap-4">
            {/* Filter Chips */}
            <Chips
              categories={videoCategories}
              activeCategory={activeCategory}
              onChange={(cat) => setActiveCategory(cat as VideoCategory)}
              getLabel={(cat) => t.categories[cat] ?? cat}
              label={t.filter}
              className="-mx-4 min-w-0 px-4 sm:mx-0 sm:px-0"
            />

            {/* Desktop Prev / Next Navigation Arrows */}
            <div className="hidden md:flex items-center gap-2 shrink-0 border-l border-primary/10 pl-4">
              <button
                type="button"
                onClick={() => scrollCarousel("left")}
                className="w-10 h-10 rounded-full border border-primary/15 bg-white text-primary hover:bg-secondary-tint hover:border-secondary transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                aria-label={t.scrollLeft}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel("right")}
                className="w-10 h-10 rounded-full border border-primary/15 bg-white text-primary hover:bg-secondary-tint hover:border-secondary transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                aria-label={t.scrollRight}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {filteredVideos.length === 0 && (
          <p className="rounded-[22px] border border-primary/10 bg-white px-6 py-10 text-center text-sm text-text-muted">
            {videos.length === 0
              ? t.empty
              : t.emptyCategory}
          </p>
        )}

        {/* Horizontal Snap Carousel Container */}
        <div
          ref={carouselRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-0 pb-6 scrollbar-none overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="w-[82vw] max-w-[360px] sm:w-[360px] md:w-[400px] shrink-0 snap-start"
            >
              <VideoCard
                video={video}
                onPlayClick={(vid) => setSelectedVideo(vid)}
              />
            </div>
          ))}
        </div>
      </Container>

      {/* Accessible Video Player Modal */}
      {selectedVideo && selectedVideo.youtubeId && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          youtubeId={selectedVideo.youtubeId}
          title={pickText(locale, selectedVideo.title, selectedVideo.titleMl)}
        />
      )}
    </section>
  );
};
