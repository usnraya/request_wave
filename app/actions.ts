"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { dateForMonth, parseBulkRows, type BulkRow } from "@/lib/bulk-requests";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requestPriorities, requestStatuses, type RequestPriority, type RequestStatus } from "@/types/request";

function text(formData: FormData, name: string, required = true): string {
  const value = String(formData.get(name) ?? "").trim();
  if (required && !value) throw new Error(`${name} is required`);
  return value;
}

function optional(formData: FormData, name: string): string | null {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function optionalUrl(formData: FormData, name: string): string | null {
  const value = optional(formData, name);
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
  } catch {
    throw new Error(`Invalid ${name}`);
  }
  return value;
}

function choice<T extends readonly string[]>(value: string, values: T, name: string): T[number] {
  if (!values.includes(value)) throw new Error(`Invalid ${name}`);
  return value as T[number];
}

function numberValue(formData: FormData, name: string, optionalValue = false): number | null {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw && optionalValue) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid ${name}`);
  return value;
}

type ReferencePayload = {
  team_id: string;
  category_id: string;
  requester_id: string;
  designer_id: string | null;
};

function requestPayload(formData: FormData) {
  return {
    request_code: text(formData, "requestCode"),
    notion_id: text(formData, "notionId", false),
    title: text(formData, "title"),
    team_id: text(formData, "teamId"),
    category_id: text(formData, "categoryId"),
    requester_id: text(formData, "requesterId"),
    designer_id: optional(formData, "designerId"),
    request_date: text(formData, "requestDate"),
    deadline: text(formData, "deadline"),
    completed_date: optional(formData, "completedDate"),
    priority: choice(text(formData, "priority"), requestPriorities, "priority") as RequestPriority,
    status: choice(text(formData, "status"), requestStatuses, "status") as RequestStatus,
    estimated_hours: numberValue(formData, "estimatedHours"),
    actual_hours: numberValue(formData, "actualHours", true),
    description: optional(formData, "description"),
    figma_url: optionalUrl(formData, "figmaUrl"),
    drive_url: optionalUrl(formData, "driveUrl"),
  };
}

function bulkRows(formData: FormData): BulkRow[] {
  return parseBulkRows(
    formData.getAll("title").map(String),
    formData.getAll("notionId").map(String),
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

export async function createRequests(
  _state: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const pm = await requireRole("PM");

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
    date = dateForMonth(text(formData, "month"));
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
      description: null,
      figma_url: null,
      drive_url: null,
    })),
  );
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/teams");
  redirect("/requests");
}

export async function updateRequest(formData: FormData) {
  await requireRole("PM");
  const id = text(formData, "id");
  const payload = requestPayload(formData);
  const supabase = await verifyReferences(payload);
  const { error } = await supabase.from("requests").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/teams");
  redirect("/requests");
}

export async function deleteRequest(formData: FormData) {
  await requireRole("PM");
  const id = text(formData, "id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("requests").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/teams");
  redirect("/requests");
}
