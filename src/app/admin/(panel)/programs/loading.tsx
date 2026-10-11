import { ListSkeleton, PageHeaderSkeleton } from "@/components/admin/skeletons";
import { ProgramsLiveTabs } from "@/components/admin/ProgramsLiveTabs";

export default function ProgramsLoading() {
  return (
    <div className="space-y-6">
      <ProgramsLiveTabs active="programs" />
      <PageHeaderSkeleton action titleWidth="w-40" />
      <ListSkeleton rows={4} thumb="portrait" actions={3} />
    </div>
  );
}
