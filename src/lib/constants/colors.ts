/**
 * Global color system single source of truth for programmatic contexts.
 * Mirrors CSS custom properties defined in src/app/globals.css.
 */
export const COLORS = {
  bg: "#FFFFFF",
  primary: "#10241E",
  primaryHover: "#16302A",
  primaryTint: "rgba(16, 36, 30, 0.05)",
  secondary: "#C9A24B",
  secondaryHover: "#B8923B",
  secondaryTint: "rgba(201, 162, 75, 0.12)",
  textMain: "#111827",
  textMuted: "#4B5563",
  borderSubtle: "rgba(16, 36, 30, 0.12)",
} as const;
