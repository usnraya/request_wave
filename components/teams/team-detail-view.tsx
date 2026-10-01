"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deleteRequests } from "@/app/actions";
import BulkRequestForm from "@/components/requests/bulk-request-form";
import RequestActions from "@/components/requests/request-actions";
import { getTotalOutputs } from "@/lib/dashboard-utils";
import { today } from "@/lib/date-utils";
import { compareNotionId } from "@/lib/notion-id";
import type { Category } from "@/types/category";
import type { Request } from "@/types/request";
import type { Team } from "@/types/team";

export default function TeamDetailView({ team, requests, categories, canManage = false }: { team: Team; requests: Request[]; categories: Category[]; canManage?: boolean }) {
  const [adding, setAdding] = useState(false);
  const returnTo = `/teams/${team.id}`;
  const currentYear = today().getFullYear();
  const [year, setYear] = useState(currentYear);
  const teamAll = requests.filter((request) => request.teamId === team.id);
  const years = Array.from(new Set([currentYear, ...teamAll.map((request) => Number(request.requestDate.slice(0, 4)))])).sort((a, b) => b - a);
  const teamRequests = teamAll.filter((request) => request.requestDate.startsWith(`${year}-`)).sort((a, b) => compareNotionId(a.notionId, b.notionId));
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectedRequests = teamRequests.filter((request) => selectedIds.has(request.id));
  const selectedCount = selectedRequests.length;
  const selectedOutputs = getTotalOutputs(selectedRequests);
  const totalOutputs = getTotalOutputs(teamRequests);
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

  function confirmBulkDelete(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(`Delete ${selectedCount} request${selectedCount === 1 ? "" : "s"} (${selectedOutputs} outputs)? This cannot be undone.`)) event.preventDefault();
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
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="team-year">Year</label>
          <select id="team-year" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-10 rounded-full border border-input bg-background px-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
            {years.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          {canManage && <button type="button" onClick={() => setAdding((value) => !value)} aria-expanded={adding} className="h-10 cursor-pointer rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#108513]">{adding ? "Close" : "New request"}</button>}
        </div>
      </header>
      {canManage && adding && <div className="mt-6"><BulkRequestForm teams={[team]} categories={categories} fixedTeam={team} returnTo={returnTo} /></div>}
      <div className="mt-6 flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>{selectedCount} selected{selectedCount > 0 && ` · ${selectedOutputs} outputs`}</span>
          <span className="font-medium text-foreground">Total outputs {year}: <span className="tabular-nums">{totalOutputs}</span></span>
          {canManage && selectedCount > 0 && (
            <form action={deleteRequests} onSubmit={confirmBulkDelete}>
              <input type="hidden" name="returnTo" value={returnTo} />
              {selectedRequests.map((request) => <input key={request.id} type="hidden" name="id" value={request.id} />)}
              <button type="submit" className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-destructive/10 px-4 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/20"><Trash2 className="size-4" />Delete {selectedCount} selected</button>
            </form>
          )}
        </div>
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
            {!teamRequests.length && <tr><td colSpan={canManage ? 6 : 5} className="px-4 py-12 text-center text-muted-foreground">No completed requests for this team in {year}.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
