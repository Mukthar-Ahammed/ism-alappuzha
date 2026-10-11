import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgramEditor } from "@/features/programs/components/ProgramEditor";
import { programIdParamSchema } from "@/features/programs/schemas";
import { getAdminProgram } from "@/features/programs/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

export default async function ProgramEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin"] });
  const parsed = programIdParamSchema.safeParse((await params).id);

  if (!parsed.success) {
    notFound();
  }

  const program =
    parsed.data === "new" ? null : await orMissingMigration(getAdminProgram(parsed.data));

  if (program instanceof MissingMigrationError) {
    return <SetupRequired title="Upcoming programs" sqlFile={program.sqlFile} />;
  }

  if (parsed.data !== "new" && !program) {
    notFound();
  }

  const query = await searchParams;
  const notice =
    query.created === "1"
      ? "Program added. It shows on the homepage when it is the earliest upcoming program."
      : query.duplicated === "1"
        ? "Copy created. Change the date and save."
        : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/programs"
          className="text-sm font-semibold text-text-muted underline-offset-4 hover:text-primary hover:underline"
        >
          Back to programs
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-primary">
          {program ? `Edit ${program.title}` : "Add program"}
        </h1>
      </div>

      {notice && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {notice}
        </p>
      )}

      <ProgramEditor key={program?.id ?? "new"} program={program} />
    </div>
  );
}
