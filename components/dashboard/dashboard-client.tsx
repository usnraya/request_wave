"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "./dashboard-header";
import DashboardFilters from "./dashboard-filters";
import DashboardSummary from "./dashboard-summary";
import TrendChart from "./trend-chart";
import TeamRequestsTable from "./team-requests-table";
import CategoryRequestsTable from "./category-requests-table";
import MonthlyTotal from "./monthly-total";
import RecentRequests from "./recent-requests";
import DashboardCard from "./dashboard-card";
import type { Category } from "@/types/category";
import type { DashboardFilters as FilterState } from "@/types/dashboard";
import type { Request } from "@/types/request";
import type { Team } from "@/types/team";
import {
  filterRequests,
  getMonthRange,
  getMonthlyCategoryRequests,
  getMonthlyTeamRequests,
  getRecentRequests,
  getTotalMonthlyRequests,
  getTotalOutputs,
} from "@/lib/dashboard-utils";
import { today } from "@/lib/date-utils";

export default function DashboardClient({
  initialFilters,
  requests,
  categories,
  teams,
  canManage,
}: {
  initialFilters: FilterState;
  requests: Request[];
  categories: Category[];
  teams: Team[];
  canManage: boolean;
}) {
  const router = useRouter();
  const completedRequests = requests.filter((request) => request.status === "done");
  const filtered = filterRequests(completedRequests, initialFilters);
  const year = initialFilters.year ? Number(initialFilters.year) : today().getFullYear();
  const months = getMonthRange(year);
  const monthlyTotals = getTotalMonthlyRequests(filtered, months);
  const visibleTeams = initialFilters.team ? teams.filter((team) => team.id === initialFilters.team) : teams;
  const [groupBy, setGroupBy] = useState<"team" | "category">("team");
  const periodLabel = `Monthly activity in ${year}`;

  function updateFilter(key: keyof FilterState, value: string) {
    const next = { ...initialFilters, [key]: value };
    const params = new URLSearchParams();
    Object.entries(next).forEach(([name, entry]) => { if (entry) params.set(name, entry); });
    router.replace(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const dashboardReturnTo = (() => {
    const params = new URLSearchParams();
    Object.entries(initialFilters).forEach(([name, entry]) => { if (entry) params.set(name, entry); });
    return `/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
  })();

  return (
    <div className="page-container flex max-w-7xl flex-col gap-6">
      <DashboardHeader>
        <DashboardFilters
          filters={initialFilters}
          onChange={updateFilter}
          onReset={() => router.replace("/dashboard")}
          teams={teams}
        />
      </DashboardHeader>

      <DashboardSummary
        requests={filtered}
        teamCount={new Set(filtered.map((request) => request.teamId)).size}
        categoryCount={new Set(filtered.map((request) => request.categoryId)).size}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)] lg:items-start">
        <div className="min-w-0">
          <TrendChart months={monthlyTotals} />
        </div>
        <aside className="min-w-0">
          <MonthlyTotal months={monthlyTotals} />
        </aside>
      </div>

      <DashboardCard
        title="Outputs by"
        subtitle={`${periodLabel} · ${getTotalOutputs(filtered)} completed outputs`}
        help="Rincian output per tim atau per area kerja, bulan demi bulan. Klik angka untuk melihat rinciannya."
        action={
          <label className="flex shrink-0 items-center gap-2 text-[13px] text-muted-foreground">
            <span className="sr-only">Group requests by</span>
            <select
              id="request-group"
              aria-label="Group requests by"
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value as "team" | "category")}
              className="h-9 rounded-full border border-input bg-background px-3 text-[13px] text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              <option value="team">Team</option>
              <option value="category">Work Area</option>
            </select>
          </label>
        }
      >
        <div className="pt-3">
          {groupBy === "team" ? (
            <TeamRequestsTable
              teams={visibleTeams}
              categories={categories}
              requests={filtered}
              getSeries={(teamId) => getMonthlyTeamRequests(filtered, teamId, months)}
              canManage={canManage}
              returnTo={dashboardReturnTo}
            />
          ) : (
            <CategoryRequestsTable
              categories={categories}
              teams={teams}
              requests={filtered}
              getSeries={(categoryId) => getMonthlyCategoryRequests(filtered, categoryId, months)}
              canManage={canManage}
              returnTo={dashboardReturnTo}
            />
          )}
        </div>
      </DashboardCard>

      <RecentRequests requests={getRecentRequests(filtered, 50)} categories={categories} teams={teams} />
    </div>
  );
}
