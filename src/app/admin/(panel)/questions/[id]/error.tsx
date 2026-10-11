"use client";

import { Button, Card, CardContent } from "@/components/admin/ui";

export default function QuestionDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-primary">
          Could not load this question
        </h1>
        <p className="text-sm text-text-muted">
          Refresh the screen and try again.
        </p>
        <Button type="button" onClick={reset}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
