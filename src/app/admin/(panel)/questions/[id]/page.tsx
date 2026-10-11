import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardContent, CardHeader } from "@/components/admin/ui";
import { ArchiveRestoreDeleteActions, PublishQuestionDialog } from "@/features/questions/components/QuestionActions";
import { NotesForm } from "@/features/questions/components/NotesForm";
import { ReplyEditor } from "@/features/questions/components/ReplyEditor";
import { formatDateTime, lineBreakText } from "@/features/questions/format";
import { questionIdSchema } from "@/features/questions/schemas";
import { getQuestionDetail } from "@/features/questions/server/data";
import type { AuditLogRow, QuestionRow } from "@/features/questions/types";
import { requireAdmin } from "@/lib/auth/guard";

export default async function QuestionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const parsed = questionIdSchema.safeParse((await params).id);

  if (!parsed.success) {
    notFound();
  }

  const { question, timeline } = await getQuestionDetail(parsed.data);
  const query = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/admin"
            className="text-sm font-semibold text-text-muted underline-offset-4 hover:text-primary hover:underline"
          >
            Back to inbox
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold text-primary">
            {question.ticket_id}
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Submitted {formatDateTime(question.created_at)}
          </p>
        </div>
        <QuestionBadges question={question} />
      </div>

      {query.error === "stale" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          Someone else changed this question. Refresh the page before saving.
        </p>
      )}
      {query.error === "private-publish" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          Private questions cannot be published.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-6">
          <QuestionPanel question={question} />
          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-primary">Internal notes</h2>
            </CardHeader>
            <CardContent>
              <NotesForm question={question} />
            </CardContent>
          </Card>
          <Timeline timeline={timeline} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-primary">Reply</h2>
                <Badge tone="gold">Ticket status reply</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!question.email && (
                <p className="rounded-xl border border-secondary/30 bg-secondary-tint px-4 py-3 text-sm font-semibold text-primary">
                  This person did not leave an email. They will see this reply
                  only by entering their Ticket ID under Check Status.
                </p>
              )}
              <ReplyEditor question={question} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-bold text-primary">Publishing and state</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <PublishQuestionDialog question={question} />
              <ArchiveRestoreDeleteActions question={question} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuestionPanel({ question }: { question: QuestionRow }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-bold text-primary">Question</h2>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Meta label="Category" value={question.category} />
          <Meta label="Status" value={question.status} />
          <Meta label="Asker" value={question.name || "Anonymous"} />
          <Meta label="Email" value={question.email || "No email given"} />
        </dl>
        <div>
          <p className="text-sm font-bold text-primary">Original question</p>
          <div className="mt-3 space-y-2 rounded-xl border border-border-subtle bg-primary-tint p-4 font-malayalam text-base leading-8 text-text-main">
            {lineBreakText(question.question).map((line, index) => (
              <p key={`${index}-${line}`} dir="auto">
                {line}
              </p>
            ))}
          </div>
        </div>
        {question.answer && (
          <div>
            <p className="text-sm font-bold text-primary">Sent answer</p>
            <div className="mt-3 space-y-2 rounded-xl border border-border-subtle p-4 font-malayalam text-sm leading-7 text-text-main">
              {lineBreakText(question.answer).map((line, index) => (
                <p key={`${index}-${line}`} dir="auto">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuestionBadges({ question }: { question: QuestionRow }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>{question.status}</Badge>
      {question.is_private && <Badge tone="red">Private</Badge>}
      {question.is_published && <Badge tone="gold">Published</Badge>}
      {question.needs_review && <Badge tone="gold">Needs review</Badge>}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-text-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-primary">{value}</dd>
    </div>
  );
}

function Timeline({ timeline }: { timeline: AuditLogRow[] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-bold text-primary">Activity timeline</h2>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <p className="text-sm text-text-muted">No activity yet.</p>
        ) : (
          <ol className="space-y-4">
            {timeline.map((item) => (
              <li key={item.id} className="border-l-2 border-secondary/40 pl-4">
                <p className="text-sm font-bold text-primary">{item.action}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {formatDateTime(item.created_at)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
