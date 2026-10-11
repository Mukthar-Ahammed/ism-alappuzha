import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { QuestionFilters } from "@/features/questions/schemas";

export function InboxPagination({
  filters,
  totalPages,
}: {
  filters: QuestionFilters;
  totalPages: number;
}) {
  const previous = Math.max(1, filters.page - 1);
  const next = Math.min(totalPages, filters.page + 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 text-sm"
    >
      <Link
        href={hrefFor(filters, previous)}
        aria-disabled={filters.page <= 1}
        className={cn(
          "rounded-full border border-border-subtle px-4 py-2 font-semibold text-primary",
          filters.page <= 1 && "pointer-events-none opacity-50"
        )}
      >
        Previous
      </Link>
      <span className="text-text-muted">
        Page {filters.page} of {totalPages}
      </span>
      <Link
        href={hrefFor(filters, next)}
        aria-disabled={filters.page >= totalPages}
        className={cn(
          "rounded-full border border-border-subtle px-4 py-2 font-semibold text-primary",
          filters.page >= totalPages && "pointer-events-none opacity-50"
        )}
      >
        Next
      </Link>
    </nav>
  );
}

function hrefFor(filters: QuestionFilters, page: number): string {
  const params = new URLSearchParams();
  params.set("status", filters.status);
  params.set("sort", filters.sort);
  params.set("page", String(page));

  if (filters.category) params.set("category", filters.category);
  if (filters.private) params.set("private", "1");
  if (filters.published) params.set("published", "1");
  if (filters.hasEmail) params.set("hasEmail", "1");
  if (filters.search) params.set("search", filters.search);

  return `/admin?${params.toString()}`;
}
