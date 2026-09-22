import Link from "next/link";
import { notFound } from "next/navigation";
import RequestForm from "@/components/requests/request-form";
import { getCategories, getRequest, getTeams, getUsers } from "@/lib/data";
import { requireRole } from "@/lib/permissions";

export default async function EditRequestPage({ params }: PageProps<"/requests/[requestId]/edit">) {
  await requireRole("PM");
  const { requestId } = await params;
  const [request, teams, categories, users] = await Promise.all([
    getRequest(requestId),
    getTeams(),
    getCategories(),
    getUsers(),
  ]);
  if (!request) notFound();
  return <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-10"><Link href="/requests" className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary">← Back to requests</Link><header className="mt-6 border-b border-border pb-6"><h1 className="text-3xl font-medium tracking-tight">Edit request</h1><p className="mt-2 text-[15px] text-muted-foreground">Update the request details and save when finished.</p></header><div className="mt-6"><RequestForm request={request} teams={teams} categories={categories} users={users} /></div></div>;
}
