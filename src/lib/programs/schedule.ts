export const programTimeZone = "Asia/Kolkata";

/** A program leaves the homepage (and moves to Past) this long after it starts. */
export const programHomepageWindowMs = 3 * 60 * 60 * 1000;

// India has no daylight saving, so the offset is fixed all year.
const istOffset = "+05:30";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Converts an IST wall-clock date ("2026-10-04") and time ("18:30") to a UTC ISO string. */
export function istToUtcIso(date: string, time: string): string | null {
  if (!datePattern.test(date) || !timePattern.test(time)) {
    return null;
  }

  const parsed = new Date(`${date}T${time}:00${istOffset}`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  // Reject dates JavaScript silently rolls over, such as 2026-02-30.
  return utcToIstInputs(parsed.toISOString()).date === date ? parsed.toISOString() : null;
}

/** Splits a UTC instant into the IST date and time values used by form inputs. */
export function utcToIstInputs(iso: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: programTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

export function formatIstDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: programTimeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

type SchedulableProgram = {
  startsAt: string;
  status: "scheduled" | "cancelled";
};

export function isOnHomepage(program: SchedulableProgram, now: Date): boolean {
  return (
    program.status === "scheduled" &&
    now.getTime() < new Date(program.startsAt).getTime() + programHomepageWindowMs
  );
}

/**
 * The program the homepage features: the earliest scheduled one that is still
 * within its window. Cancelled programs never qualify.
 */
export function selectNextProgram<T extends SchedulableProgram>(programs: readonly T[], now: Date): T | null {
  let next: T | null = null;

  for (const program of programs) {
    if (
      isOnHomepage(program, now) &&
      (!next || new Date(program.startsAt).getTime() < new Date(next.startsAt).getTime())
    ) {
      next = program;
    }
  }

  return next;
}

export type Clock12 = { hour: number; minute: number; period: "AM" | "PM" };

/** "18:05" → { hour: 6, minute: 5, period: "PM" }; null for anything else. */
export function to12Hour(time: string): Clock12 | null {
  if (!timePattern.test(time)) {
    return null;
  }

  const hours = Number(time.slice(0, 2));

  return {
    hour: hours % 12 === 0 ? 12 : hours % 12,
    minute: Number(time.slice(3, 5)),
    period: hours < 12 ? "AM" : "PM",
  };
}

/** { hour: 12, minute: 0, period: "AM" } → "00:00", the value the server expects. */
export function to24Hour({ hour, minute, period }: Clock12): string {
  const hours = (hour % 12) + (period === "PM" ? 12 : 0);

  return `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
