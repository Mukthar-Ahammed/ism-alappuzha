import { EditorHeaderSkeleton, FormSkeleton } from "@/components/admin/skeletons";

export default function DhikrEditorLoading() {
  return (
    <div className="space-y-6">
      <EditorHeaderSkeleton />
      <FormSkeleton fields={6} preview="card" />
    </div>
  );
}
