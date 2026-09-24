"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Category } from "@/types/category";
import type { Request } from "@/types/request";
import type { Team } from "@/types/team";
import type { User } from "@/types/user";

export default function TeamDetailView({ team, requests, categories, users }: { team: Team; requests: Request[]; categories: Category[]; users: User[] }) {
  const teamRequests = requests.filter((request) => request.teamId === team.id).sort((a, b) => b.requestDate.localeCompare(a.requestDate));
  const categoryById = new Map(categories.map((category) => [category.id, category.name]));
  const requesterById = new Map(users.map((user) => [user.id, user.name]));
  const [notionIds, setNotionIds] = useState<Record<string, string>>(() => Object.fromEntries(teamRequests.map((request) => [request.id, request.notionId])));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
      <Link href="/teams" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" />Back to teams</Link>
      <header className="mt-6 border-b border-border pb-6">
        <h1 className="text-3xl font-medium tracking-tight">{team.name}</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">Completed requests assigned to this team.</p>
      </header>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[680px] text-[13px]">
          <caption className="sr-only">Requests for {team.name}</caption>
          <thead><tr className="border-b border-border bg-muted/60 text-left text-xs text-muted-foreground"><th className="px-4 py-3 font-medium">Notion ID</th><th className="px-4 py-3 font-medium">Request</th><th className="px-4 py-3 font-medium">Work Area</th><th className="px-4 py-3 font-medium">Requester</th></tr></thead>
          <tbody>
            {teamRequests.map((request) => <tr key={request.id} className="border-b border-border last:border-0 hover:bg-primary/[0.03]">
              <td className="whitespace-nowrap px-4 py-3"><label className="sr-only" htmlFor={`notion-${request.id}`}>Notion ID for {request.id}</label><input id={`notion-${request.id}`} value={notionIds[request.id] ?? ""} onChange={(event) => setNotionIds((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Enter Notion ID" className="h-9 w-40 rounded-xl border border-input bg-background px-2.5 font-mono text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" /></td>
              <td className="px-4 py-3 font-medium">{request.title}</td><td className="px-4 py-3 text-muted-foreground">{categoryById.get(request.categoryId) ?? "—"}</td><td className="px-4 py-3 text-muted-foreground">{requesterById.get(request.requesterId) ?? "—"}</td>
            </tr>)}
            {!teamRequests.length && <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No completed requests for this team yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
