import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  EmptyState,
  MobileTableCards,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { formatDateTime, previewText } from "@/features/questions/format";
import type { QuestionFilters } from "@/features/questions/schemas";
import type { QuestionInboxData } from "@/features/questions/server/data";
import type { QuestionListItem } from "@/features/questions/types";

export function QuestionInbox({
  data,
  filters,
}: {
  data: QuestionInboxData;
  filters: QuestionFilters;
}) {
  if (data.items.length === 0) {
    return (
      <EmptyState
        title={
          filters.status === "pending"
            ? "No new questions"
            : "No questions match these filters"
        }
        description={
          filters.status === "pending"
            ? "Check back later or review drafts."
            : "Try changing the status, search text or filter options."
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <thead>
          <tr>
            <Th>Ticket</Th>
            <Th>Question</Th>
            <Th>Category</Th>
            <Th>Submitted</Th>
            <Th>Markers</Th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id} className="align-top">
              <Td>
                <Link
                  href={`/admin/questions/${item.id}`}
                  className="font-bold text-primary underline-offset-4 hover:underline"
                >
                  {item.ticket_id}
                </Link>
              </Td>
              <Td>
                <p className="line-clamp-2 max-w-2xl text-sm leading-6 text-text-main">
                  {previewText(item.question, 180)}
                </p>
              </Td>
              <Td>{item.category}</Td>
              <Td>{formatDateTime(item.created_at)}</Td>
              <Td>
                <QuestionMarkers item={item} />
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <MobileTableCards>
        {data.items.map((item) => (
          <Card key={item.id}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/admin/questions/${item.id}`}
                  className="font-bold text-primary underline-offset-4 hover:underline"
                >
                  {item.ticket_id}
                </Link>
                <Badge>{item.status}</Badge>
              </div>
              <p className="text-sm leading-6 text-text-main">
                {previewText(item.question, 180)}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <span>{item.category}</span>
                <span>{formatDateTime(item.created_at)}</span>
              </div>
              <QuestionMarkers item={item} />
            </CardContent>
          </Card>
        ))}
      </MobileTableCards>
    </div>
  );
}

function QuestionMarkers({ item }: { item: QuestionListItem }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone="neutral">{item.status}</Badge>
      {item.is_private && <Badge tone="red">Private</Badge>}
      {item.email && <Badge tone="green">Has email</Badge>}
      {item.is_published && <Badge tone="gold">Published</Badge>}
    </div>
  );
}
