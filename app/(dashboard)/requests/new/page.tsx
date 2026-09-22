import Link from "next/link";
import BulkRequestForm from "@/components/requests/bulk-request-form";
import { getCategories, getTeams } from "@/lib/data";
import { requireRole } from "@/lib/permissions";

export default async function NewRequestPage() {
  await requireRole("PM");
  const [teams, categories] = await Promise.all([getTeams(), getCategories()]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-10">
      <Link href="/requests" className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-[#126915] dark:hover:text-[#b8fab8]">
        ← Back to requests
      </Link>
      <header className="mt-6 border-b border-border pb-6">
        <h1 className="text-3xl font-medium tracking-tight">Add completed designs</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Set the shared details, then add each completed design below.
        </p>
      </header>
      <div className="mt-6">
        <BulkRequestForm teams={teams} categories={categories} />
      </div>
    </div>
  );
}
