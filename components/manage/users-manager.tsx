"use client";

import { useState } from "react";
import { createManagedUser, deleteManagedUser, updateManagedUser } from "@/app/manage-actions";
import type { ManagedUser } from "@/types/managed-user";

const inputClass = "mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-[13px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

function Label({ children }: { children: React.ReactNode }) { return <label className="block text-[13px] font-medium">{children}</label>; }
function ErrorText({ message }: { message: string }) { return message ? <p className="mt-2 text-[13px] text-destructive" role="alert">{message}</p> : null; }

export default function UsersManager({ users }: { users: ManagedUser[] }) {
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPending(true);
    const formData = new FormData(event.currentTarget);
    try { if (editing) await updateManagedUser(formData); else await createManagedUser(formData); setEditing(null); setCreating(false); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Something went wrong"); }
    finally { setPending(false); }
  }
  async function remove(user: ManagedUser) {
    if (!confirm(`Delete ${user.name} (@${user.username})? This cannot be undone.`)) return;
    setError(""); setPending(true); const formData = new FormData(); formData.set("id", user.id);
    try { await deleteManagedUser(formData); } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Something went wrong"); } finally { setPending(false); }
  }

  const shown = editing ?? null;
  return <div className="space-y-6">
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="text-[15px] font-semibold">Users</h2><p className="mt-1 text-[13px] text-muted-foreground">People with access to Request Wave.</p></div><button type="button" onClick={() => { setCreating(true); setEditing(null); setError(""); }} className="h-9 rounded-full bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-[#108513]">Add user</button></header>
      <ul className="divide-y divide-border">{users.map((user) => <li key={user.id} className="flex flex-wrap items-center gap-3 px-5 py-4"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{user.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{user.name}</p><p className="truncate text-xs text-muted-foreground">@{user.username}</p></div><span className="rounded-full bg-[#16B1FF]/15 px-2.5 py-1 text-xs font-medium text-[#0a6ea3] dark:text-[#7fd4ff]">{user.role === "PM" ? "PM" : "Viewer"}</span><div className="flex gap-1"><button type="button" onClick={() => { setEditing(user); setCreating(false); setError(""); }} className="rounded-full bg-[#FFB400]/15 px-3 py-1.5 text-xs font-medium text-[#a66f00] transition-colors hover:bg-[#FFB400]/25 dark:text-[#ffd166]">Edit</button><button type="button" disabled={pending} onClick={() => remove(user)} className="rounded-full px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">Delete</button></div></li>)}{!users.length && <li className="px-5 py-8 text-center text-[13px] text-muted-foreground">No users yet.</li>}</ul>
    </section>
    {(creating || shown) && <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6"><h2 className="text-[15px] font-semibold">{shown ? `Edit ${shown.name}` : "New user"}</h2>{shown && <input type="hidden" name="id" value={shown.id} />}<div className="grid gap-4 sm:grid-cols-2"><Label>Username<input name="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" defaultValue={shown?.username} className={inputClass} autoComplete="username" /></Label><Label>{shown ? "New password (leave blank to keep)" : "Password"}<input name="password" type="password" required={!shown} minLength={8} autoComplete="new-password" className={inputClass} /></Label><Label>Name<input name="name" required defaultValue={shown?.name} className={inputClass} /></Label><Label>Initials<input name="initials" required maxLength={4} defaultValue={shown?.initials} className={inputClass} /></Label><Label>Role<select name="role" defaultValue={shown?.role ?? "VIEWER"} className={inputClass}><option value="VIEWER">Viewer</option><option value="PM">PM</option></select></Label></div><ErrorText message={error} /><div className="flex gap-2"><button type="submit" disabled={pending} className="h-10 rounded-full bg-primary px-5 text-[13px] font-medium text-primary-foreground hover:bg-[#108513] disabled:opacity-60">{pending ? "Saving…" : shown ? "Save changes" : "Create user"}</button><button type="button" onClick={() => { setCreating(false); setEditing(null); setError(""); }} className="h-10 rounded-full border border-border px-5 text-[13px] font-medium hover:bg-muted">Cancel</button></div></form>}
    {!creating && !shown && <ErrorText message={error} />}
  </div>;
}
