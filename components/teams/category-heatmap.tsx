import DashboardCard from "@/components/dashboard/dashboard-card";
import { getHeatLevel, type MonthPoint } from "@/lib/dashboard-utils";
import type { Category } from "@/types/category";

/** Green intensity scale. Index 0 is "no requests" and stays transparent. */
const heat = (level: number) => `rgb(16 175 19 / ${[0, 0.16, 0.3, 0.55, 0.88][level]})`;

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span>Lower</span>
      {[1, 2, 3, 4].map((level) => (
        <span
          key={level}
          className="size-4 rounded-sm"
          style={{ backgroundColor: heat(level) }}
          aria-hidden="true"
        />
      ))}
      <span>Higher</span>
    </div>
  );
}

export default function CategoryHeatmap({
  categories,
  getSeries,
}: {
  categories: Category[];
  getSeries: (id: string) => MonthPoint[];
}) {
  const rows = categories.map((category) => ({
    category,
    series: getSeries(category.id),
  }));
  const columns = rows[0]?.series ?? [];
  const max = Math.max(
    0,
    ...rows.flatMap(({ series }) => series.map((point) => point.count ?? 0)),
  );

  return (
    <DashboardCard
      title="Monthly Requests Heatmap"
      subtitle={`${categories.length} categories across 12 months`}
      action={<Legend />}
    >
      <div className="overflow-x-auto rounded-lg border border-border/80">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <caption className="sr-only">
            Completed requests by category and month. Darker green means more
            requests.
          </caption>
          <thead>
            <tr className="border-b border-border/80 bg-muted text-left text-xs text-muted-foreground">
              <th
                scope="col"
                className="sticky left-0 z-10 w-44 bg-muted px-4 py-3 font-medium"
              >
                Category
              </th>
              {columns.map((month) => (
                <th
                  key={month.key}
                  scope="col"
                  className="px-3 py-3 text-center font-medium"
                >
                  {month.shortLabel}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ category, series }) => {
              const total = series.reduce(
                (sum, point) => sum + (point.count ?? 0),
                0,
              );
              return (
                <tr
                  key={category.id}
                  className="border-b border-border/70 last:border-0"
                >
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-44 truncate bg-card px-4 py-3 text-left font-medium"
                    title={category.name}
                  >
                    {category.name}
                  </th>
                  {series.map((point) => {
                    const level = getHeatLevel(point.count, max);
                    return (
                      <td
                        key={point.key}
                        // The number is always printed, so color only reinforces it.
                        className={`px-3 py-3 text-center tabular-nums ${level === 4 ? "font-semibold text-white" : "text-foreground"}`}
                        style={
                          level ? { backgroundColor: heat(level) } : undefined
                        }
                        title={`${category.name}, ${point.label}: ${point.count ?? "no data"}`}
                      >
                        {point.count ?? "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
