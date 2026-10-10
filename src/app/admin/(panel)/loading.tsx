import { Skeleton } from "@/components/admin/ui";

export default function Loading() {
  return (
    <main className="min-h-screen bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-32" />
        ))}
      </div>
      <Skeleton className="mt-6 h-72" />
    </main>
  );
}
