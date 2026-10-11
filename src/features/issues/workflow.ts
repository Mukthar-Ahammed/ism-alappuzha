import type { Issue } from "@/data/issues";

/** "2026-09-01" → { month: "September", year: 2026 }, the labels the issue cards use. */
export function issueMonthYear(issueDate: string): { month: string; year: number } {
  const date = new Date(`${issueDate}T00:00:00Z`);

  return {
    month: new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date),
    year: date.getUTCFullYear(),
  };
}

/**
 * The homepage spotlight: the featured issue, or the newest one when none is featured.
 * Everything else goes to the archive carousel, newest first.
 */
export function splitFeaturedIssue(issues: readonly Issue[]): { featured: Issue | null; archive: Issue[] } {
  const featured = issues.find((issue) => issue.isFeatured) ?? issues[0] ?? null;

  return {
    featured,
    archive: issues.filter((issue) => issue !== featured),
  };
}

/** Turns an RPC error into a message an admin can act on. */
export function issueErrorMessage(message: string | undefined): string {
  if (message === "issue_not_found") {
    return "That issue no longer exists. Refresh the page.";
  }

  if (message === "issue_not_published") {
    return "Publish the issue before featuring it.";
  }

  return "Could not save this change. Please refresh and try again.";
}
