import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/permissions";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
