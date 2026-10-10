import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  const previous = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 text-sm"
    >
      <Link
        href={`${basePath}?page=${previous}`}
        aria-disabled={page <= 1}
        className={cn(
          "rounded-full border border-border-subtle px-4 py-2 font-semibold text-primary",
          page <= 1 && "pointer-events-none opacity-50"
        )}
      >
        Previous
      </Link>
      <span className="text-text-muted">
        Page {page} of {totalPages}
      </span>
      <Link
        href={`${basePath}?page=${next}`}
        aria-disabled={page >= totalPages}
        className={cn(
          "rounded-full border border-border-subtle px-4 py-2 font-semibold text-primary",
          page >= totalPages && "pointer-events-none opacity-50"
        )}
      >
        Next
      </Link>
    </nav>
  );
}
