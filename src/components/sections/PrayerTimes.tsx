"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { defineCopy, useCopy, useLocale } from "@/lib/i18n/locale";
import { calculateToday, formatTime, prayerKeys, type PrayerDay, type PrayerKey } from "@/lib/prayer-times";

const copy = defineCopy({
  en: {
    heading: "Prayer times in Alappuzha",
    names: {
      fajr: "Fajr",
      sunrise: "Sunrise",
      dhuhr: "Dhuhr",
      asr: "Asr",
      maghrib: "Maghrib",
      isha: "Isha",
    } satisfies Record<PrayerKey, string>,
    next: "Next",
    note: "Karachi method, Shafi Asr. Your local masjid's times may differ by a few minutes.",
  },
  ml: {
    heading: "ആലപ്പുഴയിലെ നമസ്കാര സമയങ്ങൾ",
    names: {
      fajr: "സുബ്ഹ്",
      sunrise: "സൂര്യോദയം",
      dhuhr: "ളുഹ്ർ",
      asr: "അസ്ർ",
      maghrib: "മഗ്‌രിബ്",
      isha: "ഇശാ",
    } satisfies Record<PrayerKey, string>,
    next: "അടുത്തത്",
    note: "കറാച്ചി രീതി, ശാഫിഈ അസ്ർ. പ്രാദേശിക പള്ളിയിലെ സമയങ്ങളിൽ ഏതാനും മിനിറ്റ് വ്യത്യാസം ഉണ്ടാകാം.",
  },
});

/** Today's prayer times in Alappuzha, with the next prayer gently marked. */
export const PrayerTimes: React.FC<{ className?: string }> = ({ className }) => {
  const t = useCopy(copy);
  const dateLocale = useLocale() === "ml" ? "ml-IN" : "en-GB";
  // Calculated after mount: the server cannot know the visitor's "now", and a
  // server-rendered day would mismatch on hydration.
  const [today, setToday] = useState<PrayerDay | null>(null);

  useEffect(() => {
    const update = () => setToday(calculateToday(new Date(), dateLocale));
    update();
    // Once a minute keeps the "next" marker and the date current on a page left open.
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [dateLocale]);

  return (
    <div
      role="region"
      aria-labelledby="prayer-times-heading"
      className={cn("rounded-[22px] border border-primary/10 bg-white px-4 py-4 sm:px-6 sm:py-5", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="prayer-times-heading" className="font-display text-base sm:text-lg font-semibold text-primary">
          {t.heading}
        </h3>
        <p className="min-h-4 text-xs text-text-muted">{today?.dateLabel}</p>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {prayerKeys.map((key) => {
          const isNext = today?.next === key;

          return (
            <div
              key={key}
              className={cn(
                "rounded-xl px-2 py-2.5 text-center",
                isNext ? "bg-primary-tint ring-1 ring-secondary/40" : "bg-bg"
              )}
            >
              <dt className="text-[11px] text-text-muted sm:text-xs">
                {t.names[key]}
                {isNext && <span className="sr-only"> ({t.next})</span>}
              </dt>
              <dd
                className={cn(
                  "mt-0.5 text-sm tabular-nums sm:text-base",
                  isNext ? "font-semibold text-primary" : "font-medium text-text-main",
                  key === "sunrise" && "text-text-muted"
                )}
              >
                {today ? formatTime(today.times[key]) : "–"}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-3 text-[11px] leading-relaxed text-text-muted">{t.note}</p>
    </div>
  );
};
