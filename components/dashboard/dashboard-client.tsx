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
import type { User } from "@/types/user";
import {
  filterRequests,
  getMonthRange,
  getMonthlyCategoryRequests,
  getMonthlyTeamRequests,
  getRecentRequests,
  getTotalMonthlyRequests,
} from "@/lib/dashboard-utils";
import { monthKey, today } from "@/lib/date-utils";

export default function DashboardClient({
  initialFilters,
  requests,
  categories,
  teams,
  users,
}: {
  initialFilters: FilterState;
  requests: Request[];
  categories: Category[];
  teams: Team[];
  users: User[];
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
    if (key === "year" && next.month && !next.month.startsWith(`${value}-`)) next.month = "";
    const params = new URLSearchParams();
    Object.entries(next).forEach(([name, entry]) => { if (entry) params.set(name, entry); });
    router.replace(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="page-container flex max-w-7xl flex-col gap-6">
      <DashboardHeader>
        <DashboardFilters
          filters={initialFilters}
          onChange={updateFilter}
          onThisMonth={() => {
            const currentMonth = monthKey(today());
            router.replace(`/dashboard?year=${currentMonth.slice(0, 4)}&month=${currentMonth}`);
          }}
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
        title="Requests by"
        subtitle={`${periodLabel} · ${filtered.length} completed requests`}
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
            <TeamRequestsTable teams={visibleTeams} getSeries={(teamId) => getMonthlyTeamRequests(filtered, teamId, months)} />
          ) : (
            <CategoryRequestsTable categories={categories} getSeries={(categoryId) => getMonthlyCategoryRequests(filtered, categoryId, months)} />
          )}
        </div>
      </DashboardCard>

      <RecentRequests requests={getRecentRequests(filtered, 50)} categories={categories} teams={teams} users={users} />
    </div>
  );
}
