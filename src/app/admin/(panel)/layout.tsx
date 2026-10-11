import { AdminShell } from "@/app/admin/AdminShell";
import { getAdminDashboardCounts } from "@/lib/admin/dashboard";
import { requireAdmin } from "@/lib/auth/guard";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [admin, counts] = await Promise.all([
    requireAdmin({ allowPendingPasswordChange: true }),
    getAdminDashboardCounts(),
  ]);

  return (
    <AdminShell admin={admin} counts={counts}>
      {children}
    </AdminShell>
  );
}
