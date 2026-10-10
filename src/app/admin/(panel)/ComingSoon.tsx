import { EmptyState } from "@/components/admin/ui";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      className="min-h-[18rem] content-center"
    />
  );
}
