"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DashboardCard from "./dashboard-card";
import { getPageItems } from "@/lib/pagination";
import type { Category } from "@/types/category";
import type { Request } from "@/types/request";
import type { Team } from "@/types/team";

export default function RecentRequests({
  requests,
  categories,
  teams,
}: {
  requests: Request[];
  categories: Category[];
  teams: Team[];
}) {
  const categoryById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const teamById = new Map(teams.map((team) => [team.id, team.name]));
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(requests.length / pageSize));
  const [currentPage, setCurrentPage] = useState(1);
  const visibleRequests = requests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  return (
    <DashboardCard
      title="Recent Requests"
      subtitle="Latest completed requests in the selected view"
      help="Request selesai terbaru sesuai filter yang dipilih."
      className="border-t-4 border-t-[#16B1FF]"
    >
      {requests.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <caption className="sr-only">Latest completed requests</caption>
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  ID
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Request
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Team
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Work Area
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((request) => (
                <tr
                  key={request.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-[#FFB400]/[0.04]"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {request.notionId}
                  </td>
                  <td className="max-w-56 truncate px-3 py-2.5 font-medium">
                    {request.title}
                  </td>
                  <td className="max-w-32 truncate px-3 py-2.5 text-muted-foreground">
                    {teamById.get(request.teamId) ?? "—"}
                  </td>
                  <td className="max-w-40 truncate px-3 py-2.5 text-muted-foreground">
                    {categoryById.get(request.categoryId) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5 py-10 text-center">
          <p className="text-sm font-medium">No requests found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try another filter.
          </p>
        </div>
      )}
      {totalPages > 1 && (
        <nav
          aria-label="Recent requests pagination"
          className="mt-2 flex items-center justify-center gap-2"
        >
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:invisible"
          >
            <ChevronLeft className="size-4" />
          </button>
          {getPageItems(totalPages, currentPage).map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} aria-label="More pages" className="flex size-8 items-center justify-center text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === currentPage ? "page" : undefined}
                onClick={() => setCurrentPage(item)}
                className={
                  item === currentPage
                    ? "flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
                    : "flex size-8 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-muted"
                }
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:invisible"
          >
            <ChevronRight className="size-4" />
          </button>
        </nav>
      )}
    </DashboardCard>
  );
}
