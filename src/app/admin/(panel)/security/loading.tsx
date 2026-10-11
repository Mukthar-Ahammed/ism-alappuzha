import { Skeleton } from "@/components/admin/ui";

export default function SecurityLoading() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="rounded-[var(--radius-card)] border border-border-subtle bg-bg p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-4 border-t border-border-subtle pt-4">
          <Skeleton className="h-10 w-44" />
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-border-subtle bg-bg p-6 shadow-soft">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="mt-4 h-10 w-36" />
      </div>
    </div>
  );
}
