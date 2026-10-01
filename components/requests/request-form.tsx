"use client";

import type { Request } from "@/types/request";
import type { Team } from "@/types/team";
import type { Category } from "@/types/category";
import { updateRequest } from "@/app/actions";

const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

function Field({ label, name, defaultValue, type = "text", required = true, min, step }: { label: string; name: string; defaultValue?: string | number; type?: string; required?: boolean; min?: number; step?: number }) {
  return <label className="block text-[13px] font-medium">{label}<input name={name} type={type} required={required} defaultValue={defaultValue} min={min} step={step} className={inputClass} /></label>;
}

function SelectField({ label, name, defaultValue, children }: { label: string; name: string; defaultValue?: string; children: React.ReactNode }) {
  return <label className="block text-[13px] font-medium">{label}<select name={name} required defaultValue={defaultValue} className={inputClass}>{children}</select></label>;
}

export default function RequestForm({ request, teams, categories, returnTo = "/requests" }: { request: Request; teams: Team[]; categories: Category[]; returnTo?: string }) {
  return <form action={updateRequest} className="space-y-7 rounded-2xl border border-border bg-card p-5 sm:p-6">
    <input type="hidden" name="id" value={request.id} />
    <input type="hidden" name="returnTo" value={returnTo} />
    <section>
      <h2 className="text-[15px] font-semibold">Request details</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Title" name="title" defaultValue={request.title} />
        <Field label="Notion ID" name="notionId" defaultValue={request.notionId} required={false} />
        <Field label="Outputs" name="outputCount" type="number" min={1} step={1} defaultValue={request.outputCount} />
        <SelectField label="Team" name="teamId" defaultValue={request.teamId}><option value="">Choose a team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</SelectField>
        <SelectField label="Work Area" name="categoryId" defaultValue={request.categoryId}><option value="">Choose a work area</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectField>
      </div>
    </section>
    <button type="submit" className="h-10 cursor-pointer rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#108513]">Save changes</button>
  </form>;
}
