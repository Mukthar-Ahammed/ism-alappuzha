import Image from "next/image";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, EmptyState, Pagination } from "@/components/admin/ui";
import { ImportLeadersButton } from "@/features/leaders/components/ImportLeadersButton";
import { LeaderRowActions } from "@/features/leaders/components/LeaderRowActions";
import { leaderListParamsSchema } from "@/features/leaders/schemas";
import { listAdminLeaders } from "@/features/leaders/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

export default async function LeadersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin"] });
  const { page } = leaderListParamsSchema.parse(await searchParams);
  const result = await orMissingMigration(listAdminLeaders(page));

  if (result instanceof MissingMigrationError) {
    return <SetupRequired title="Leaders" sqlFile={result.sqlFile} />;
  }

  const { leaders, totalPages, firstId, lastId } = result;
  const publishedCount = leaders.filter((leader) => leader.status === "published").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Leaders</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Edit the Leadership section on the homepage. Only published leaders are shown,
            in the order below. Drafts stay hidden.
          </p>
        </div>
        <Link
          href="/admin/leaders/new"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Add leader
        </Link>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-primary">All leaders</h2>
          <Badge tone={publishedCount > 0 ? "green" : "gold"}>
            {publishedCount} published on this page
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {leaders.length === 0 ? (
            <div className="space-y-4 p-5">
              <EmptyState
                title="No leaders yet"
                description="Add a leader, or import the sample leaders from the old website as drafts to edit or delete."
              />
              <ImportLeadersButton />
            </div>
          ) : (
            <ol className="divide-y divide-border-subtle">
              {leaders.map((leader) => (
                <li
                  key={leader.id}
                  className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    {leader.photo ? (
                      <Image
                        src={leader.photo.thumbUrl}
                        alt=""
                        width={48}
                        height={64}
                        placeholder="blur"
                        blurDataURL={leader.photo.blurDataUrl}
                        className="h-16 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-16 w-12 items-center justify-center rounded-lg bg-primary-tint text-xs font-bold text-primary"
                      >
                        {leader.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-primary">{leader.name}</p>
                      <p className="text-xs text-text-muted">{leader.role}</p>
                      <Badge className="mt-1" tone={leader.status === "published" ? "green" : "neutral"}>
                        {leader.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  <LeaderRowActions
                    id={leader.id}
                    name={leader.name}
                    status={leader.status}
                    isFirst={leader.id === firstId}
                    isLast={leader.id === lastId}
                  />
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} basePath="/admin/leaders" />
      )}

      {leaders.length > 0 && (
        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm text-text-muted">
              Import the sample leaders from the old website as drafts. Leaders already imported are skipped.
            </p>
            <ImportLeadersButton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
