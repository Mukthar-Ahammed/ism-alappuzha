import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { IssueEditor } from "@/features/issues/components/IssueEditor";
import { issueIdParamSchema } from "@/features/issues/schemas";
import { getAdminIssue } from "@/features/issues/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

export default async function IssueEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin"] });
  const parsed = issueIdParamSchema.safeParse((await params).id);

  if (!parsed.success) {
    notFound();
  }

  const issue =
    parsed.data === "new" ? null : await orMissingMigration(getAdminIssue(parsed.data));

  if (issue instanceof MissingMigrationError) {
    return <SetupRequired title="Issues" sqlFile={issue.sqlFile} />;
  }

  if (parsed.data !== "new" && !issue) {
    notFound();
  }

  const created = (await searchParams).created === "1";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/issues"
          className="text-sm font-semibold text-text-muted underline-offset-4 hover:text-primary hover:underline"
        >
          Back to issues
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-primary">
          {issue ? `Edit ${issue.title}` : "Add issue"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {issue?.status === "published"
            ? "This issue is live. Saved changes appear on the homepage straight away."
            : "Drafts never appear on the website. Publish and feature the issue from the issues list."}
        </p>
      </div>

      {created && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Draft saved. Publish it from the issues list when it is ready.
        </p>
      )}

      <IssueEditor key={issue?.id ?? "new"} issue={issue} />
    </div>
  );
}
