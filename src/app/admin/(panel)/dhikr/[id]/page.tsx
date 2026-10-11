import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { DhikrEditor } from "@/features/dhikr/components/DhikrEditor";
import { dhikrIdParamSchema } from "@/features/dhikr/schemas";
import { assertDhikrFunctionsInstalled, getAdminDhikr } from "@/features/dhikr/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

export default async function DhikrEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin", "reviewer"] });
  const parsed = dhikrIdParamSchema.safeParse((await params).id);

  if (!parsed.success) {
    notFound();
  }

  const entry =
    parsed.data === "new"
      ? await orMissingMigration(assertDhikrFunctionsInstalled().then(() => null))
      : await orMissingMigration(getAdminDhikr(parsed.data));

  if (entry instanceof MissingMigrationError) {
    return <SetupRequired title="Dhikr and Dua" sqlFile={entry.sqlFile} />;
  }

  if (parsed.data !== "new" && !entry) {
    notFound();
  }

  const created = (await searchParams).created === "1";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/dhikr"
          className="text-sm font-semibold text-text-muted underline-offset-4 hover:text-primary hover:underline"
        >
          Back to dhikr and dua
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-primary">
          {entry ? `Edit ${entry.title}` : "Add dhikr or dua"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {entry?.status === "published"
            ? "This entry is live. Saved changes appear on the website straight away."
            : "Drafts never appear on the website. Mark the text as checked, then publish it from the list."}
        </p>
      </div>

      {created && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Draft saved. Mark it as checked and publish it from the list when it is ready.
        </p>
      )}

      <DhikrEditor key={entry?.id ?? "new"} entry={entry} />
    </div>
  );
}
