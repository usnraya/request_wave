"use client";

import { useState } from "react";
import CategoryHeatmap from "@/components/teams/category-heatmap";
import type { Category } from "@/types/category";
import type { Request } from "@/types/request";
import type { Team } from "@/types/team";
import { getMonthRange, getMonthlyCategoryRequests } from "@/lib/dashboard-utils";
import { today } from "@/lib/date-utils";

export default function TeamsClient({ requests, categories, teams }: { requests: Request[]; categories: Category[]; teams: Team[] }) {
  const currentYear = today().getFullYear();
  const [teamId, setTeamId] = useState("");
  const [year, setYear] = useState(currentYear);
  const years = Array.from(new Set([currentYear, ...requests.map((request) => Number(request.requestDate.slice(0, 4)))] )).sort((a, b) => b - a);
  const months = getMonthRange(year);
  const completedRequests = requests.filter((request) => request.status === "done" && (!teamId || request.teamId === teamId));
  const getSeries = (categoryId: string) => getMonthlyCategoryRequests(completedRequests, categoryId, months);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Teams</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Compare completed design activity by work area.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="teams-year">Year</label>
          <select id="teams-year" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-10 rounded-full border border-input bg-background px-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
            {years.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <label className="sr-only" htmlFor="teams-team">Team</label>
          <select id="teams-team" value={teamId} onChange={(event) => setTeamId(event.target.value)} className="h-10 rounded-full border border-input bg-background px-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
            <option value="">All teams</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </div>
      </header>
      <div className="mt-6"><CategoryHeatmap categories={categories} getSeries={getSeries} /></div>
    </div>
  );
}
