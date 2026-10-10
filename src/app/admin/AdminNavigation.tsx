"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOutAction } from "@/app/admin/auth-actions";
import { cn } from "@/lib/utils/cn";
import type { AdminRole } from "@/lib/auth/types";

type NavigationItem = {
  href: string;
  label: string;
  roles: readonly AdminRole[];
  badge?: number;
};

export function AdminNavigation({
  role,
  pendingCount,
  children,
}: {
  role: AdminRole;
  pendingCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const items = [
    { href: "/admin", label: "Questions", roles: ["admin", "reviewer"], badge: pendingCount },
    { href: "/admin/issues", label: "Issues", roles: ["admin"] },
    { href: "/admin/live", label: "Live", roles: ["admin"] },
    { href: "/admin/programs", label: "Programs", roles: ["admin"] },
    { href: "/admin/dhikr", label: "Dhikr and Dua", roles: ["admin", "reviewer"] },
    { href: "/admin/team", label: "Team", roles: ["admin"] },
    { href: "/admin/security", label: "Security", roles: ["admin", "reviewer"] },
  ] satisfies NavigationItem[];
  const visibleItems = items.filter((item) => item.roles.includes(role));

  const sidebar = (
    <nav aria-label="Admin navigation" className="space-y-1">
      {visibleItems.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-10 items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
              active
                ? "bg-secondary-tint text-primary"
                : "text-text-muted hover:bg-primary-tint hover:text-primary"
            )}
          >
            <span>{item.label}</span>
            {typeof item.badge === "number" && item.badge > 0 && (
              <span className="min-w-6 rounded-full bg-secondary px-2 py-0.5 text-center text-xs font-bold text-primary">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="admin-shell min-h-screen bg-bg text-text-main">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-border-subtle p-2 text-primary lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open admin navigation"
            >
              <span aria-hidden="true" className="block h-0.5 w-5 bg-current" />
              <span aria-hidden="true" className="mt-1 block h-0.5 w-5 bg-current" />
              <span aria-hidden="true" className="mt-1 block h-0.5 w-5 bg-current" />
            </button>
            <Image
              src="/images/logo/ism-logo.png"
              alt="ISM Alappuzha"
              width={44}
              height={44}
              priority
              className="h-10 w-auto object-contain"
            />
            <span className="text-lg font-bold text-primary">Admin</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold capitalize text-primary transition hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              {role}
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-xl border border-border-subtle bg-bg p-2 shadow-floating"
              >
                <Link
                  role="menuitem"
                  href="/admin/security"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-text-muted hover:bg-primary-tint hover:text-primary"
                >
                  Security
                </Link>
                <form action={signOutAction}>
                  <button
                    role="menuitem"
                    type="submit"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-text-muted hover:bg-primary-tint hover:text-primary"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            className="absolute inset-0 bg-primary/30"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[min(20rem,86vw)] border-r border-border-subtle bg-bg p-4 shadow-floating">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-bold text-primary">Admin</span>
              <button
                type="button"
                className="rounded-lg border border-border-subtle px-3 py-2 text-sm font-semibold text-primary"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-border-subtle bg-bg px-4 py-6 lg:block">
          {sidebar}
        </aside>
        <main id="admin-content" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
