import type { Program } from "@/data/programs";

/**
 * Format a date string or Date object in Asia/Kolkata timezone.
 */
export function getISTParts(dateInput: string | Date) {
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
  const weekdayLong = d.toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  });
  const weekdayShort = d.toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  });
  const monthLong = d.toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "long",
  });
  const monthShort = d.toLocaleDateString("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
  });

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const timeFormatted = d.toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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
export function getTimeRangeFormatted(startIso: string, endIso?: string): string {
  const startParts = getISTParts(startIso);
  if (!endIso) {
    return `${startParts.timeFormatted} IST`;
  }
  const endParts = getISTParts(endIso);
  return `${startParts.timeFormatted} – ${endParts.timeFormatted} IST`;
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
 * Check if a program is upcoming relative to current time in Asia/Kolkata.
 */
export function isProgramUpcoming(program: Program, now: Date = new Date()): boolean {
  const endTime = program.endTime
    ? new Date(program.endTime).getTime()
    : new Date(program.date).getTime();
  return endTime >= now.getTime();
}

/**
 * Get countdown label (e.g. "Starts in 3 days", "Starts in 2 hours", "LIVE NOW").
 */
export function getCountdownLabel(program: Program, now: Date = new Date()): string {
  if (isProgramActiveNow(program, now)) {
    return "LIVE NOW";
  }

  const startTime = new Date(program.date).getTime();
  const diffMs = startTime - now.getTime();

  if (diffMs <= 0) {
    return "Starting soon";
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 1) {
    return `Starts in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }
  if (diffHours >= 1) {
    return `Starts in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  }
  const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return `Starts in ${diffMins} min${diffMins > 1 ? "s" : ""}`;
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
