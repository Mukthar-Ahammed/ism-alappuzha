import { describe, expect, it } from "vitest";
import { calculateToday, formatTime } from "@/lib/prayer-times";

// IslamicFinder's Alappuzha table for October 2026 (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha).
const islamicFinder: Record<number, string[]> = {
  1: ["5:04", "6:13", "12:16", "3:32", "6:17", "7:26"],
  11: ["5:03", "6:12", "12:13", "3:32", "6:12", "7:21"],
  12: ["5:03", "6:12", "12:13", "3:31", "6:11", "7:20"],
  20: ["5:03", "6:13", "12:11", "3:31", "6:07", "7:17"],
  31: ["5:04", "6:14", "12:10", "3:30", "6:04", "7:14"],
};

const toMinutes = (clock: string) => {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
};

describe("Alappuzha prayer times", () => {
  it.each(Object.entries(islamicFinder))("October %s is within a minute of IslamicFinder", (day, expected) => {
    // 06:00 UTC is 11:30 in Alappuzha, safely inside that calendar day.
    const today = calculateToday(new Date(Date.UTC(2026, 9, Number(day), 6)), "en-GB");
    const got = (["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const).map((key) =>
      formatTime(today.times[key]).replace(/\s?[AP]M$/, "")
    );

    got.forEach((clock, index) => {
      expect(Math.abs(toMinutes(clock) - toMinutes(expected[index]))).toBeLessThanOrEqual(1);
    });
  });

  it("marks the next prayer and skips sunrise", () => {
    // 06:30 in Alappuzha: after Fajr and sunrise, so Dhuhr is next.
    expect(calculateToday(new Date("2026-10-11T01:00:00Z"), "en-GB").next).toBe("dhuhr");
    // 23:00 in Alappuzha: nothing left today.
    expect(calculateToday(new Date("2026-10-11T17:30:00Z"), "en-GB").next).toBeNull();
  });

  it("uses Alappuzha's date even late at night elsewhere", () => {
    // 20:00 UTC on the 11th is already 01:30 on the 12th in Alappuzha.
    expect(calculateToday(new Date("2026-10-11T20:00:00Z"), "en-GB").dateLabel).toContain("12");
  });
});
