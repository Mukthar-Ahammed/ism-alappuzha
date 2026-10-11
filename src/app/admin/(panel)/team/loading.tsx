import { Skeleton } from "@/components/admin/ui";

export default function TeamLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="rounded-[var(--radius-card)] border border-border-subtle bg-bg p-6 shadow-soft">
        <Skeleton className="h-5 w-28" />
        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="mt-4 h-10 w-28" />
      </div>

      <div className="rounded-[var(--radius-card)] border border-border-subtle bg-bg p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
