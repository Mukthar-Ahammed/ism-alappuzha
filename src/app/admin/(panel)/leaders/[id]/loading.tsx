import { EditorHeaderSkeleton, FormSkeleton } from "@/components/admin/skeletons";

export default function LeaderEditorLoading() {
  return (
    <div className="space-y-6">
      <EditorHeaderSkeleton />
      <FormSkeleton fields={3} upload preview="portrait" />
    </div>
  );
}
