import { ListSkeleton, PageHeaderSkeleton } from "@/components/admin/skeletons";
import { Skeleton } from "@/components/admin/ui";

export default function DhikrLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action titleWidth="w-56" />
      <Skeleton className="h-4 w-36" />
      <ListSkeleton rows={3} actions={5} />
      <Skeleton className="h-4 w-28" />
      <ListSkeleton rows={2} actions={5} />
    </div>
  );
}
