import { ComingSoon } from "../ComingSoon";
import { requireAdmin } from "@/lib/auth/guard";

export default async function LivePage() {
  await requireAdmin({ roles: ["admin"] });

  return (
    <ComingSoon
      title="Live broadcast controls coming soon"
      description="The YouTube link parser, preview, go-live and end-broadcast controls will be built here."
    />
  );
}
