"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

// Singleton: only one audio can play at a time across all buttons
let globalAudio: HTMLAudioElement | null = null;
let globalStopCb: (() => void) | null = null;

interface AudioButtonProps {
  audioUrl?: string;
  label: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  audioUrl,
  label,
}) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        if (globalAudio === audioRef.current) {
          globalAudio = null;
          globalStopCb = null;
        }
      }
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (!audioUrl) return;

    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      if (globalAudio === audioRef.current) {
        globalAudio = null;
        globalStopCb = null;
      }
      return;
    }

    // Stop whatever else is playing globally
    if (globalAudio && globalStopCb) {
      globalAudio.pause();
      globalStopCb();
    }

    // Lazy-create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => {
        setPlaying(false);
        globalAudio = null;
        globalStopCb = null;
      });
      audioRef.current.addEventListener("error", () => {
        setPlaying(false);
        globalAudio = null;
        globalStopCb = null;
      });
    }

    audioRef.current.src = audioUrl;
    audioRef.current.play().catch(() => setPlaying(false));
    setPlaying(true);

    globalAudio = audioRef.current;
    globalStopCb = () => setPlaying(false);
  }, [audioUrl, playing]);

  // Hide button entirely if no audio URL
  if (!audioUrl) return null;

  return (
    <button
      onClick={handleToggle}
      aria-label={playing ? `Stop ${label}` : `Play ${label}`}
      className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200
        bg-secondary-tint text-secondary hover:bg-secondary hover:text-white
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
    >
      {playing ? (
        /* Stop icon */
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="10" height="10" rx="1.5" />
        </svg>
      ) : (
        /* Play icon */
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.5 2.5v11l9-5.5-9-5.5z" />
        </svg>
      )}
    </button>
  );
};
