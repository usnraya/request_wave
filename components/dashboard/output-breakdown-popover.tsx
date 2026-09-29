"use client";

import { Popover } from "@base-ui/react/popover";

export type OutputBreakdownItem = {
  label: string;
  outputCount: number;
};

export default function OutputBreakdownPopover({
  value,
  monthLabel,
  rowLabel,
  sourceLabel,
  items,
}: {
  value: number;
  monthLabel: string;
  rowLabel: string;
  sourceLabel: string;
  items: OutputBreakdownItem[];
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        aria-label={`Show ${sourceLabel.toLowerCase()} breakdown for ${rowLabel} in ${monthLabel}`}
        className={`rounded-md px-2 py-1 tabular-nums outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring/50 ${
          value === 0 ? "text-muted-foreground/40" : "font-semibold text-foreground"
        }`}
      >
        {value}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="center" className="z-50">
          <Popover.Popup className="w-64 rounded-xl border border-border bg-card p-4 text-foreground shadow-lg outline-none">
            <Popover.Title className="text-sm font-semibold">
              {rowLabel} · {monthLabel}
            </Popover.Title>
            <p className="mt-1 text-xs text-muted-foreground">
              {value} outputs from {sourceLabel.toLowerCase()}
            </p>
            {items.length ? (
              <ul className="mt-3 space-y-2" aria-label={`${sourceLabel} breakdown`}>
                {items.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-4 text-[13px]">
                    <span className="min-w-0 truncate">{item.label}</span>
                    <span className="font-semibold tabular-nums">{item.outputCount}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] text-muted-foreground">
                No outputs recorded for this month.
              </p>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
