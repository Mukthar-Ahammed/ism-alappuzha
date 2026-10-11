import Image from "next/image";
import Link from "next/link";
import { Badge, Card, CardContent, EmptyState } from "@/components/admin/ui";
import { ProgramRowActions } from "@/features/programs/components/ProgramRowActions";
import { programListParamsSchema, type ProgramTab } from "@/features/programs/schemas";
import { listAdminPrograms } from "@/features/programs/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { ProgramsLiveTabs } from "@/components/admin/ProgramsLiveTabs";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";
import { formatIstDateTime } from "@/lib/programs/schedule";
import { cn } from "@/lib/utils/cn";

const tabs: { key: ProgramTab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

const pagerClass = "rounded-full border border-border-subtle px-4 py-2 font-semibold text-primary";

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin"] });
  const { tab, page } = programListParamsSchema.parse(await searchParams);
  const result = await orMissingMigration(listAdminPrograms(tab, page, new Date()));

  if (result instanceof MissingMigrationError) {
    return (
      <div className="space-y-6">
        <ProgramsLiveTabs active="programs" />
        <SetupRequired title="Upcoming programs" sqlFile={result.sqlFile} />
      </div>
    );
  }

  const { programs, totalPages } = result;

  return (
    <div className="space-y-6">
      <ProgramsLiveTabs active="programs" />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Upcoming programs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Times are in Indian Standard Time. The homepage shows the earliest scheduled program
            until 3 hours after it starts.
          </p>
        </div>
        <Link
          href="/admin/programs/new"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Add program
        </Link>
      </div>

      <nav aria-label="Program lists" className="inline-flex rounded-xl border border-border-subtle bg-primary-tint p-1">
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={`/admin/programs?tab=${item.key}`}
            aria-current={tab === item.key ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
              tab === item.key ? "bg-bg text-primary shadow-soft" : "text-text-muted hover:text-primary"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {programs.length === 0 ? (
        <EmptyState
          title={tab === "upcoming" ? "No upcoming programs" : "No past programs"}
          description={tab === "upcoming" ? "Add a program to show it on the homepage." : "Programs move here 3 hours after they start."}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border-subtle">
              {programs.map((program) => (
                <li key={program.id} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    {program.poster && (
                      <Image
                        src={program.poster.thumbUrl}
                        alt=""
                        width={48}
                        height={60}
                        placeholder="blur"
                        blurDataURL={program.poster.blurDataUrl}
                        className="h-15 w-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {program.title}
                        {program.status === "cancelled" && (
                          <Badge tone="red" className="ml-2">Cancelled</Badge>
                        )}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatIstDateTime(program.startsAt)} IST · {program.speaker}
                      </p>
                      <p className="text-xs text-text-muted">{program.venue}</p>
                    </div>
                  </div>
                  <ProgramRowActions
                    id={program.id}
                    title={program.title}
                    speaker={program.speaker}
                    link={program.link}
                    cancelled={program.status === "cancelled"}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3 text-sm">
          <Link
            href={`/admin/programs?tab=${tab}&page=${Math.max(1, page - 1)}`}
            aria-disabled={page <= 1}
            className={cn(pagerClass, page <= 1 && "pointer-events-none opacity-50")}
          >
            Previous
          </Link>
          <span className="text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/admin/programs?tab=${tab}&page=${Math.min(totalPages, page + 1)}`}
            aria-disabled={page >= totalPages}
            className={cn(pagerClass, page >= totalPages && "pointer-events-none opacity-50")}
          >
            Next
          </Link>
        </nav>
      )}
    </div>
  );
}
