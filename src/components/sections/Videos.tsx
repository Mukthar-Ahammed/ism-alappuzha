"use client";

import React, { useState, useRef } from "react";
import { Container } from "@/components/ui/Container";
import { Chips } from "@/components/ui/Chips";
import { VideoCard } from "@/components/ui/VideoCard";
import { VideoModal } from "@/components/ui/VideoModal";
import {
  videosData,
  videoCategories,
  VideoCategory,
  VideoItem,
} from "@/data/videos";

export const Videos: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<VideoCategory>("All");
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);

  // Filter video list based on selected chip category
  const filteredVideos =
    activeCategory === "All"
      ? videosData
      : videosData.filter((v) => v.category === activeCategory);

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
    <section id="videos" className="py-20 md:py-28 bg-bg font-body text-text-main overflow-hidden">
      <Container>
        {/* Section Heading & Category Filter Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              Speeches & Media Library
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-primary tracking-tight mt-1">
              Speeches & Videos
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Filter Chips */}
            <Chips
              categories={videoCategories}
              activeCategory={activeCategory}
              onChange={(cat) => setActiveCategory(cat as VideoCategory)}
            />

            {/* Desktop Prev / Next Navigation Arrows */}
            <div className="hidden md:flex items-center gap-2 shrink-0 border-l border-primary/10 pl-4">
              <button
                type="button"
                onClick={() => scrollCarousel("left")}
                className="w-10 h-10 rounded-full border border-primary/15 bg-white text-primary hover:bg-secondary-tint hover:border-secondary transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                aria-label="Scroll carousel left"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel("right")}
                className="w-10 h-10 rounded-full border border-primary/15 bg-white text-primary hover:bg-secondary-tint hover:border-secondary transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                aria-label="Scroll carousel right"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Snap Carousel Container */}
        <div
          ref={carouselRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="w-[85vw] sm:w-[360px] md:w-[400px] shrink-0 snap-start"
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
          title={selectedVideo.title}
        />
      )}
    </section>
  );
};
