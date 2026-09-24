"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CategorySidebar from "./category-sidebar";
import RequestCard from "./request-card";
import type { Category } from "@/types/category";
import type { DashboardFilters } from "@/types/dashboard";
import type { Request } from "@/types/request";
import type { Team } from "@/types/team";
import { filterRequests } from "@/lib/dashboard-utils";

export default function RequestsClient({
  initialFilters,
  initialQuery,
  initialPage,
  requests,
  categories,
  teams,
  canCreate,
}: {
  initialFilters: DashboardFilters;
  initialQuery: string;
  initialPage: number;
  requests: Request[];
  categories: Category[];
  teams: Team[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const selected = initialFilters.category;
  const page = Math.max(1, initialPage);
  const pageSize = 6;
  const completedRequests = requests.filter(
    (request) => request.status === "done",
  );
  const filtered = filterRequests(completedRequests, {
    ...initialFilters,
    status: "",
  }).filter((request) => {
    const haystack = [
      request.title,
      request.requestCode,
      request.notionId,
      request.teamId,
      request.designerId ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return !initialQuery || haystack.includes(initialQuery.toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  function update(params: Record<string, string>) {
    const next = new URLSearchParams();
    Object.entries({ ...initialFilters, q: initialQuery, page: "", ...params }).forEach(
      ([key, value]) => {
        if (value) next.set(key, value);
      },
    );
    router.replace(`/requests${next.toString() ? `?${next}` : ""}`);
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-primary">Requests</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Browse completed design work by work area and team.
          </p>
        </div>
        {canCreate && (
          <Link href="/requests/new" className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#108513] focus-visible:ring-2 focus-visible:ring-ring">
            New request
          </Link>
        )}
      </header>
      <div className="mt-6 flex flex-wrap gap-2">
        <input
          defaultValue={initialQuery}
          onKeyDown={(event) => {
            if (event.key === "Enter") update({ q: event.currentTarget.value });
          }}
          placeholder="Search requests"
          aria-label="Search requests"
          className="h-10 w-full rounded-full border border-input bg-background px-4 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-72"
        />
        <select
          aria-label="Filter by team"
          value={initialFilters.team}
          onChange={(event) => update({ team: event.target.value })}
          className="h-10 rounded-full border border-input bg-background px-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <CategorySidebar
          categories={categories}
          requests={completedRequests}
          selected={selected}
          onSelect={(category) => update({ category })}
        />
        <section aria-live="polite" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {filtered.length} requests
            </h2>
          </div>
          {filtered.length ? (
            paged.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                categories={categories}
                teams={teams}
              />
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No requests match these filters. Try broadening your search.
            </p>
          )}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-3">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => update({ page: String(currentPage - 1) })}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:invisible"
              >
                <ChevronLeft className="size-4" />
              </button>
              {(() => {
                const count = Math.min(3, totalPages);
                const start = Math.max(
                  1,
                  Math.min(currentPage - 1, totalPages - count + 1),
                );
                return Array.from({ length: count }, (_, index) => {
                  const number = start + index;
                  return (
                    <button
                      key={number}
                      type="button"
                      aria-current={number === currentPage ? "page" : undefined}
                      onClick={() => update({ page: String(number) })}
                      className={
                        number === currentPage
                          ? "flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
                          : "flex size-8 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-muted"
                      }
                    >
                      {number}
                    </button>
                  );
                });
              })()}
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage === totalPages}
                onClick={() => update({ page: String(currentPage + 1) })}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:invisible"
              >
                <ChevronRight className="size-4" />
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
