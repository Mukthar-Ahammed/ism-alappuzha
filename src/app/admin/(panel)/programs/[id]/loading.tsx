import { EditorHeaderSkeleton, FormSkeleton } from "@/components/admin/skeletons";

export default function ProgramEditorLoading() {
  return (
    <div className="space-y-6">
      <EditorHeaderSkeleton />
      <FormSkeleton fields={6} upload preview="card" />
    </div>
  );
}
