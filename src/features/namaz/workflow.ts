import type { PrayerStep } from "@/data/namaz";
import type { AdminNamazStep } from "@/features/namaz/types";

/** Textarea → list: one item per line, trimmed, blank lines dropped. */
export function guidanceLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Published steps in admin order become the guide's cards, numbered 1..n. The first one
 * is the featured card at the top (Niyyah on the bundled guide).
 */
export function toPrayerSteps(steps: readonly AdminNamazStep[]): PrayerStep[] {
  return [...steps]
    .sort((a, b) => a.position - b.position)
    .map((step, index) => ({
      id: step.id,
      stepNumber: index + 1,
      name: step.name,
      nameMl: step.nameMl ?? undefined,
      whatToDo: step.whatToDo,
      whatToDoMl: step.whatToDoMl ?? undefined,
      arabic: step.arabic,
      transliteration: step.transliteration ?? "",
      transliterationMl: step.transliterationMl ?? undefined,
      malayalam: step.malayalam ?? "",
      dos: step.dos,
      dosMl: step.dosMl.length > 0 ? step.dosMl : undefined,
      donts: step.donts,
      dontsMl: step.dontsMl.length > 0 ? step.dontsMl : undefined,
      isRepeatNode: step.isRepeatNode || undefined,
    }));
}

/** Turns an RPC error into a message an admin can act on. */
export function namazErrorMessage(message: string | undefined): string {
  if (message === "namaz_step_not_found") {
    return "That step no longer exists. Refresh the page.";
  }

  return "Could not save this change. Please refresh and try again.";
}
