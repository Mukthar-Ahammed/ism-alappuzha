import { ListSkeleton, PageHeaderSkeleton } from "@/components/admin/skeletons";

export default function NamazLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action titleWidth="w-56" />
      <ListSkeleton rows={6} actions={5} />
    </div>
  );
}
