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

export function filterRequests(
  requests: Request[],
  filters: DashboardFilters,
): Request[] {
  return requests.filter((request) => {
    const requestMonth = monthKey(parseISODate(request.requestDate));
    return (
      (!filters.year || requestMonth.startsWith(`${filters.year}-`)) &&
      (!filters.month || requestMonth === filters.month) &&
      (!filters.team || request.teamId === filters.team) &&
      (!filters.category || request.categoryId === filters.category) &&
      (!filters.status || request.status === filters.status)
    );
  });
}

export function getRequestsThisMonth(requests: Request[]): number {
  const reference = today();
  return requests.filter((request) =>
    isSameMonth(parseISODate(request.requestDate), reference),
  ).length;
}

export function getTotalRequests(requests: Request[]): number {
  return requests.length;
}

export function getRecentRequests(requests: Request[], count = 8): Request[] {
  return [...requests]
    .sort(
      (a, b) =>
        b.requestDate.localeCompare(a.requestDate) || b.id.localeCompare(a.id),
    )
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
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 1);
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
  return requests.filter(
    (request) =>
      (!teamId || request.teamId === teamId) &&
      monthKey(parseISODate(request.requestDate)) === month.key,
  ).length;
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
  return requests.filter(
    (request) =>
      request.categoryId === categoryId &&
      monthKey(parseISODate(request.requestDate)) === month.key,
  ).length;
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
  return requests.filter((request) => request.categoryId === categoryId).length;
}
