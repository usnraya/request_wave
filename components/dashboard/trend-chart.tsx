import DashboardCard from "./dashboard-card";
import type { MonthPoint } from "@/lib/dashboard-utils";

export const CHART_BAR = "#10AF13";

export default function TrendChart({ months }: { months: MonthPoint[] }) {
  const points = months.map((month) => ({ ...month, count: month.count ?? 0 }));
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const width = 920;
  const height = 220;
  const marginLeft = 36;
  const marginBottom = 22;
  const marginTop = 24;
  const axis = height - marginBottom;
  const plotHeight = axis - marginTop;
  const max = Math.max(...points.map((point) => point.count), 1);
  const slot = (width - marginLeft - 6) / points.length;
  const barWidth = Math.min(40, slot - 8);
  const maxIndex = points.reduce(
    (best, point, index) => (point.count > points[best].count ? index : best),
    0,
  );
  const avg = Math.round(total / points.length);
  const ticks = [0, max / 2, max];

  return (
    <DashboardCard
      title="Requests Trend"
      subtitle={`All teams · ${total} requests total · avg ${avg}/month`}
    >
      <div className="min-h-[220px] overflow-x-auto">
        <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[220px] min-w-[680px] w-full"
        role="img"
        aria-label="Total requests per month"
      >
        {ticks.map((tick) => {
          const y = axis - (tick / max) * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={marginLeft}
                y1={y}
                x2={width - 4}
                y2={y}
                className="stroke-border"
                strokeWidth="1"
              />
              <text
                x={marginLeft - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {Math.round(tick)}
              </text>
            </g>
          );
        })}
        {points.map((point, index) => {
          const barHeight = (point.count / max) * plotHeight;
          const x = marginLeft + index * slot + (slot - barWidth) / 2;
          const y = axis - barHeight;
          const isMax = index === maxIndex;
          return (
            <g key={point.key}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barHeight)}
                rx="4"
                fill={CHART_BAR}
                opacity={isMax ? 1 : 0.45}
              >
                <title>{`${point.label}: ${point.count} requests (${total > 0 ? Math.round((point.count / total) * 100) : 0}% of total)`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className={`text-[11px] tabular-nums ${isMax ? "font-semibold fill-foreground" : "fill-muted-foreground"}`}
              >
                {point.count}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {point.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
      <p className="sr-only">
        {points
          .map((point) => `${point.shortLabel}: ${point.count}`)
          .join(", ")}
      </p>
    </DashboardCard>
  );
}
