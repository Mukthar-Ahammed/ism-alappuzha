import Link from "next/link";
import { Badge, Card, CardContent, EmptyState } from "@/components/admin/ui";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { dhikrEntryCategories } from "@/data/dhikr";
import { DhikrRowActions } from "@/features/dhikr/components/DhikrRowActions";
import { listAdminDhikr } from "@/features/dhikr/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

const checkedDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export default async function DhikrAdminPage() {
  await requireAdmin({ roles: ["admin", "reviewer"] });
  const entries = await orMissingMigration(listAdminDhikr());

  if (entries instanceof MissingMigrationError) {
    return <SetupRequired title="Dhikr and Dua" sqlFile={entries.sqlFile} />;
  }

  const groups = dhikrEntryCategories
    .map((category) => ({ category, items: entries.filter((entry) => entry.category === category) }))
    .filter((group) => group.items.length > 0);
  const publishedCount = entries.filter((entry) => entry.status === "published").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Dhikr and Dua</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            The library on the homepage and the /dhikr page. Each entry must be marked as checked
            before it can be published. The homepage shows the first six, in this order.
          </p>
          {entries.length > 0 && (
            <p className="mt-1 text-xs font-semibold text-text-muted">
              {publishedCount} of {entries.length} published
            </p>
          )}
        </div>
        <Link
          href="/admin/dhikr/new"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Add dhikr or dua
        </Link>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No dhikr yet"
          description="Add an entry, have it checked, then publish it to show it on the website."
        />
      ) : (
        groups.map((group) => (
          <section key={group.category} aria-labelledby={`dhikr-group-${group.category}`} className="space-y-2">
            <h2
              id={`dhikr-group-${group.category}`}
              className="text-sm font-bold uppercase tracking-wide text-text-muted"
            >
              {group.category}
            </h2>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border-subtle">
                  {group.items.map((entry, index) => (
                    <li
                      key={entry.id}
                      className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary">{entry.title}</p>
                        <p
                          dir="rtl"
                          lang="ar"
                          className="mt-1 truncate font-arabic text-lg leading-relaxed text-primary/80"
                        >
                          {entry.arabic}
                        </p>
                        <p className="text-xs text-text-muted">
                          {entry.reference ?? "No source"}
                          {entry.repeatCount && entry.repeatCount > 1 ? ` · ${entry.repeatCount}×` : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Badge tone={entry.status === "published" ? "green" : "neutral"}>
                            {entry.status === "published" ? "Published" : "Draft"}
                          </Badge>
                          {entry.reviewedBy ? (
                            <Badge tone="gold">
                              Checked by {entry.reviewedBy}
                              {entry.reviewedAt ? ` · ${checkedDate.format(new Date(entry.reviewedAt))}` : ""}
                            </Badge>
                          ) : (
                            <Badge tone="red">Not checked</Badge>
                          )}
                        </div>
                      </div>
                      <DhikrRowActions
                        id={entry.id}
                        title={entry.title}
                        checked={Boolean(entry.reviewedBy)}
                        published={entry.status === "published"}
                        isFirst={index === 0}
                        isLast={index === group.items.length - 1}
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        ))
      )}
    </div>
  );
}
