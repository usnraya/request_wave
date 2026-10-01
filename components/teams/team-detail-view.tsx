"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import BulkRequestForm from "@/components/requests/bulk-request-form";
import RequestActions from "@/components/requests/request-actions";
import { compareNotionId } from "@/lib/notion-id";
import type { Category } from "@/types/category";
import type { Request } from "@/types/request";
import type { Team } from "@/types/team";

export default function TeamDetailView({ team, requests, categories, canManage = false }: { team: Team; requests: Request[]; categories: Category[]; canManage?: boolean }) {
  const [adding, setAdding] = useState(false);
  const returnTo = `/teams/${team.id}`;
  const teamRequests = requests.filter((request) => request.teamId === team.id).sort((a, b) => compareNotionId(a.notionId, b.notionId));
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectedCount = teamRequests.filter((request) => selectedIds.has(request.id)).length;
  const allSelected = teamRequests.length > 0 && selectedCount === teamRequests.length;
  const partiallySelected = selectedCount > 0 && !allSelected;
  const teamRequestKey = teamRequests.map((request) => request.id).join("|");

  useEffect(() => {
    setSelectedIds((current) => new Set([...current].filter((id) => teamRequests.some((request) => request.id === id))));
  }, [teamRequestKey]);

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(teamRequests.map((request) => request.id)));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
      <Link href="/teams" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" />Back to teams</Link>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">{team.name}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Completed requests assigned to this team.</p>
        </div>
        {canManage && <button type="button" onClick={() => setAdding((value) => !value)} aria-expanded={adding} className="h-10 cursor-pointer rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#108513]">{adding ? "Close" : "New request"}</button>}
      </header>
      {canManage && adding && <div className="mt-6"><BulkRequestForm teams={[team]} categories={categories} fixedTeam={team} returnTo={returnTo} /></div>}
      <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{selectedCount} selected</span>
        {teamRequests.length > 0 && <label className="inline-flex items-center gap-2 font-medium"><input ref={selectAllRef} type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={allSelected ? "Deselect all requests" : "Select all requests"} className="size-4 accent-primary" />Select all</label>}
      </div>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[860px] text-[13px]">
          <caption className="sr-only">Requests for {team.name}</caption>
          <thead><tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground"><th className="w-12 px-4 py-3 font-medium"><span className="sr-only">Select</span></th><th className="px-4 py-3 font-medium">Notion ID</th><th className="px-4 py-3 font-medium">Request</th><th className="px-4 py-3 font-medium">Work Area</th><th className="px-4 py-3 text-right font-medium">Outputs</th>{canManage && <th className="px-4 py-3 text-right font-medium">Actions</th>}</tr></thead>
          <tbody>
            {teamRequests.map((request) => <tr key={request.id} className="border-b border-border last:border-0 hover:bg-primary/[0.03]">
              <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(request.id)} onChange={() => toggleSelected(request.id)} aria-label={`Select ${request.title}`} className="size-4 accent-primary" /></td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{request.notionId || "—"}</td>
              <td className="px-4 py-3 font-medium">{request.title}</td><td className="px-4 py-3 text-muted-foreground">{categoryById.get(request.categoryId) ?? "—"}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{request.outputCount}</td>
              {canManage && <td className="px-4 py-3"><div className="flex justify-end"><RequestActions requestId={request.id} title={request.title} returnTo={returnTo} /></div></td>}
            </tr>)}
            {!teamRequests.length && <tr><td colSpan={canManage ? 6 : 5} className="px-4 py-12 text-center text-muted-foreground">No completed requests for this team yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
