import { ListSkeleton, PageHeaderSkeleton } from "@/components/admin/skeletons";
import { ProgramsLiveTabs } from "@/components/admin/ProgramsLiveTabs";

export default function VideosLoading() {
  return (
    <div className="space-y-6">
      <ProgramsLiveTabs active="videos" />
      <PageHeaderSkeleton action titleWidth="w-36" />
      <ListSkeleton rows={4} thumb="video" actions={3} />
    </div>
  );
}
