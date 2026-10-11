import { ListSkeleton, PageHeaderSkeleton } from "@/components/admin/skeletons";

export default function LeadersLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action titleWidth="w-40" />
      <ListSkeleton rows={4} thumb="portrait" actions={3} />
    </div>
  );
}
