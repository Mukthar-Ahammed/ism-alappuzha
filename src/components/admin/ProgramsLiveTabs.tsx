import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { key: "programs", href: "/admin/programs", label: "Programs" },
  { key: "live", href: "/admin/live", label: "Live broadcast" },
  { key: "videos", href: "/admin/videos", label: "Videos" },
] as const;

/** Sub-navigation for the "Programs & Live" admin area. */
export function ProgramsLiveTabs({ active }: { active: (typeof tabs)[number]["key"] }) {
  return (
    <nav aria-label="Programs and live" className="border-b border-border-subtle">
      <ul className="-mb-px flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <li key={tab.key}>
            <Link
              href={tab.href}
              aria-current={active === tab.key ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center border-b-2 px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
                active === tab.key
                  ? "border-secondary text-primary"
                  : "border-transparent text-text-muted hover:text-primary"
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
