import { ListSkeleton, PageHeaderSkeleton } from "@/components/admin/skeletons";

export default function IssuesLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action titleWidth="w-32" />
      <ListSkeleton rows={4} thumb="portrait" actions={4} />
    </div>
  );
}
