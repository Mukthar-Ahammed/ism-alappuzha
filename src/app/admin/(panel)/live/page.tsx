import { livePrefillSchema } from "@/features/live/schemas";
import { LiveControls } from "@/features/live/components/LiveControls";
import { getAdminLiveStatus, getRecentLiveLinks } from "@/features/live/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { ProgramsLiveTabs } from "@/components/admin/ProgramsLiveTabs";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";
import { livePlatformLabels } from "@/lib/live-links";

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin"] });
  const prefill = livePrefillSchema.parse(await searchParams);
  const [status, history] = await Promise.all([
    orMissingMigration(getAdminLiveStatus()),
    getRecentLiveLinks(),
  ]);

  if (status instanceof MissingMigrationError) {
    return (
      <div className="space-y-6">
        <ProgramsLiveTabs active="live" />
        <SetupRequired title="Live broadcast" sqlFile={status.sqlFile} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <ProgramsLiveTabs active="live" />
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Live broadcast</h1>
        <p
          role="status"
          className={
            status.isLive
              ? "mt-3 inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800"
              : "mt-3 inline-flex rounded-full border border-border-subtle bg-primary-tint px-4 py-2 text-sm font-semibold text-primary"
          }
        >
          {status.isLive
            ? `Homepage is showing: Live now on ${livePlatformLabels[status.platform]}: ${status.title}`
            : "Homepage is showing: Next program"}
        </p>
      </div>

      <LiveControls isLive={status.isLive} history={history} prefill={prefill} />
    </div>
  );
}
