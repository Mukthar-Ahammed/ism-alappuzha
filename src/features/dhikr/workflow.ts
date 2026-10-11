import { dhikrEntryCategories, type DhikrItem } from "@/data/dhikr";
import type { AdminDhikr } from "@/features/dhikr/types";

/** Category order first (as the filter chips list them), then the order set in the admin. */
export function sortDhikr<T extends { category: string; sortOrder: number }>(entries: readonly T[]): T[] {
  const rank = (category: string) => {
    const index = (dhikrEntryCategories as readonly string[]).indexOf(category);
    return index === -1 ? dhikrEntryCategories.length : index;
  };

  return [...entries].sort((a, b) => rank(a.category) - rank(b.category) || a.sortOrder - b.sortOrder);
}

export function adminDhikrToPublic(entry: AdminDhikr): DhikrItem {
  return {
    id: entry.id,
    category: entry.category,
    arabic: entry.arabic,
    transliteration: entry.transliteration ?? "",
    transliterationMl: entry.transliterationMl ?? undefined,
    malayalam: entry.malayalam ?? "",
    source: entry.reference ?? "",
    sourceMl: entry.referenceMl ?? undefined,
    repeat: entry.repeatCount ?? undefined,
  };
}

/** Turns an RPC error into a message an admin can act on. */
export function dhikrErrorMessage(message: string | undefined): string {
  if (message === "dhikr_not_found") {
    return "That entry no longer exists. Refresh the page.";
  }

  if (message === "dhikr_not_reviewed") {
    return "Mark the text as checked before publishing it.";
  }

  return "Could not save this change. Please refresh and try again.";
}
