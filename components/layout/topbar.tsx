"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@/types/user";

export default function Topbar({ onMenu, user }: { onMenu: () => void; user: User }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isRequestsArea = pathname === "/requests" || pathname.startsWith("/requests/");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [open]);

  async function logout() {
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className={cn("sticky top-0 z-30 flex h-[68px] items-center bg-background/90 px-4 shadow-sm shadow-[#2e263d]/[0.04] backdrop-blur sm:px-6 lg:ml-64 lg:px-10", isRequestsArea ? "border-b-primary" : "border-b-transparent")}>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu /></Button>
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-foreground">Request Wave</Link>
      <span className="mx-3 hidden h-5 w-0.5 bg-primary sm:block" aria-hidden="true" />
      <div className="hidden text-[13px] font-medium text-muted-foreground sm:block">Design workspace</div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <div ref={menuRef} className="relative">
          <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-haspopup="menu" aria-label={`Open account menu for ${user.name}`} className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-[#126915] outline-none transition-colors hover:bg-primary/30 focus-visible:ring-2 focus-visible:ring-ring dark:text-[#b8fab8]">{user.initials}</button>
          {open && <div role="menu" className="absolute right-0 top-12 z-30 w-52 rounded-2xl border border-border bg-card p-2 shadow-lg"><div className="px-3 py-2"><p className="truncate text-sm font-medium text-card-foreground">{user.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{user.role === "PM" ? "Project manager" : "Viewer"}</p></div><button role="menuitem" type="button" onClick={logout} className="w-full cursor-pointer rounded-full px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">Log out</button></div>}
        </div>
      </div>
    </header>
  );
}
