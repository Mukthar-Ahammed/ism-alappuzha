import { Card, CardContent, Skeleton } from "@/components/admin/ui";
import { cn } from "@/lib/utils/cn";

// Loading placeholders shaped like the real admin pages, so content replaces them
// without the layout jumping. Used by the route loading.tsx files.

/** Title, one line of description and (optionally) the primary action button. */
export function PageHeaderSkeleton({ action = false, titleWidth = "w-48" }: { action?: boolean; titleWidth?: string }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <p role="status" className="sr-only">Loading…</p>
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className={cn("h-9", titleWidth)} />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
      </div>
      {action && <Skeleton className="h-10 w-36 rounded-full" aria-hidden="true" />}
    </div>
  );
}

/** Back link, title and hint above an editor form. */
export function EditorHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <p role="status" className="sr-only">Loading…</p>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  );
}

const thumbClass = {
  portrait: "h-16 w-12 rounded-lg",
  video: "h-[54px] w-24 rounded-lg",
  avatar: "h-12 w-12 rounded-full",
  none: "",
} as const;

/** A list card of rows (issues, videos, leaders, programs, dhikr, team). */
export function ListSkeleton({
  rows = 4,
  thumb = "none",
  actions = 3,
}: {
  rows?: number;
  thumb?: keyof typeof thumbClass;
  actions?: number;
}) {
  return (
    <Card aria-hidden="true">
      <CardContent className="p-0">
        <ul className="divide-y divide-border-subtle">
          {Array.from({ length: rows }, (_, row) => (
            <li key={row} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                {thumb !== "none" && <Skeleton className={cn("shrink-0", thumbClass[thumb])} />}
                <div className="space-y-2 pt-1">
                  {/* Varying widths read as real titles rather than a grid of bars */}
                  <Skeleton className={cn("h-4", ["w-52", "w-40", "w-60", "w-44"][row % 4])} />
                  <Skeleton className="h-3 w-32" />
                  <div className="flex gap-1.5 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    {row % 2 === 0 && <Skeleton className="h-5 w-20 rounded-full" />}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: actions }, (_, action) => (
                  <Skeleton key={action} className={cn("h-10 rounded-full", action === 0 ? "w-16" : "w-24")} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/** An editor form: labelled fields, optional upload area, save button, optional preview column. */
export function FormSkeleton({
  fields = 4,
  upload = false,
  preview = false,
}: {
  fields?: number;
  upload?: boolean;
  preview?: "portrait" | "card" | false;
}) {
  return (
    <div className={cn("grid gap-6", preview && "lg:grid-cols-[minmax(0,1fr)_18rem]")} aria-hidden="true">
      <Card>
        <CardContent className="space-y-5">
          {Array.from({ length: fields }, (_, field) => (
            <div key={field} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className={cn("w-full", field === 1 ? "h-24" : "h-10")} />
            </div>
          ))}
          {upload && <Skeleton className="h-40 w-full" />}
          <Skeleton className="h-10 w-32 rounded-full" />
        </CardContent>
      </Card>
      {preview && (
        <div className="space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className={cn("w-full", preview === "portrait" ? "aspect-[3/4]" : "h-72")} />
        </div>
      )}
    </div>
  );
}

/** The questions inbox: filter chips, counts line and question cards. */
export function InboxSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex flex-wrap gap-2">
        {[20, 24, 28, 20, 24].map((width, chip) => (
          <Skeleton key={chip} className="h-9 rounded-full" style={{ width: `${width * 4}px` }} />
        ))}
      </div>
      <Skeleton className="h-4 w-40" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className={cn("h-4", item % 2 ? "w-2/3" : "w-4/5")} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
