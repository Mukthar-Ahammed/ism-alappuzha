import { ComingSoon } from "../ComingSoon";
import { requireAdmin } from "@/lib/auth/guard";

export default async function TeamPage() {
  await requireAdmin({ roles: ["admin"] });

  return (
    <ComingSoon
      title="Team management coming soon"
      description="Admin allowlist, reviewer roles and lost-authenticator recovery controls will be built here."
    />
  );
}
