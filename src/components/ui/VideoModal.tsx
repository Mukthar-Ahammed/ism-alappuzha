"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: { player: "Video Player", close: "Close modal" },
  ml: { player: "വീഡിയോ പ്ലെയർ", close: "അടയ്ക്കുക" },
});

export interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeId: string;
  title?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  youtubeId,
  title: titleProp,
}) => {
  const t = useCopy(copy);
  const title = titleProp ?? t.player;
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on ESC key press & handle focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Auto-focus close button when modal opens
    closeButtonRef.current?.focus();

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 font-body animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-[22px] overflow-hidden shadow-floating border border-primary/10 z-10 flex flex-col"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 pl-4 pr-2 py-2 sm:px-6 sm:py-4 border-b border-primary/10 bg-primary-tint">
          <h3
            id="video-modal-title"
            className="min-w-0 font-display text-base sm:text-lg font-bold text-primary truncate"
          >
            {title}
          </h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="shrink-0 p-2.5 rounded-full text-text-muted hover:text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label={t.close}
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Responsive Video Embed Area (Loads YouTube iframe ONLY when open) */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
            title={title}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
