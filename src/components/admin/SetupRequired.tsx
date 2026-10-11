import { Card, CardContent } from "@/components/admin/ui";

/** Shown instead of a generic error when the page's migration has not been run yet. */
export function SetupRequired({ title, sqlFile }: { title: string; sqlFile: string }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <h1 className="font-display text-2xl font-semibold text-primary">{title}</h1>
        <p className="text-sm leading-6 text-text-muted">
          This screen needs a database update that has not been applied yet. In the Supabase
          dashboard, open SQL Editor, paste the contents of the file below, and click Run. Then
          refresh this page.
        </p>
        <p className="break-all rounded-xl border border-border-subtle bg-primary-tint px-4 py-3 font-mono text-sm text-primary">
          {sqlFile}
        </p>
      </CardContent>
    </Card>
  );
}
