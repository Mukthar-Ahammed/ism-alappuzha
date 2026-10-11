"use client";

import React, { useCallback, useState } from "react";
import { AudioButton } from "./AudioButton";
import type { DhikrItem } from "@/data/dhikr";
import { defineCopy, hasMalayalamScript, useCopy, useLocale, type Locale } from "@/lib/i18n/locale";

/** Display names for the dhikr category keys (the keys stay English: they match the database check). */
export const dhikrCategoryLabels: Record<Locale, Record<string, string>> = {
  en: {},
  ml: {
    All: "എല്ലാം",
    Favorites: "പ്രിയപ്പെട്ടവ",
    "Morning & Evening": "രാവിലെയും വൈകുന്നേരവും",
    "After Salah": "നമസ്കാരശേഷം",
    Sleep: "ഉറക്കം",
    Travel: "യാത്ര",
    Food: "ഭക്ഷണം",
    Forgiveness: "പാപമോചനം",
    Protection: "സംരക്ഷണം",
  },
};

const copy = defineCopy({
  en: {
    copy: "Copy",
    copied: "Copied",
    copyLabel: (name: string) => `Copy ${name}`,
    addFavorite: (name: string) => `Add ${name} to favorites`,
    removeFavorite: (name: string) => `Remove ${name} from favorites`,
    repeat: (n: number) => `${n}×`,
  },
  ml: {
    copy: "പകർത്തുക",
    copied: "പകർത്തി",
    copyLabel: (name: string) => `${name} പകർത്തുക`,
    addFavorite: (name: string) => `${name} പ്രിയപ്പെട്ടവയിൽ ചേർക്കുക`,
    removeFavorite: (name: string) => `${name} പ്രിയപ്പെട്ടവയിൽ നിന്ന് നീക്കുക`,
    repeat: (n: number) => `${n} തവണ`,
  },
});

interface DhikrCardProps {
  item: DhikrItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const DhikrCard: React.FC<DhikrCardProps> = ({
  item,
  isFavorite,
  onToggleFavorite,
}) => {
  const t = useCopy(copy);
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  // Dhikr text stays in the language the admin typed it in, whichever site language is chosen.
  const transliteration = item.transliteration;
  const transliterationIsMl = hasMalayalamScript(transliteration);
  const source = item.source;

  const handleCopy = useCallback(async () => {
    const text = [item.arabic, transliteration, item.malayalam]
      .filter(Boolean)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [item, transliteration]);

  return (
    <div className="group relative flex flex-col bg-white border border-border-subtle rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-lg">
      {/* Category tag */}
      <span className="inline-flex self-start px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-secondary-tint text-secondary mb-5">
        {dhikrCategoryLabels[locale][item.category] ?? item.category}
      </span>

      {/* Arabic text */}
      <p
        className="font-arabic text-2xl sm:text-[1.75rem] leading-[1.9] text-primary mb-4"
        dir="rtl"
        lang="ar"
      >
        {item.arabic}
      </p>

      {/* Transliteration */}
      <p
        className={
          transliterationIsMl
            ? "font-malayalam text-sm font-medium text-secondary leading-relaxed mb-2"
            : "text-sm font-medium text-secondary leading-relaxed mb-2 italic"
        }
        lang={transliterationIsMl ? "ml" : undefined}
      >
        {transliteration}
      </p>

      {/* Malayalam meaning */}
      <p
        className="font-malayalam text-sm text-text-muted leading-relaxed mb-4"
        lang="ml"
      >
        {item.malayalam}
      </p>

      {/* Source + Repeat */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted/60 mb-5">
        {source && <span>{source}</span>}
        {item.repeat && item.repeat > 1 && (
          <span className="inline-flex items-center gap-1 text-secondary font-semibold">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 014-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
            {t.repeat(item.repeat)}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border-subtle">
        {/* Audio */}
        <AudioButton audioUrl={item.audioUrl} label={item.arabic} />

        {/* Copy */}
        <button
          onClick={handleCopy}
          aria-label={copied ? t.copied : t.copyLabel(transliteration)}
          className="flex items-center justify-center h-9 px-3 rounded-full text-xs font-medium transition-all duration-200
            bg-primary-tint text-primary hover:bg-primary hover:text-white
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {copied ? (
            <span className="flex items-center gap-1">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {t.copied}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {t.copy}
            </span>
          )}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Favorite */}
        <button
          onClick={() => onToggleFavorite(item.id)}
          aria-label={
            isFavorite
              ? t.removeFavorite(transliteration)
              : t.addFavorite(transliteration)
          }
          aria-pressed={isFavorite}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary
            hover:scale-110"
        >
          {isFavorite ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="var(--secondary)"
              stroke="var(--secondary)"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
