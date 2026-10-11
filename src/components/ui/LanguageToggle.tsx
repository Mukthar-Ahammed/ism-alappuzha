"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { locales, setLocale, useLocale, type Locale } from "@/lib/i18n/locale";

const labels: Record<Locale, { short: string; name: string }> = {
  en: { short: "EN", name: "English" },
  ml: { short: "മല", name: "മലയാളം" },
};

/** Keeps <html lang> in step with the chosen language (screen readers, fonts, :lang CSS). */
export const HtmlLang: React.FC = () => {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
};

export const LanguageToggle: React.FC<{ className?: string }> = ({ className }) => {
  const locale = useLocale();

  return (
    <div
      role="group"
      aria-label={locale === "ml" ? "ഭാഷ" : "Language"}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-primary/15 bg-white p-0.5 text-xs font-semibold",
        className
      )}
    >
      {locales.map((option) => {
        const active = option === locale;

        return (
          <button
            key={option}
            type="button"
            lang={option}
            onClick={() => setLocale(option)}
            aria-pressed={active}
            title={labels[option].name}
            className={cn(
              "inline-flex min-h-8 min-w-9 items-center justify-center rounded-full px-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
              option === "ml" && "font-malayalam",
              active ? "bg-primary text-white" : "text-primary hover:bg-primary-tint"
            )}
          >
            <span aria-hidden="true">{labels[option].short}</span>
            <span className="sr-only">{labels[option].name}</span>
          </button>
        );
      })}
    </div>
  );
};
