"use client";

import { useState } from "react";
import NavigationDrawer from "@/components/layout/navigation-drawer";
import Topbar from "@/components/layout/topbar";
import type { User } from "@/types/user";

export default function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Topbar user={user} onMenu={() => setOpen(true)} />
      <NavigationDrawer user={user} open={open} onClose={() => setOpen(false)} />
      <main className="min-w-0 lg:pl-64">{children}</main>
    </div>
  );
}
