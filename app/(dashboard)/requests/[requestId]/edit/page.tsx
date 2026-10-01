import Link from "next/link";
import { notFound } from "next/navigation";
import RequestForm from "@/components/requests/request-form";
import { getCategories, getRequest, getTeams } from "@/lib/data";
import { requireRole } from "@/lib/permissions";

export default async function EditRequestPage({ params, searchParams }: PageProps<"/requests/[requestId]/edit">) {
  await requireRole("PM");
  const { requestId } = await params;
  const rawSearchParams = await searchParams;
  const returnToValue = Array.isArray(rawSearchParams?.returnTo) ? rawSearchParams.returnTo[0] : rawSearchParams?.returnTo;
  const returnTo = returnToValue && (returnToValue === "/dashboard" || returnToValue.startsWith("/dashboard?") || returnToValue === "/requests" || returnToValue.startsWith("/requests?") || /^\/teams\/[A-Za-z0-9_-]+$/.test(returnToValue)) ? returnToValue : "/requests";
  const [request, teams, categories] = await Promise.all([
    getRequest(requestId),
    getTeams(),
    getCategories(),
  ]);
  if (!request) notFound();
  return <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-10"><Link href={returnTo} className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary">← Back</Link><header className="mt-6 border-b border-border pb-6"><h1 className="text-3xl font-medium tracking-tight">Edit request</h1><p className="mt-2 text-[15px] text-muted-foreground">Update the request details and save when finished.</p></header><div className="mt-6"><RequestForm request={request} teams={teams} categories={categories} returnTo={returnTo} /></div></div>;
}
