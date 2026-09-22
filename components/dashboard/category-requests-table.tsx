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
              className="sticky left-0 z-10 w-40 bg-muted/30 px-4 py-3 font-medium"
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
                className="border-b border-border last:border-0 transition-colors hover:bg-primary/[0.03]"
              >
                <th
                  scope="row"
                  className="sticky left-0 max-w-40 truncate bg-card px-4 py-3 text-left font-medium"
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
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
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
