import DashboardCard from "./dashboard-card";
import type { MonthPoint } from "@/lib/dashboard-utils";

export default function MonthlyTotal({ months }: { months: MonthPoint[] }) {
  return (
    <DashboardCard title="Monthly total" subtitle="Completed requests by month">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {months.map((month) => (
          <div key={month.key} className="rounded-xl bg-muted/60 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{month.shortLabel}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{month.count === null ? "—" : month.count}</p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
