import type { MonthPoint } from "@/lib/dashboard-utils";
import type { Category } from "@/types/category";

export default function CategoryRequestsTable({
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
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[900px] border-collapse text-[13px]">
        <caption className="sr-only">Requests by category and period</caption>
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
            <th
              scope="col"
              className="sticky left-0 z-20 w-40 border-r border-border bg-muted/90 px-4 py-3 font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]"
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
            <th
              scope="col"
              className="sticky right-0 z-20 border-l border-border bg-muted/90 px-4 py-3 text-right font-medium shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.15)]"
            >
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
                className="border-b-2 border-[#e0e0e0] last:border-0 transition-colors hover:bg-primary/[0.03] dark:border-[#4a4664]"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 max-w-40 truncate border-r border-border bg-card px-4 py-3 text-left font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                  title={category.name}
                >
                  {category.name}
                </th>
                {series.map((point) => (
                  <td
                    key={point.key}
                    className="px-3 py-3 text-center tabular-nums"
                  >
                    {point.count ?? "—"}
                  </td>
                ))}
                <td className="sticky right-0 z-10 border-l border-border bg-card px-4 py-3 text-right font-semibold tabular-nums shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                  {total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
