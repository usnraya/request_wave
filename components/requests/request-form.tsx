"use client";

import type { Request } from "@/types/request";
import type { Team } from "@/types/team";
import type { Category } from "@/types/category";
import type { User } from "@/types/user";
import { updateRequest } from "@/app/actions";

const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

function Field({ label, name, defaultValue, type = "text", required = true }: { label: string; name: string; defaultValue?: string | number; type?: string; required?: boolean }) {
  return <label className="block text-[13px] font-medium">{label}<input name={name} type={type} required={required} defaultValue={defaultValue} className={inputClass} /></label>;
}

function SelectField({ label, name, defaultValue, children, required = true }: { label: string; name: string; defaultValue?: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block text-[13px] font-medium">{label}<select name={name} required={required} defaultValue={defaultValue} className={inputClass}>{children}</select></label>;
}

export default function RequestForm({ request, teams, categories, users }: { request: Request; teams: Team[]; categories: Category[]; users: User[] }) {
  return <form action={updateRequest} className="space-y-7 rounded-2xl border border-border bg-card p-5 sm:p-6">
    <input type="hidden" name="id" value={request.id} />
    <section>
      <h2 className="text-[15px] font-semibold">Request details</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Title" name="title" defaultValue={request.title} />
        <Field label="Request code" name="requestCode" defaultValue={request.requestCode} />
        <Field label="Notion ID" name="notionId" defaultValue={request.notionId} required={false} />
        <SelectField label="Team" name="teamId" defaultValue={request.teamId}><option value="">Select team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</SelectField>
        <SelectField label="Work Area" name="categoryId" defaultValue={request.categoryId}><option value="">Select work area</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectField>
        <SelectField label="Requester" name="requesterId" defaultValue={request.requesterId}><option value="">Select requester</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</SelectField>
        <SelectField label="Designer" name="designerId" defaultValue={request.designerId ?? ""} required={false}><option value="">Unassigned</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</SelectField>
      </div>
    </section>
    <section className="border-t border-border pt-6">
      <h2 className="text-[15px] font-semibold">Schedule and status</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Request date" name="requestDate" type="date" defaultValue={request.requestDate} />
        <Field label="Deadline" name="deadline" type="date" defaultValue={request.deadline} />
        <Field label="Completed date" name="completedDate" type="date" required={false} defaultValue={request.completedDate} />
        <SelectField label="Priority" name="priority" defaultValue={request.priority}>{["low", "medium", "high", "urgent"].map((value) => <option key={value} value={value}>{value}</option>)}</SelectField>
        <SelectField label="Status" name="status" defaultValue={request.status}>{["new", "in_progress", "waiting_feedback", "revision", "done", "cancelled"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</SelectField>
        <Field label="Estimated hours" name="estimatedHours" type="number" defaultValue={request.estimatedHours} />
        <Field label="Actual hours" name="actualHours" type="number" required={false} defaultValue={request.actualHours} />
      </div>
    </section>
    <section className="border-t border-border pt-6">
      <h2 className="text-[15px] font-semibold">Links and notes</h2>
      <div className="mt-4 space-y-4">
        <Field label="Figma link" name="figmaUrl" type="url" required={false} defaultValue={request.figmaUrl} />
        <Field label="Drive link" name="driveUrl" type="url" required={false} defaultValue={request.driveUrl} />
        <label className="block text-[13px] font-medium">Description<textarea name="description" defaultValue={request.description ?? ""} rows={4} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
      </div>
    </section>
    <button type="submit" className="h-10 cursor-pointer rounded-full bg-primary px-5 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-[#108513]">Save changes</button>
  </form>;
}
