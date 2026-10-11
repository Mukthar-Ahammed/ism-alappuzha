import { FormSkeleton, PageHeaderSkeleton } from "@/components/admin/skeletons";
import { ProgramsLiveTabs } from "@/components/admin/ProgramsLiveTabs";

export default function LiveLoading() {
  return (
    <div className="space-y-6">
      <ProgramsLiveTabs active="live" />
      <PageHeaderSkeleton titleWidth="w-52" />
      <FormSkeleton fields={4} preview="card" />
    </div>
  );
}
