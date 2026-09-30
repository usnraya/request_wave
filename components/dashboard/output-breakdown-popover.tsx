"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";

export type OutputBreakdownItem = {
  id: string;
  title: string;
  team: string;
  workArea: string;
  outputCount: number;
};

export default function OutputBreakdownPopover({
  value,
  monthLabel,
  rowLabel,
  sourceLabel,
  groupCount,
  items,
}: {
  value: number;
  monthLabel: string;
  rowLabel: string;
  sourceLabel: string;
  groupCount: number;
  items: OutputBreakdownItem[];
}) {
  const [group, setGroup] = useState("");
  const filtersWorkAreas = sourceLabel === "Work areas";
  const groupLabel = filtersWorkAreas ? "Work area" : "Team";
  const groupValue = (item: OutputBreakdownItem) =>
    filtersWorkAreas ? item.workArea : item.team;
  const groups = Array.from(
    items.reduce((counts, item) => {
      const name = groupValue(item);
      counts.set(name, (counts.get(name) ?? 0) + 1);
      return counts;
    }, new Map<string, number>()),
    ([name, count]) => ({ name, count }),
  ).sort((a, b) => a.name.localeCompare(b.name));
  const visibleItems = group
    ? items.filter((item) => groupValue(item) === group)
    : items;
  const visibleOutputs = visibleItems.reduce(
    (total, item) => total + item.outputCount,
    0,
  );

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) setGroup("");
      }}
    >
      <Dialog.Trigger
        type="button"
        aria-label={`Show requests for ${rowLabel} in ${monthLabel}`}
        className={`rounded-md px-2 py-1 tabular-nums outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring/50 ${
          value === 0 ? "text-muted-foreground/40" : "font-semibold text-foreground"
        }`}
      >
        {value}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl outline-none transition-all duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 sm:max-h-[min(88dvh,52rem)]">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-lg font-semibold">
                {rowLabel} · {monthLabel}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "request" : "requests"} · {value} outputs · {groupCount} {sourceLabel.toLowerCase()}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="shrink-0 rounded-md p-2 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          {items.length ? (
            <>
              <div className="flex shrink-0 flex-col gap-3 border-b border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                {groups.length > 1 ? (
                  <label className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="shrink-0 font-medium">Filter:</span>
                    <select
                      value={group}
                      onChange={(event) => setGroup(event.target.value)}
                      aria-label={`Filter by ${groupLabel.toLowerCase()}`}
                      className="h-9 min-w-0 max-w-72 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    >
                      <option value="">All {sourceLabel.toLowerCase()}</option>
                      {groups.map((option) => (
                        <option key={option.name} value={option.name}>
                          {option.name} ({option.count})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span className="text-sm font-medium">All requests</span>
                )}
                <p className="text-xs text-muted-foreground sm:text-sm" aria-live="polite">
                  {group ? `${visibleItems.length} of ${items.length}` : visibleItems.length} {visibleItems.length === 1 ? "request" : "requests"} · {visibleOutputs} outputs
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="sticky top-0 z-10 hidden grid-cols-[minmax(0,1fr)_14rem_5rem] gap-4 border-b border-border bg-card/95 px-6 py-2 text-xs font-medium text-muted-foreground backdrop-blur sm:grid">
                  <span>Request</span>
                  <span>{groupLabel}</span>
                  <span className="text-right">Outputs</span>
                </div>
                {visibleItems.length ? (
                  <ul aria-label={`Requests for ${rowLabel} in ${monthLabel}`}>
                    {visibleItems.map((item) => (
                      <li
                        key={item.id}
                        className="border-b border-border/70 px-4 py-3 last:border-b-0 odd:bg-card even:bg-muted/30 sm:grid sm:grid-cols-[minmax(0,1fr)_14rem_5rem] sm:items-start sm:gap-4 sm:px-6"
                      >
                        <p className="min-w-0 break-words text-sm font-medium leading-5">
                          {item.title}
                        </p>
                        <p className="mt-1 break-words text-xs text-muted-foreground sm:mt-0 sm:text-sm sm:text-foreground/75">
                          <span className="font-medium text-foreground/80 sm:hidden">{groupLabel}: </span>
                          {groupValue(item)}
                        </p>
                        <div className="mt-2 sm:mt-0 sm:text-right">
                          <span className="inline-flex min-w-8 justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                            ×{item.outputCount}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No requests match this filter.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No outputs recorded for this month.
            </p>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
