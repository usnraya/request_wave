"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/manage/users", label: "Users" },
  { href: "/manage/teams", label: "Teams" },
  { href: "/manage/work-areas", label: "Work Areas" },
];

export default function ManageNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Manage data sections">
      {tabs.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "h-9 rounded-full px-4 text-[13px] font-medium leading-9 transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
