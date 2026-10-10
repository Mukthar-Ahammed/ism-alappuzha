import { redirect } from "next/navigation";
import { sanitizeAdminNext } from "@/lib/auth/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthBrand } from "../AuthBrand";
import { VerifyForm } from "./VerifyForm";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = sanitizeAdminNext(params.next);
  const supabase = await createSupabaseServerClient();
  const user = await supabase.auth.getUser();

  if (user.error || !user.data.user) {
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }

  const factors = await supabase.auth.mfa.listFactors();

  if (factors.error) {
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }

  const factor = factors.data.totp[0];

  if (!factor) {
    redirect(`/admin/login/setup?next=${encodeURIComponent(next)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-tint px-4 py-10">
      <section className="w-full max-w-md rounded-[var(--radius-card)] border border-border-subtle bg-white p-6 shadow-soft sm:p-8">
        <AuthBrand />
        <h1 className="mb-6 font-display text-3xl font-semibold text-primary">
          Enter code
        </h1>
        <VerifyForm factorId={factor.id} next={next} />
      </section>
    </main>
  );
}
