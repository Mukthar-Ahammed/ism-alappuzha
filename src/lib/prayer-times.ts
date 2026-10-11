import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";

/**
 * Today's prayer times for Alappuzha, calculated in the browser (no API to fail or rate-limit).
 * Settings follow IslamicFinder's Alappuzha page: University of Islamic Sciences, Karachi
 * (Fajr and Isha at 18°) with the Shafi Asr rule. The minute offsets were fitted against its
 * October 2026 table; results stay within a minute of it (tests/prayer-times.test.ts).
 */
const alappuzha = new Coordinates(9.4981, 76.3388);
export const prayerTimeZone = "Asia/Kolkata";

function calculationParams() {
  const params = CalculationMethod.Karachi();
  params.madhab = Madhab.Shafi;
  params.adjustments = { fajr: 0, sunrise: -1, dhuhr: 1, asr: 1, maghrib: 2, isha: 1 };
  return params;
}

export const prayerKeys = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerKey = (typeof prayerKeys)[number];

export type PrayerDay = {
  dateLabel: string;
  times: Record<PrayerKey, Date>;
  /** The next prayer still to come today; sunrise is never next, as it is not a prayer. */
  next: PrayerKey | null;
};

/** Today in Alappuzha, whatever the visitor's own time zone is. */
export function calculateToday(now: Date, locale: string): PrayerDay {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: prayerTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  // adhan reads the calendar day from the Date's local fields.
  const result = new PrayerTimes(alappuzha, new Date(year, month - 1, day), calculationParams());
  const times = Object.fromEntries(prayerKeys.map((key) => [key, result[key]])) as Record<PrayerKey, Date>;

  return {
    dateLabel: new Intl.DateTimeFormat(locale, {
      timeZone: prayerTimeZone,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(now),
    times,
    next: prayerKeys.find((key) => key !== "sunrise" && times[key] > now) ?? null,
  };
}

/** "5:03 AM", in Alappuzha time. */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: prayerTimeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .toUpperCase();
}
