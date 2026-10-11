/** Entry categories, in the order the filter chips show them. Must match the phase 9 SQL check. */
export const dhikrEntryCategories = [
  "Morning & Evening",
  "After Salah",
  "Sleep",
  "Travel",
  "Food",
  "Forgiveness",
  "Protection",
] as const;

export type DhikrCategory = "All" | (typeof dhikrEntryCategories)[number];

export const dhikrCategories: DhikrCategory[] = ["All", ...dhikrEntryCategories];

export interface DhikrItem {
  id: string;
  category: Exclude<DhikrCategory, "All">;
  arabic: string;
  transliteration: string;
  malayalam: string;
  source: string;
  /** Malayalam versions entered in the admin; the English is shown when they are empty. */
  transliterationMl?: string;
  sourceMl?: string;
  repeat?: number;
  audioUrl?: string;
}
