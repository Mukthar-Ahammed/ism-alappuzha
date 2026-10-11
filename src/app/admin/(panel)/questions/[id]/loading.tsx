import { Card, CardContent, Skeleton } from "@/components/admin/ui";

export default function QuestionDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
