import { Badge, Card, CardContent, CardHeader } from "@/components/admin/ui";
import {
  AddAdminForm,
  AuthenticatorBadge,
  TeamMemberActions,
} from "@/features/team/components/TeamForms";
import { listTeamMembers } from "@/features/team/server/data";
import { requireAdmin } from "@/lib/auth/guard";

export default async function TeamPage() {
  const admin = await requireAdmin({ roles: ["admin"] });
  const members = await listTeamMembers();
  const currentAdminEmail = admin.user.email ?? "";
  const totalAdminsCount = members.filter((m) => m.role === "admin").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">
          Team
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
          Manage admin access, reviewer roles, temporary passwords and lost
          authenticator recovery.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-primary">Add admin</h2>
        </CardHeader>
        <CardContent>
          <AddAdminForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-primary">Admins</h2>
            <p className="mt-1 text-xs text-text-muted">
              Temporary passwords are shown only after creation or reset.
            </p>
          </div>
          <Badge tone="gold">
            {members.length} member{members.length === 1 ? "" : "s"}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <p className="px-5 py-4 text-sm text-text-muted">
              No admins found.
            </p>
          ) : (
            <div className="divide-y divide-border-subtle">
              {members.map((member) => {
                const isSelf =
                  Boolean(currentAdminEmail) &&
                  member.email.trim().toLowerCase() ===
                    currentAdminEmail.trim().toLowerCase();

                return (
                  <article
                    key={member.email}
                    className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(16rem,1fr)_minmax(28rem,2fr)]"
                  >
                    <div className="min-w-0 space-y-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-all text-sm font-bold text-primary">
                            {member.email}
                          </p>
                          {isSelf && (
                            <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                              You
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          Added{" "}
                          {new Date(member.createdAt).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={member.role === "admin" ? "gold" : "neutral"}>
                          {member.role}
                        </Badge>
                        <AuthenticatorBadge member={member} />
                      </div>
                    </div>
                    <TeamMemberActions
                      member={member}
                      currentAdminEmail={currentAdminEmail}
                      totalAdminsCount={totalAdminsCount}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

