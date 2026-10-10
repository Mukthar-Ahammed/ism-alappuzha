import { ComingSoon } from "../ComingSoon";
import { requireAdmin } from "@/lib/auth/guard";

export default async function ProgramsPage() {
  await requireAdmin({ roles: ["admin"] });

  return (
    <ComingSoon
      title="Program scheduler coming soon"
      description="Upcoming, past, cancelled and duplicated programs will be managed from this screen."
    />
  );
}
