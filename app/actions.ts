"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { dateForMonth, parseBulkRows, type BulkRow } from "@/lib/bulk-requests";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function text(formData: FormData, name: string, required = true): string {
  const value = String(formData.get(name) ?? "").trim();
  if (required && !value) throw new Error(`${name} is required`);
  return value;
}

function optional(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function safeReturnPath(formData: FormData, fallback: string): string {
  const value = optional(formData, "returnTo");
  if (!value) return fallback;
  if (value === "/requests" || value.startsWith("/requests?")) return value;
  if (value === "/dashboard" || value.startsWith("/dashboard?")) return value;
  if (/^\/teams\/[A-Za-z0-9_-]+$/.test(value)) return value;
  return fallback;
}

function positiveInteger(formData: FormData, name: string): number {
  const value = Number(String(formData.get(name) ?? "").trim());
  if (!Number.isInteger(value) || value < 1) throw new Error(`Invalid ${name}`);
  return value;
}

function teamIdFromReturnPath(path: string): string | null {
  return path.match(/^\/teams\/([A-Za-z0-9_-]+)$/)?.[1] ?? null;
}

type ReferencePayload = {
  team_id: string;
  category_id: string;
  requester_id: string;
  designer_id: string | null;
};

function editableRequestPayload(formData: FormData) {
  return {
    title: text(formData, "title"),
    notion_id: text(formData, "notionId", false),
    team_id: text(formData, "teamId"),
    category_id: text(formData, "categoryId"),
    output_count: positiveInteger(formData, "outputCount"),
  };
}

function bulkRows(formData: FormData): BulkRow[] {
  return parseBulkRows(
    formData.getAll("title").map(String),
    formData.getAll("notionId").map(String),
    formData.getAll("outputCount").map(String),
  );
}

async function verifyReferences(payload: ReferencePayload) {
  const supabase = await createSupabaseServerClient();
  const [{ data: team }, { data: category }, { data: requester }, { data: designer }] = await Promise.all([
    supabase.from("teams").select("id").eq("id", payload.team_id).maybeSingle(),
    supabase.from("categories").select("id").eq("id", payload.category_id).maybeSingle(),
    supabase.from("profiles").select("id").eq("id", payload.requester_id).maybeSingle(),
    payload.designer_id ? supabase.from("profiles").select("id").eq("id", payload.designer_id).maybeSingle() : Promise.resolve({ data: true }),
  ]);
  if (!team || !category || !requester || !designer) throw new Error("Invalid team, category, requester, or designer");
  return supabase;
}

async function verifyEditableReferences(teamId: string, categoryId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: team }, { data: category }] = await Promise.all([
    supabase.from("teams").select("id").eq("id", teamId).maybeSingle(),
    supabase.from("categories").select("id").eq("id", categoryId).maybeSingle(),
  ]);
  if (!team || !category) throw new Error("Invalid team or category");
  return supabase;
}

export async function createRequests(
  _state: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const pm = await requireRole("PM");
  const returnTo = safeReturnPath(formData, "/requests");

  let shared: ReferencePayload;
  let date: string;
  let rows: BulkRow[];
  try {
    shared = {
      team_id: text(formData, "teamId"),
      category_id: text(formData, "categoryId"),
      // The form no longer asks who requested it; the PM entering the data is recorded instead.
      requester_id: pm.id,
      designer_id: null,
    };
    // Requests created from a team page must belong to that team.
    const lockedTeam = teamIdFromReturnPath(returnTo);
    if (lockedTeam && lockedTeam !== shared.team_id) throw new Error("Team does not match the opened team page");
    date = dateForMonth(new Date().toISOString().slice(0, 7));
    rows = bulkRows(formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid input" };
  }

  const supabase = await verifyReferences(shared);
  const year = date.slice(0, 4);
  const { error } = await supabase.from("requests").insert(
    rows.map((row) => ({
      id: crypto.randomUUID(),
      request_code: `REQ-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      notion_id: row.notionId,
      title: row.title,
      ...shared,
      request_date: date,
      deadline: date,
      completed_date: date,
      priority: "medium" as const,
      status: "done" as const,
      estimated_hours: 0,
      actual_hours: null,
      output_count: row.outputCount,
      description: null,
      figma_url: null,
      drive_url: null,
    })),
  );
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/teams");
  redirect(returnTo);
}

export async function updateRequest(formData: FormData) {
  await requireRole("PM");
  const id = text(formData, "id");
  const returnTo = safeReturnPath(formData, "/requests");
  const payload = editableRequestPayload(formData);
  const supabase = await verifyEditableReferences(payload.team_id, payload.category_id);
  const { error } = await supabase.from("requests").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/teams");
  redirect(returnTo);
}

export async function deleteRequests(formData: FormData) {
  await requireRole("PM");
  const returnTo = safeReturnPath(formData, "/requests");
  const ids = [...new Set(formData.getAll("id").map((value) => String(value).trim()).filter(Boolean))];
  if (!ids.length) throw new Error("No requests selected");
  if (ids.length > 500) throw new Error("Too many requests selected");
  // Requests deleted from a team page can only belong to that team.
  const lockedTeam = teamIdFromReturnPath(returnTo);
  const supabase = await createSupabaseServerClient();
  // Chunked so the id list stays within URL length limits.
  for (let start = 0; start < ids.length; start += 100) {
    let query = supabase.from("requests").delete().in("id", ids.slice(start, start + 100));
    if (lockedTeam) query = query.eq("team_id", lockedTeam);
    const { error } = await query;
    if (error) throw new Error(error.message);
  }
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/teams");
  redirect(returnTo);
}

export async function deleteRequest(formData: FormData) {
  await requireRole("PM");
  const id = text(formData, "id");
  const returnTo = safeReturnPath(formData, "/requests");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/teams");
  redirect(returnTo);
}
