import { ComingSoon } from "../ComingSoon";
import { requireAdmin } from "@/lib/auth/guard";

export default async function IssuesPage() {
  await requireAdmin({ roles: ["admin"] });

  return (
    <ComingSoon
      title="Issues manager coming soon"
      description="The magazine issue list, cover upload, PDF upload and featured issue controls will be built here."
    />
  );
}
