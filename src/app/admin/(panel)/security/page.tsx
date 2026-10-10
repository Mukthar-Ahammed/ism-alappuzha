import Link from "next/link";
import { z } from "zod";
import { removeFactorAction } from "@/app/admin/auth-actions";
import { Badge, Button, Card, CardContent, CardHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const securitySearchParamsSchema = z.object({
  error: z.enum(["last-device", "remove"]).optional(),
  removed: z.string().optional(),
});

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsedParams = securitySearchParamsSchema.safeParse(await searchParams);
  const params = parsedParams.success ? parsedParams.data : {};
  const admin = await requireAdmin();
  const adminClient = createSupabaseAdminClient();
  const factors = await adminClient.auth.admin.mfa.listFactors({
    userId: admin.user.id,
  });
  const verifiedTotp = factors.error
    ? []
    : factors.data.factors.filter(
        (factor) =>
          factor.factor_type === "totp" && factor.status === "verified"
      );

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">
          Security devices
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Manage verified authenticator devices for this admin account.
        </p>
      </div>

      {params.error === "last-device" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          At least one verified authenticator device must remain.
        </p>
      )}
      {params.error === "remove" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not remove that device.
        </p>
      )}
      {params.removed && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Device removed.
        </p>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-primary">
            Verified devices
          </h2>
          <Badge tone={verifiedTotp.length > 1 ? "green" : "gold"}>
            {verifiedTotp.length} device{verifiedTotp.length === 1 ? "" : "s"}
          </Badge>
        </CardHeader>
        <CardContent className="divide-y divide-border-subtle p-0">
          {verifiedTotp.length === 0 ? (
            <p className="px-5 py-4 text-sm text-text-muted">
              No verified authenticator devices found.
            </p>
          ) : (
            verifiedTotp.map((factor) => (
              <div
                key={factor.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {factor.friendly_name || "Authenticator app"}
                  </p>
                  <p className="break-all text-xs text-text-muted">{factor.id}</p>
                </div>
                <form action={removeFactorAction}>
                  <input type="hidden" name="factorId" value={factor.id} />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={verifiedTotp.length <= 1}
                  >
                    Remove
                  </Button>
                </form>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Link href="/admin/login/setup?next=%2Fadmin%2Fsecurity">
        <Button type="button">Add another device</Button>
      </Link>
    </div>
  );
}
