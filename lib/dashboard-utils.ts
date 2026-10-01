import type { DashboardFilters } from "@/types/dashboard";
import type { Request } from "@/types/request";
import {
  isFutureMonth,
  isSameMonth,
  monthKey,
  monthLabel,
  parseISODate,
  today,
} from "@/lib/date-utils";
import { compareNotionId } from "@/lib/notion-id";

export function filterRequests(
  requests: Request[],
  filters: DashboardFilters,
): Request[] {
  return requests.filter((request) => {
    const requestMonth = monthKey(parseISODate(request.requestDate));
    return (
      (!filters.year || requestMonth.startsWith(`${filters.year}-`)) &&
      (!filters.team || request.teamId === filters.team) &&
      (!filters.category || request.categoryId === filters.category) &&
      (!filters.status || request.status === filters.status)
    );
  });
}

export function getTotalOutputs(requests: Request[]): number {
  return requests.reduce((total, request) => total + request.outputCount, 0);
}

export function getRequestsThisMonth(requests: Request[]): number {
  const reference = today();
  return getTotalOutputs(
    requests.filter((request) =>
      isSameMonth(parseISODate(request.requestDate), reference),
    ),
  );
}

export function getTotalRequests(requests: Request[]): number {
  return getTotalOutputs(requests);
}

export function getRecentRequests(requests: Request[], count = 8): Request[] {
  return [...requests]
    .sort((a, b) => compareNotionId(a.notionId, b.notionId) || a.id.localeCompare(b.id))
    .slice(0, count);
}

export type MonthPoint = {
  key: string;
  label: string;
  shortLabel: string;
  count: number | null;
};

export function getMonthRange(
  year: number = today().getFullYear(),
): MonthPoint[] {
  // 2025 data only starts in June; every other year still runs Jan-Dec.
  const startMonth = year === 2025 ? 5 : 0;
  const length = 12 - startMonth;
  return Array.from({ length }, (_, index) => {
    const date = new Date(year, startMonth + index, 1);
    return {
      key: monthKey(date),
      label: monthLabel(date),
      shortLabel: new Intl.DateTimeFormat("en-US", { month: "short" }).format(
        date,
      ),
      count: null,
    };
  });
}

function countForMonth(
  requests: Request[],
  month: MonthPoint,
  teamId?: string,
): number {
  return getTotalOutputs(
    requests.filter(
      (request) =>
        (!teamId || request.teamId === teamId) &&
        monthKey(parseISODate(request.requestDate)) === month.key,
    ),
  );
}

export function getMonthlyTeamRequests(
  requests: Request[],
  teamId: string,
  months: MonthPoint[],
) {
  return months.map((month) => ({
    ...month,
    count: isFutureMonth(parseISODate(`${month.key}-01`))
      ? null
      : countForMonth(requests, month, teamId),
  }));
}

function countForCategoryMonth(
  requests: Request[],
  month: MonthPoint,
  categoryId: string,
): number {
  return getTotalOutputs(
    requests.filter(
      (request) =>
        request.categoryId === categoryId &&
        monthKey(parseISODate(request.requestDate)) === month.key,
    ),
  );
}

export function getMonthlyCategoryRequests(
  requests: Request[],
  categoryId: string,
  months: MonthPoint[],
) {
  return months.map((month) => ({
    ...month,
    count: isFutureMonth(parseISODate(`${month.key}-01`))
      ? null
      : countForCategoryMonth(requests, month, categoryId),
  }));
}

export function getTotalMonthlyRequests(
  requests: Request[],
  months: MonthPoint[],
) {
  return months.map((month) => ({
    ...month,
    count: isFutureMonth(parseISODate(`${month.key}-01`))
      ? null
      : countForMonth(requests, month),
  }));
}

/** Heatmap shade for one cell: 0 is neutral, 1-4 grow darker against the table's highest count. */
export function getHeatLevel(count: number | null, max: number): number {
  if (!count || count <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}

export function getRequestCountByCategory(
  requests: Request[],
  categoryId: string,
): number {
  return getTotalOutputs(requests.filter((request) => request.categoryId === categoryId));
}

export type OutputBreakdown = {
  id: string;
  outputCount: number;
};

export function getOutputBreakdown(
  requests: Request[],
  month: string,
  groupBy: "categoryId" | "teamId",
): OutputBreakdown[] {
  const totals = new Map<string, number>();

  for (const request of requests) {
    if (monthKey(parseISODate(request.requestDate)) !== month) continue;
    const id = request[groupBy];
    totals.set(id, (totals.get(id) ?? 0) + request.outputCount);
  }

  return [...totals.entries()]
    .map(([id, outputCount]) => ({ id, outputCount }))
    .sort((a, b) => b.outputCount - a.outputCount || a.id.localeCompare(b.id));
}
