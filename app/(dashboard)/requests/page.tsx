import RequestsClient from "@/components/requests/requests-client";
import { getCategories, getRequests, getTeams } from "@/lib/data";
import { getCurrentUser } from "@/lib/permissions";
import type { DashboardFilters } from "@/types/dashboard";

type RawSearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

export default async function RequestsPage({
  searchParams,
}: PageProps<"/requests">) {
  const params: RawSearchParams = await searchParams;
  const [requests, loadedCategories, teams, user] = await Promise.all([
    getRequests(),
    getCategories(),
    getTeams(),
    getCurrentUser(),
  ]);
  const filters: DashboardFilters = {
    year: first(params.year),
    month: first(params.month),
    team: first(params.team),
    category: first(params.category),
    status: "",
  };
  return (
    <RequestsClient
      initialPage={Math.max(1, Number.parseInt(first(params.page), 10) || 1)}
      initialFilters={filters}
      initialQuery={first(params.q)}
      requests={requests}
      categories={loadedCategories}
      teams={teams}
      canCreate={user?.role === "PM"}
    />
  );
}

export const metadata = { title: "Requests | Request Wave" };
