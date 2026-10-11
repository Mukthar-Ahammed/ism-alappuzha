import { redirectIfSignedIn } from "@/lib/auth/guard";
import { sanitizeAdminNext } from "@/lib/auth/redirect";
import { AuthBrand } from "./AuthBrand";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = sanitizeAdminNext(params.next);

  // Server-side, before anything renders: a signed-in admin never sees the form.
  await redirectIfSignedIn(next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-tint px-4 py-10">
      <section className="w-full max-w-md rounded-[var(--radius-card)] border border-border-subtle bg-white p-6 shadow-soft sm:p-8">
        <AuthBrand />
        <h1 className="mb-6 font-display text-3xl font-semibold text-primary">
          Sign in
        </h1>
        <LoginForm next={next} />
      </section>
    </main>
  );
}
