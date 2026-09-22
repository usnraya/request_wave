"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { monthKey, today } from "@/lib/date-utils";
import type { DashboardFilters } from "@/types/dashboard";
import type { Team } from "@/types/team";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const years = ["2025", "2026"];

function Select({
  label,
  value,
  onChange,
  options,
  groups,
  emptyLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  groups?: Array<{ label: string; options: Array<{ value: string; label: string }> }>;
  emptyLabel: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-9 rounded-full border px-3 text-[13px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20",
          value ? "border-primary bg-primary/10 text-primary" : "border-input bg-background",
        )}
      >
        <option value="">{emptyLabel}</option>
        {groups
          ? groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </optgroup>
            ))
          : options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export default function DashboardFilters({
  filters,
  onChange,
  onThisMonth,
  onReset,
  teams,
}: {
  filters: DashboardFilters;
  onChange: (key: keyof DashboardFilters, value: string) => void;
  onThisMonth: () => void;
  onReset: () => void;
  teams: Team[];
}) {
  const currentMonth = monthKey(today());
  const currentYear = currentMonth.slice(0, 4);
  const isThisMonth = filters.year === currentYear && filters.month === currentMonth;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className={cn(isThisMonth && "border-primary bg-primary/10 text-primary")}
        onClick={onThisMonth}
      >
        This month
      </Button>
      <Select label="Year" value={filters.year} onChange={(value) => onChange("year", value)} emptyLabel="All years" options={years.map((year) => ({ value: year, label: year }))} />
      <Select
        label="Month"
        value={filters.month}
        onChange={(value) => onChange("month", value)}
        emptyLabel="All months"
        groups={(filters.year ? years.filter((year) => year === filters.year) : years).map((year) => ({
          label: year,
          options: monthNames.map((name, index) => ({ value: `${year}-${String(index + 1).padStart(2, "0")}`, label: name })),
        }))}
      />
      <Select label="Team" value={filters.team} onChange={(value) => onChange("team", value)} emptyLabel="All teams" options={teams.map((team) => ({ value: team.id, label: team.name }))} />
      <Button
        variant="ghost"
        size="sm"
        className={cn(!filters.year && !filters.month && !filters.team && "text-muted-foreground/50")}
        onClick={onReset}
      >
        <RotateCcw className="size-3.5" /> Reset
      </Button>
    </div>
  );
}
