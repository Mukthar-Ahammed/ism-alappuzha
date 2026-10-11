import Link from "next/link";
import { Badge, Card, CardContent, EmptyState } from "@/components/admin/ui";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { NamazRowActions } from "@/features/namaz/components/NamazRowActions";
import { listAdminNamazSteps } from "@/features/namaz/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

export default async function NamazAdminPage() {
  await requireAdmin({ roles: ["admin", "reviewer"] });
  const steps = await orMissingMigration(listAdminNamazSteps());

  if (steps instanceof MissingMigrationError) {
    return <SetupRequired title="Namaz guide" sqlFile={steps.sqlFile} />;
  }

  const published = steps.filter((step) => step.status === "published");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Namaz guide</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            The step-by-step cards in the homepage &ldquo;How to Perform Namaz&rdquo; section, in this
            order. The first published step is shown as the featured card at the top; the rest
            follow on the timeline.
          </p>
          {steps.length > 0 && (
            <p className="mt-1 text-xs font-semibold text-text-muted">
              {published.length} of {steps.length} published
            </p>
          )}
        </div>
        <Link
          href="/admin/namaz/new"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Add step
        </Link>
      </div>

      {steps.length === 0 ? (
        <EmptyState
          title="No steps yet"
          description="Add the first step of the prayer. Publish it to show it in the Namaz guide."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ol className="divide-y divide-border-subtle">
              {steps.map((step, index) => {
                const guideNumber = published.findIndex((item) => item.id === step.id) + 1;

                return (
                  <li
                    key={step.id}
                    className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-bold text-primary"
                      >
                        {guideNumber > 0 ? guideNumber : "–"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary">{step.name}</p>
                        <p dir="rtl" lang="ar" className="mt-1 truncate font-arabic text-lg leading-relaxed text-primary/80">
                          {step.arabic}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge tone={step.status === "published" ? "green" : "neutral"}>
                            {step.status === "published" ? `Published · step ${guideNumber}` : "Draft"}
                          </Badge>
                          {guideNumber === 1 && <Badge tone="gold">Featured first card</Badge>}
                          {step.isRepeatNode && <Badge tone="gold">Repeat cycle</Badge>}
                        </div>
                      </div>
                    </div>
                    <NamazRowActions
                      id={step.id}
                      name={step.name}
                      published={step.status === "published"}
                      isFirst={index === 0}
                      isLast={index === steps.length - 1}
                    />
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
