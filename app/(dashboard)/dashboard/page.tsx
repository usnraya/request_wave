import DashboardClient from "@/components/dashboard/dashboard-client";
import { getCategories, getRequests, getTeams } from "@/lib/data";
import { getCurrentUser } from "@/lib/permissions";
import type { DashboardFilters } from "@/types/dashboard";

export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const params: RawSearchParams = await searchParams;
  const [requests, categories, teams, user] = await Promise.all([
    getRequests(),
    getCategories(),
    getTeams(),
    getCurrentUser(),
  ]);
  const team = first(params.team);
  const category = first(params.category);
  const year = first(params.year);
  const filters: DashboardFilters = {
    year: /^20(25|26)$/.test(year) ? year : "",
    team: teams.some((item) => item.id === team) ? team : "",
    category: categories.some((item) => item.id === category) ? category : "",
    status: "",
  };

  return (
    <DashboardClient
      initialFilters={filters}
      requests={requests}
      categories={categories}
      teams={teams}
      canManage={user?.role === "PM"}
    />
  );
}

export const metadata = { title: "Dashboard | Request Wave" };
