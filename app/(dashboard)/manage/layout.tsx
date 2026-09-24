import { requireRole } from "@/lib/permissions";
import ManageNav from "@/components/manage/manage-nav";

export default async function ManageLayout({ children }: LayoutProps<"/manage">) {
  await requireRole("PM");
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-medium tracking-tight">Manage data</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Manage people, access, and request work areas.
        </p>
      </header>
      <p className="mt-6 rounded-2xl border border-[#ffb400]/30 bg-[#ffb400]/10 p-4 text-[13px] text-foreground">
        PM accounts can change access for everyone. Use viewer access unless someone needs to manage requests.
      </p>
      <ManageNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
