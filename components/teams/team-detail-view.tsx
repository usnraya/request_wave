"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, Download, Trash2, X } from "lucide-react";
import { deleteRequests } from "@/app/actions";
import BulkRequestForm from "@/components/requests/bulk-request-form";
import MarkdownImportForm from "@/components/requests/markdown-import-form";
import RequestActions from "@/components/requests/request-actions";
import { getTotalOutputs } from "@/lib/dashboard-utils";
import { today } from "@/lib/date-utils";
import { compareNotionId } from "@/lib/notion-id";
import type { Category } from "@/types/category";
import type { Request } from "@/types/request";
import type { Team } from "@/types/team";

export default function TeamDetailView({ team, requests, categories, canManage = false }: { team: Team; requests: Request[]; categories: Category[]; canManage?: boolean }) {
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
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

  // ponytail: CSV (BOM + sep hint) opens in Excel without a dependency; swap to real .xlsx if formatting is needed.
  function downloadExcel() {
    const cell = (value: string) => `"${(/^[=+\-@]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;
    const lines = ["sep=,", ["Notion ID", "Task Title"].map(cell).join(","), ...teamRequests.map((request) => [request.notionId, request.title].map(cell).join(","))];
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${team.id}-${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(teamRequests.map((request) => request.id)));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
      <Link href="/teams" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" />Back to teams</Link>
      <div className="sticky top-[68px] z-20 -mx-4 mt-4 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border py-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">{team.name}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Completed requests assigned to this team.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="team-year">Year</label>
          <select id="team-year" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-10 rounded-full border border-input bg-background px-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20">
            {years.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <button type="button" onClick={downloadExcel} disabled={!teamRequests.length} className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-input bg-background px-4 text-[13px] font-medium transition-colors hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"><Download className="size-4" />Excel</button>
          {canManage && <button type="button" onClick={() => setAdding(true)} className="h-10 cursor-pointer rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#108513]">New request</button>}
        </div>
      </header>
      <div className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm text-muted-foreground">
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
      </div>
      {canManage && (
        <Dialog.Root open={adding} onOpenChange={setAdding}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl outline-none transition-all duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
                <Dialog.Title className="truncate text-lg font-semibold">New request · {team.name}</Dialog.Title>
                <Dialog.Close aria-label="Close" className="cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X className="size-4" /></Dialog.Close>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                <div className="mb-4 inline-flex rounded-full border border-border p-0.5 text-[13px] font-medium" role="tablist">
                  {([false, true] as const).map((markdown) => (
                    <button key={String(markdown)} type="button" role="tab" aria-selected={importing === markdown} onClick={() => setImporting(markdown)} className={`h-8 cursor-pointer rounded-full px-4 transition-colors ${importing === markdown ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {markdown ? "Import Markdown" : "Add manually"}
                    </button>
                  ))}
                </div>
                {importing ? (
                  <MarkdownImportForm onlyTeamId={team.id} returnTo={returnTo} />
                ) : (
                  /* Keyed by list size so rows reset after a successful add. */
                  <BulkRequestForm key={requests.length} teams={[team]} categories={categories} fixedTeam={team} returnTo={returnTo} />
                )}
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
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
