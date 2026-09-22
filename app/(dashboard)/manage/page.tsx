import { requireRole } from "@/lib/permissions";
import { getCategories, getManagedUsers } from "@/lib/data";
import CategoriesManager from "@/components/manage/categories-manager";
import UsersManager from "@/components/manage/users-manager";

export default async function ManagePage() {
  await requireRole("PM");
  const [users, categories] = await Promise.all([getManagedUsers(), getCategories()]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
      <header className="border-b border-border pb-6">
        <h1 className="text-3xl font-medium tracking-tight">Manage data</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Manage people, access, and request categories.
        </p>
      </header>
      <p className="mt-6 rounded-2xl border border-[#ffb400]/30 bg-[#ffb400]/10 p-4 text-[13px] text-foreground">
        PM accounts can change access for everyone. Use viewer access unless someone needs to manage requests.
      </p>
      <div className="mt-6 space-y-8">
        <UsersManager users={users} />
        <section className="border-t border-border/80 pt-8">
          <header className="pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Request setup
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Categories</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add, rename, or remove the categories available across requests.
            </p>
          </header>
          <CategoriesManager categories={categories} />
        </section>
      </div>
    </div>
  );
}

export const metadata = { title: "Users | Request Wave" };
