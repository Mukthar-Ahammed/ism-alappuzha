"use client";

import { useSyncExternalStore } from "react";

export type Locale = "en" | "ml";

export const locales: Locale[] = ["en", "ml"];

/** Each component keeps its own copy; `ml` must have exactly the shape of `en`. */
export type Copy<T> = { en: T; ml: NoInfer<T> };

export function defineCopy<T>(copy: Copy<T>): Copy<T> {
  return copy;
}

const STORAGE_KEY = "ism-locale";
const listeners = new Set<() => void>();

function readStoredLocale(): Locale {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "ml" ? "ml" : "en";
  } catch {
    return "en";
  }
}

let current: Locale | null = null;

function subscribe(callback: () => void) {
  listeners.add(callback);

  // Another tab switching language switches this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    current = readStoredLocale();
    callback();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Locale {
  if (current === null) current = readStoredLocale();
  return current;
}

// Pages are statically rendered in English; a stored Malayalam choice applies right after hydration.
function getServerSnapshot(): Locale {
  return "en";
}

export function setLocale(locale: Locale): void {
  current = locale;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Private mode or blocked storage: the choice lasts for this page view only.
  }
  listeners.forEach((listener) => listener());
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Picks the current language's copy from a `defineCopy` block. */
export function useCopy<T>(copy: Copy<T>): T {
  return copy[useLocale()];
}

/** True when the text contains Malayalam script, so it can be given the Malayalam font. */
export function hasMalayalamScript(text: string | null | undefined): boolean {
  return /[ഀ-ൿ]/.test(text ?? "");
}

/** Admin-entered text: the Malayalam version when one was written, otherwise the English. */
export function pickText(locale: Locale, en: string, ml?: string | null): string {
  return locale === "ml" && ml?.trim() ? ml : en;
}

/** Same as pickText for lists (dos/don'ts): Malayalam only when the list has entries. */
export function pickList(locale: Locale, en: string[], ml?: string[] | null): string[] {
  return locale === "ml" && ml && ml.length > 0 ? ml : en;
}
