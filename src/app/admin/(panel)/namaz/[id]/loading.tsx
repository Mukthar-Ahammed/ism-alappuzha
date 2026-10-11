import { EditorHeaderSkeleton, FormSkeleton } from "@/components/admin/skeletons";

export default function NamazEditorLoading() {
  return (
    <div className="space-y-6">
      <EditorHeaderSkeleton />
      <FormSkeleton fields={7} preview="card" />
    </div>
  );
}
