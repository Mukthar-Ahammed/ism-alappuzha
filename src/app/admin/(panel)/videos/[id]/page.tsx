import Link from "next/link";
import { notFound } from "next/navigation";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { VideoEditor } from "@/features/videos/components/VideoEditor";
import { videoIdParamSchema, videoPrefillSchema } from "@/features/videos/schemas";
import { getAdminVideo } from "@/features/videos/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

export default async function VideoEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin"] });
  const parsed = videoIdParamSchema.safeParse((await params).id);

  if (!parsed.success) {
    notFound();
  }

  const video =
    parsed.data === "new" ? null : await orMissingMigration(getAdminVideo(parsed.data));

  if (video instanceof MissingMigrationError) {
    return <SetupRequired title="Videos" sqlFile={video.sqlFile} />;
  }

  if (parsed.data !== "new" && !video) {
    notFound();
  }

  const query = await searchParams;
  const prefill = videoPrefillSchema.parse(query);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/admin/videos"
          className="text-sm font-semibold text-text-muted underline-offset-4 hover:text-primary hover:underline"
        >
          Back to videos
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-primary">
          {video ? `Edit ${video.title}` : "Add video"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          New videos are saved as drafts. Publish them from the videos list.
        </p>
      </div>

      {query.created === "1" && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Draft saved. Publish it from the videos list when it is ready.
        </p>
      )}

      <VideoEditor key={video?.id ?? "new"} video={video} prefill={prefill} />
    </div>
  );
}
