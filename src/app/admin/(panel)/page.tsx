import { Badge, Card, CardContent, EmptyState } from "@/components/admin/ui";
import { getAdminDashboardCounts } from "@/lib/admin/dashboard";

const cards = [
  ["Pending questions", "pending"],
  ["Draft replies", "draft"],
  ["Answered", "answered"],
  ["Archived", "archived"],
  ["Published public Q&A", "published"],
] as const;

export default async function AdminDashboardPage() {
  const counts = await getAdminDashboardCounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">
            Questions dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Live database counts for question handling and public content.
          </p>
        </div>
        <Badge tone={counts.questions.pending > 0 ? "gold" : "green"}>
          {counts.questions.pending} pending
        </Badge>
      </div>

      <section
        aria-label="Question status counts"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        {cards.map(([label, key]) => (
          <Card key={key}>
            <CardContent>
              <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
                {label}
              </p>
              <p className="mt-3 text-3xl font-bold text-primary">
                {counts.questions[key]}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section
        aria-label="Content counts"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              Published issues
            </p>
            <p className="mt-3 text-3xl font-bold text-primary">{counts.issues}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              Live broadcasts
            </p>
            <p className="mt-3 text-3xl font-bold text-primary">{counts.live}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              Scheduled programs
            </p>
            <p className="mt-3 text-3xl font-bold text-primary">
              {counts.programs}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">
              Published dhikr
            </p>
            <p className="mt-3 text-3xl font-bold text-primary">{counts.dhikr}</p>
          </CardContent>
        </Card>
      </section>

      <EmptyState
        title="Question inbox comes next"
        description="This phase establishes the shell and design system. The inbox table, filters and answer workflow will use the primitives added here."
      />
    </div>
  );
}
