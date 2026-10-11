import { EditorHeaderSkeleton, FormSkeleton } from "@/components/admin/skeletons";

export default function VideoEditorLoading() {
  return (
    <div className="space-y-6">
      <EditorHeaderSkeleton />
      <FormSkeleton fields={4} upload preview="card" />
    </div>
  );
}
