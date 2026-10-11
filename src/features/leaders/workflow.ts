import type { Leader } from "@/lib/types/leader";

const rasterPhotoPattern = /^\/images\/[A-Za-z0-9/_-]+\.(?:jpe?g|png|webp)$/i;

export type LeaderImportEntry = {
  import_key: string;
  name: string;
  role: string;
  bio: string;
  linkedin_url: string;
  instagram_url: string;
  /** Local raster photo under public/ to run through the pipeline; SVG placeholders are skipped. */
  sourcePhoto: string | null;
};

export function buildLeaderImportEntries(leaders: readonly Leader[]): LeaderImportEntry[] {
  return leaders.map((leader) => ({
    import_key: `bundled:${leader.id}`,
    name: leader.name,
    role: leader.role,
    bio: leader.bio,
    linkedin_url: leader.linkedin ?? "",
    instagram_url: leader.instagram ?? "",
    sourcePhoto: leader.photo && rasterPhotoPattern.test(leader.photo) ? leader.photo : null,
  }));
}

/** Turns an RPC error into a message an admin can act on. */
export function leaderErrorMessage(message: string | undefined): string {
  if (message === "leader_not_found") {
    return "That leader no longer exists. Refresh the page.";
  }

  return "Could not save this change. Please refresh and try again.";
}
