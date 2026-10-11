import type { Program } from "@/data/programs";
import { isOnHomepage } from "@/lib/programs/schedule";
import type { Locale } from "@/lib/i18n/locale";

/** Intl locale for names (weekday, month, AM/PM); the numeric parts always use en-US. */
const intlLocale: Record<Locale, string> = { en: "en-US", ml: "ml-IN" };

/**
 * Format a date string or Date object in Asia/Kolkata timezone.
 * Weekday, month and time text follow `locale`; year, month, day and dateKey do not.
 */
export function getISTParts(dateInput: string | Date, locale: Locale = "en") {
  const names = intlLocale[locale];
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  // Formatting using Asia/Kolkata timezone
  const yearStr = d.toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  });
  const monthNumStr = d.toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "numeric",
  });
  const dayStr = d.toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
  });
  const weekdayLong = d.toLocaleDateString(names, {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  });
  const weekdayShort = d.toLocaleDateString(names, {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  });
  const monthLong = d.toLocaleDateString(names, {
    timeZone: "Asia/Kolkata",
    month: "long",
  });
  const monthShort = d.toLocaleDateString(names, {
    timeZone: "Asia/Kolkata",
    month: "short",
  });

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Malayalam uses spoken day periods (രാവിലെ 8:30, രാത്രി 7:30) instead of AM/PM.
  const timeFormatted = d.toLocaleTimeString(names, {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    ...(locale === "ml" ? { dayPeriod: "short" as const } : { hour12: true }),
  });

  return {
    date: d,
    year,
    month,
    day,
    dateKey,
    weekdayLong,
    weekdayShort,
    monthLong,
    monthShort,
    timeFormatted,
  };
}

/**
 * Get formatted time range string (e.g., "6:00 PM – 8:30 PM IST").
 */
export function getTimeRangeFormatted(startIso: string, endIso?: string, locale: Locale = "en"): string {
  const zone = locale === "ml" ? "(ഇന്ത്യൻ സമയം)" : "IST";
  const startParts = getISTParts(startIso, locale);
  if (!endIso) {
    return `${startParts.timeFormatted} ${zone}`;
  }
  const endParts = getISTParts(endIso, locale);
  return `${startParts.timeFormatted} – ${endParts.timeFormatted} ${zone}`;
}

/**
 * Check if a program is active right now.
 */
export function isProgramActiveNow(program: Program, now: Date = new Date()): boolean {
  if (program.isLive) return true;
  const startTime = new Date(program.date).getTime();
  const endTime = program.endTime
    ? new Date(program.endTime).getTime()
    : startTime + 2 * 3600 * 1000;
  const nowTime = now.getTime();
  return nowTime >= startTime && nowTime <= endTime;
}

/**
 * Check if a program is still listed as upcoming: until 3 hours after it starts.
 * Cancelled programs are removed before they reach the public site.
 */
export function isProgramUpcoming(program: Program, now: Date = new Date()): boolean {
  return isOnHomepage({ startsAt: program.date, status: "scheduled" }, now);
}

const countdownCopy = {
  en: {
    live: "LIVE NOW",
    soon: "Starting soon",
    days: (n: number) => `Starts in ${n} day${n > 1 ? "s" : ""}`,
    hours: (n: number) => `Starts in ${n} hour${n > 1 ? "s" : ""}`,
    mins: (n: number) => `Starts in ${n} min${n > 1 ? "s" : ""}`,
  },
  ml: {
    live: "ഇപ്പോൾ തത്സമയം",
    soon: "ഉടൻ ആരംഭിക്കും",
    days: (n: number) => `${n} ദിവസത്തിനകം ആരംഭിക്കും`,
    hours: (n: number) => `${n} മണിക്കൂറിനകം ആരംഭിക്കും`,
    mins: (n: number) => `${n} മിനിറ്റിനകം ആരംഭിക്കും`,
  },
} satisfies Record<Locale, unknown>;

/**
 * Get countdown label (e.g. "Starts in 3 days", "Starts in 2 hours", "LIVE NOW").
 */
export function getCountdownLabel(program: Program, now: Date = new Date(), locale: Locale = "en"): string {
  const t = countdownCopy[locale];

  if (isProgramActiveNow(program, now)) {
    return t.live;
  }

  const startTime = new Date(program.date).getTime();
  const diffMs = startTime - now.getTime();

  if (diffMs <= 0) {
    return t.soon;
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 1) {
    return t.days(diffDays);
  }
  if (diffHours >= 1) {
    return t.hours(diffHours);
  }
  const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return t.mins(diffMins);
}

/**
 * Download .ics calendar file for a given program.
 */
export function downloadIcsFile(program: Program) {
  const startDate = new Date(program.date);
  const endDate = program.endTime
    ? new Date(program.endTime)
    : new Date(startDate.getTime() + 2 * 3600 * 1000);

  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const cleanTitle = program.title.replace(/^TODO:\s*/, "");
  const cleanSpeaker = program.speaker.replace(/^TODO:\s*/, "");
  const cleanVenue = program.venue.replace(/^TODO:\s*/, "");
  const cleanDesc = program.description.replace(/^TODO:\s*/, "");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ISM Alappuzha//Program Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:program-${program.id}@ismalappuzha.org`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}\\nSpeaker: ${cleanSpeaker}`,
    `LOCATION:${cleanVenue}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${program.id}-schedule.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const englishMonthPrefixes = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Re-renders an English month name formatted on the server ("September", "Sep") in `locale`.
 * Anything that is not a month name is returned unchanged.
 */
export function localizeMonthName(month: string, locale: Locale, style: "long" | "short" = "long"): string {
  const index = englishMonthPrefixes.indexOf(month.trim().slice(0, 3).toLowerCase());
  if (locale === "en" || index < 0) return month;

  return new Intl.DateTimeFormat(intlLocale[locale], { month: style, timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, index, 1))
  );
}
