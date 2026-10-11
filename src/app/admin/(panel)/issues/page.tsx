import Image from "next/image";
import Link from "next/link";
import { Badge, Card, CardContent, EmptyState, Pagination } from "@/components/admin/ui";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { formatBytes } from "@/components/admin/upload-client";
import { IssueRowActions } from "@/features/issues/components/IssueRowActions";
import { issueListParamsSchema } from "@/features/issues/schemas";
import { listAdminIssues } from "@/features/issues/server/data";
import { issueMonthYear } from "@/features/issues/workflow";
import { requireAdmin } from "@/lib/auth/guard";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin"] });
  const { page } = issueListParamsSchema.parse(await searchParams);
  const result = await orMissingMigration(listAdminIssues(page));

  if (result instanceof MissingMigrationError) {
    return <SetupRequired title="Issues" sqlFile={result.sqlFile} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Issues</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            The magazine in the homepage &ldquo;Latest Issue&rdquo; section. The featured issue
            is shown large; other published issues appear in the archive, newest first.
          </p>
        </div>
        <Link
          href="/admin/issues/new"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Add issue
        </Link>
      </div>

      {result.issues.length === 0 ? (
        <EmptyState
          title="No issues yet"
          description="Add an issue with its cover and PDF, then publish and feature it."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border-subtle">
              {result.issues.map((issue) => {
                const { month, year } = issueMonthYear(issue.issueDate);

                return (
                  <li
                    key={issue.id}
                    className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      {issue.cover ? (
                        <Image
                          src={issue.cover.thumbUrl}
                          alt=""
                          width={48}
                          height={64}
                          placeholder="blur"
                          blurDataURL={issue.cover.blurDataUrl}
                          className="h-16 w-12 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div aria-hidden="true" className="h-16 w-12 shrink-0 rounded-md bg-primary-tint" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-primary">{issue.title}</p>
                        <p className="text-xs text-text-muted">
                          {month} {year}
                          {issue.pdf.bytes > 0 ? ` · PDF ${formatBytes(issue.pdf.bytes)}` : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge tone={issue.status === "published" ? "green" : "neutral"}>
                            {issue.status === "published" ? "Published" : "Draft"}
                          </Badge>
                          {issue.isFeatured && <Badge tone="gold">Featured</Badge>}
                        </div>
                      </div>
                    </div>
                    <IssueRowActions
                      id={issue.id}
                      title={issue.title}
                      pdfUrl={issue.pdf.url}
                      published={issue.status === "published"}
                      featured={issue.isFeatured}
                    />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {result.totalPages > 1 && (
        <Pagination page={page} totalPages={result.totalPages} basePath="/admin/issues" />
      )}
    </div>
  );
}
