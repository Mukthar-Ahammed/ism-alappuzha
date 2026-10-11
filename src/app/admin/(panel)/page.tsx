import { Badge } from "@/components/admin/ui";
import { InboxPagination } from "@/features/questions/components/InboxPagination";
import { QuestionFilters } from "@/features/questions/components/QuestionFilters";
import { QuestionInbox } from "@/features/questions/components/QuestionInbox";
import { questionFiltersSchema } from "@/features/questions/schemas";
import { listQuestions } from "@/features/questions/server/data";
import { requireAdmin } from "@/lib/auth/guard";

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const filters = questionFiltersSchema.parse(await searchParams);
  const data = await listQuestions(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">
            Question inbox
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Review public submissions, draft replies, send answers and manage
            publishing.
          </p>
        </div>
        <Badge tone={data.counts.pending > 0 ? "gold" : "green"}>
          {data.counts.pending} pending
        </Badge>
      </div>

      <QuestionFilters filters={filters} counts={data.counts} />

      <div className="flex items-center justify-between gap-3 text-sm text-text-muted">
        <span>
          {data.totalCount} question{data.totalCount === 1 ? "" : "s"}
        </span>
        <span>25 per page</span>
      </div>

      <QuestionInbox data={data} filters={filters} />

      <InboxPagination filters={filters} totalPages={data.totalPages} />
    </div>
  );
}
