import Link from "next/link";
import { notFound } from "next/navigation";
import { LeaderEditor } from "@/features/leaders/components/LeaderEditor";
import { leaderIdParamSchema } from "@/features/leaders/schemas";
import { getAdminLeader } from "@/features/leaders/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

export default async function LeaderEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin"] });
  const parsed = leaderIdParamSchema.safeParse((await params).id);

  if (!parsed.success) {
    notFound();
  }

  const leader =
    parsed.data === "new" ? null : await orMissingMigration(getAdminLeader(parsed.data));

  if (leader instanceof MissingMigrationError) {
    return <SetupRequired title="Leaders" sqlFile={leader.sqlFile} />;
  }

  if (parsed.data !== "new" && !leader) {
    notFound();
  }

  const created = (await searchParams).created === "1";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/leaders"
          className="text-sm font-semibold text-text-muted underline-offset-4 hover:text-primary hover:underline"
        >
          Back to leaders
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-primary">
          {leader ? `Edit ${leader.name}` : "Add leader"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {leader?.status === "published"
            ? "This leader is live. Saved changes appear on the homepage shortly."
            : "New and edited drafts stay hidden until you publish them from the leaders list."}
        </p>
      </div>

      {created && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Draft created. Publish it from the leaders list when it is ready.
        </p>
      )}

      <LeaderEditor key={leader?.id ?? "new"} leader={leader} />
    </div>
  );
}
