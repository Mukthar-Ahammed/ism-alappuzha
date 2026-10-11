import { AdminNavigation } from "@/app/admin/AdminNavigation";
import type { AdminDashboardCounts } from "@/lib/admin/dashboard";
import type { AdminContext } from "@/lib/auth/types";

export function AdminShell({
  admin,
  counts,
  children,
}: {
  admin: AdminContext;
  counts: AdminDashboardCounts;
  children: React.ReactNode;
}) {
  return (
    <AdminNavigation
      role={admin.role}
      pendingCount={counts.questions.pending}
      mustChangePassword={admin.mustChangePassword}
    >
      {children}
    </AdminNavigation>
  );
}
