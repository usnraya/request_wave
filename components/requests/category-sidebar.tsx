"use client";

import { cn } from "@/lib/utils";
import { getRequestCountByCategory } from "@/lib/dashboard-utils";
import type { Category } from "@/types/category";
import type { Request } from "@/types/request";

export default function CategorySidebar({
  categories,
  requests,
  selected,
  onSelect,
}: {
  categories: Category[];
  requests: Request[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  const all = [{ id: "", name: "All Requests" }, ...categories];
  return (
    <nav
      aria-label="Request categories"
      className="-mx-1 overflow-x-auto px-1 lg:mx-0 lg:px-0"
    >
      <div className="flex min-w-max gap-1 lg:block lg:min-w-0 lg:space-y-1">
        {all.map((category) => {
          const count = category.id
            ? getRequestCountByCategory(requests, category.id)
            : requests.length;
          return (
            <button
              key={category.id || "all"}
              type="button"
              onClick={() => onSelect(category.id)}
              className={cn(
                "flex w-full items-center justify-between gap-4 rounded-full px-3.5 py-2.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-[#FFB400]/10 hover:text-[#a66f00] dark:hover:text-[#ffd166]",
                selected === category.id &&
                  "bg-[#FFB400]/15 font-medium text-[#a66f00] dark:text-[#ffd166]",
              )}
            >
              <span className="whitespace-nowrap">{category.name}</span>
              <span className="tabular-nums text-xs">{count}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
