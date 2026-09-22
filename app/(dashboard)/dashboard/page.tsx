import DashboardClient from "@/components/dashboard/dashboard-client";
import { getCategories, getRequests, getTeams, getUsers } from "@/lib/data";
import type { DashboardFilters } from "@/types/dashboard";

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const params: RawSearchParams = await searchParams;
  const [requests, categories, teams, users] = await Promise.all([
    getRequests(),
    getCategories(),
    getTeams(),
    getUsers(),
  ]);
  const team = first(params.team);
  const category = first(params.category);
  const month = first(params.month);
  const year = first(params.year);
  const filters: DashboardFilters = {
    year: /^20(25|26)$/.test(year) ? year : "",
    month: /^20(25|26)-(0[1-9]|1[0-2])$/.test(month) ? month : "",
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
      users={users}
    />
  );
}

export const metadata = { title: "Dashboard | Request Wave" };
