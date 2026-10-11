import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { NamazStepEditor } from "@/features/namaz/components/NamazStepEditor";
import { namazIdParamSchema } from "@/features/namaz/schemas";
import { listAdminNamazSteps } from "@/features/namaz/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

export default async function NamazStepEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin", "reviewer"] });
  const parsed = namazIdParamSchema.safeParse((await params).id);

  if (!parsed.success) {
    notFound();
  }

  // The whole (short) list gives the editor its place in the guide for the preview.
  const steps = await orMissingMigration(listAdminNamazSteps());

  if (steps instanceof MissingMigrationError) {
    return <SetupRequired title="Namaz guide" sqlFile={steps.sqlFile} />;
  }

  const step = parsed.data === "new" ? null : (steps.find((item) => item.id === parsed.data) ?? null);

  if (parsed.data !== "new" && !step) {
    notFound();
  }

  const published = steps.filter((item) => item.status === "published");
  const publishedIndex = step ? published.findIndex((item) => item.id === step.id) : -1;
  const stepNumber = publishedIndex >= 0 ? publishedIndex + 1 : published.length + 1;
  const totalSteps = publishedIndex >= 0 ? published.length : published.length + 1;
  const created = (await searchParams).created === "1";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/namaz"
          className="text-sm font-semibold text-text-muted underline-offset-4 hover:text-primary hover:underline"
        >
          Back to the Namaz guide
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-primary">
          {step ? `Edit ${step.name}` : "Add step"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {step?.status === "published"
            ? "This step is live. Saved changes appear on the homepage straight away."
            : "New steps are added at the end as drafts. Move and publish them from the list."}
        </p>
      </div>

      {created && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Draft saved. Publish it from the list to show it in the guide.
        </p>
      )}

      <NamazStepEditor key={step?.id ?? "new"} step={step} stepNumber={stepNumber} totalSteps={totalSteps} />
    </div>
  );
}
