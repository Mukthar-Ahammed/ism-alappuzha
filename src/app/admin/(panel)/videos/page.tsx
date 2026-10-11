import Image from "next/image";
import Link from "next/link";
import { Badge, Card, CardContent, EmptyState, Pagination } from "@/components/admin/ui";
import { ProgramsLiveTabs } from "@/components/admin/ProgramsLiveTabs";
import { SetupRequired } from "@/components/admin/SetupRequired";
import { VideoRowActions } from "@/features/videos/components/VideoRowActions";
import { videoListParamsSchema } from "@/features/videos/schemas";
import { formatVideoDate, listAdminVideos } from "@/features/videos/server/data";
import { requireAdmin } from "@/lib/auth/guard";
import { livePlatformLabels, youtubeThumbnailUrl } from "@/lib/live-links";
import { MissingMigrationError, orMissingMigration } from "@/lib/supabase/schema-errors";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin({ roles: ["admin"] });
  const { page } = videoListParamsSchema.parse(await searchParams);
  const result = await orMissingMigration(listAdminVideos(page));

  return (
    <div className="space-y-6">
      <ProgramsLiveTabs active="videos" />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Videos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            Recorded speeches and videos for the homepage &ldquo;Speeches &amp; Videos&rdquo;
            section. Only published videos are shown, newest first.
          </p>
        </div>
        <Link
          href="/admin/videos/new"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Add video
        </Link>
      </div>

      {result instanceof MissingMigrationError ? (
        <SetupRequired title="Videos" sqlFile={result.sqlFile} />
      ) : result.videos.length === 0 ? (
        <EmptyState
          title="No videos yet"
          description="Add a YouTube, Facebook or Instagram video to show it on the homepage."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border-subtle">
              {result.videos.map((video) => {
                const thumbnail =
                  video.thumbnail?.thumbUrl ??
                  (video.youtubeId ? youtubeThumbnailUrl(video.youtubeId) : null);

                return (
                  <li
                    key={video.id}
                    className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt=""
                          width={96}
                          height={54}
                          className="h-[54px] w-24 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div aria-hidden="true" className="h-[54px] w-24 shrink-0 rounded-lg bg-primary-tint" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-primary">{video.title}</p>
                        <p className="text-xs text-text-muted">
                          {livePlatformLabels[video.platform]} · {video.category} ·{" "}
                          {formatVideoDate(video.recordedOn)}
                          {video.speaker ? ` · ${video.speaker}` : ""}
                        </p>
                        <Badge className="mt-1" tone={video.status === "published" ? "green" : "neutral"}>
                          {video.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                    <VideoRowActions
                      id={video.id}
                      title={video.title}
                      published={video.status === "published"}
                    />
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {!(result instanceof MissingMigrationError) && result.totalPages > 1 && (
        <Pagination page={page} totalPages={result.totalPages} basePath="/admin/videos" />
      )}
    </div>
  );
}
