import { InboxSkeleton, PageHeaderSkeleton } from "@/components/admin/skeletons";

export default function QuestionsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-40" />
      <InboxSkeleton />
    </div>
  );
}
