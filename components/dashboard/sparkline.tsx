import type { MonthPoint } from "@/lib/dashboard-utils";
import { CHART_BAR } from "./trend-chart";

export default function Sparkline({
  series,
  width = 220,
  height = 150,
  label = "Trend",
}: {
  series: MonthPoint[];
  width?: number;
  height?: number;
  label?: string;
}) {
  const points = series.map((point) => ({ ...point, count: point.count ?? 0 }));
  const marginLeft = 20;
  const marginBottom = 16;
  const marginTop = 14;
  const plotWidth = width - marginLeft - 4;
  const plotHeight = height - marginBottom - marginTop;
  const max = Math.max(...points.map((point) => point.count), 1);
  const slot = plotWidth / points.length;
  const barWidth = Math.max(4, slot - 4);
  const maxIndex = points.reduce(
    (best, point, index) => (point.count > points[best].count ? index : best),
    0,
  );
  const ticks = [0, max / 2, max];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="w-full"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      {ticks.map((tick) => {
        const y = marginTop + plotHeight - (tick / max) * plotHeight;
        return (
          <g key={tick}>
            <line
              x1={marginLeft}
              y1={y}
              x2={width - 2}
              y2={y}
              className="stroke-border"
              strokeWidth="1"
            />
            <text
              x={marginLeft - 4}
              y={y + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[8px] tabular-nums"
            >
              {Math.round(tick)}
            </text>
          </g>
        );
      })}
      {points.map((point, index) => {
        const barHeight = (point.count / max) * plotHeight;
        const x = marginLeft + index * slot + (slot - barWidth) / 2;
        const y = marginTop + plotHeight - barHeight;
        return (
          <g key={point.key}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(1, barHeight)}
              rx="2"
              fill={CHART_BAR}
              opacity={index === maxIndex ? 1 : 0.5}
            >
              <title>{`${point.label}: ${point.count}`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={y - 3}
              textAnchor="middle"
              className="fill-foreground text-[9px] font-medium tabular-nums"
            >
              {point.count}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 3}
              textAnchor="middle"
              className="fill-muted-foreground text-[8px]"
            >
              {point.shortLabel}
            </text>
          </g>
        );
      })}
      <line
        x1={marginLeft}
        y1={marginTop + plotHeight}
        x2={width - 2}
        y2={marginTop + plotHeight}
        className="stroke-border"
        strokeWidth="1"
      />
    </svg>
  );
}
