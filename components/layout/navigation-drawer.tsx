"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect } from "react";
import { ListChecks, PanelsTopLeft, Settings2, Users, X } from "lucide-react";
import cobee from "@/cobee/Cobee 02.png";
import timedoorLogo from "@/timedoor-academy-2022-black-green.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: PanelsTopLeft },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/requests", label: "Requests", icon: ListChecks },
];

export default function NavigationDrawer({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
}) {
  const pathname = usePathname();
  const items = user.role === "PM"
    ? [...navigation, { href: "/manage", label: "Manage data", icon: Settings2 }]
    : navigation;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[#2e263d]/35 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 shadow-xl shadow-[#2e263d]/[0.12] transition-transform duration-200 lg:translate-x-0",
          open && "translate-x-0",
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-1">
          <Link href="/dashboard" onClick={onClose} className="rounded-md bg-white px-1.5 py-1">
            <Image
              src={timedoorLogo}
              alt="Timedoor Academy"
              sizes="96px"
              className="h-auto w-24 max-w-full object-contain"
            />
          </Link>
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onClose} aria-label="Close navigation">
            <X />
          </Button>
        </div>
        <p className="mt-10 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/55">Workspace</p>
        <nav className="mt-3 space-y-1" aria-label="Workspace navigation">
          {items.map(({ href, label, icon: Icon }, index) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const iconColor = ["text-[#16b1ff]", "text-[#ffb400]", "text-primary", "text-[#8a8d93]"][index] ?? "text-primary";
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm",
                )}
              >
                {active && <span className={cn("absolute left-0 h-6 w-1 rounded-full", href === "/requests" ? "bg-primary" : "bg-primary")} aria-hidden="true" />}
                <Icon className={cn("size-4 transition-colors", active ? "text-primary" : iconColor)} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar-accent/60 px-3 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-sidebar-foreground/55">Keep it moving</p>
          <p className="mt-1 max-w-[125px] text-xs leading-5 text-sidebar-foreground/75">Your design queue is in good hands.</p>
          <Image src={cobee} alt="" sizes="100px" className="ml-auto mt-1 block h-auto w-24" />
        </div>
      </aside>
    </>
  );
}
