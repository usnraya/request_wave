"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { dateForMonth, parseBulkRows, type BulkRow } from "@/lib/bulk-requests";
import {
  classifyMarkdownRows,
  existingKey,
  maxMarkdownRows,
  parseTaskMarkdown,
  summarizeMarkdownRows,
} from "@/lib/markdown-import";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category } from "@/types/category";
import type { Team } from "@/types/team";

// Re-parses and re-classifies server-side; the client preview is never trusted.
async function getMarkdownContext(formData: FormData, onlyTeamId?: string) {
  const markdown = text(formData, "markdown");
  const month = `${text(formData, "year")}-${text(formData, "month")}`;
  const sourceRows = parseTaskMarkdown(markdown);
  if (!sourceRows.length) throw new Error("No DESIGN rows found in the Markdown file");
  if (sourceRows.length > maxMarkdownRows) throw new Error(`Import at most ${maxMarkdownRows} rows at a time`);

  const supabase = await createSupabaseServerClient();
  const ids = [...new Set(sourceRows.map((row) => row.notionId))];
  const [{ data: categories, error: categoryError }, { data: teams, error: teamError }, existingResult] = await Promise.all([
    supabase.from("categories").select("id,name").order("name"),
    supabase.from("teams").select("id,name,short_name"),
    supabase.from("requests").select("team_id,notion_id").in("notion_id", ids),
  ]);
  const failure = categoryError ?? teamError ?? existingResult.error;
  if (failure) throw new Error(failure.message);

  const rows = classifyMarkdownRows(sourceRows, {
    month,
    teams: (teams ?? []).map((t) => ({ id: t.id, name: t.name, shortName: t.short_name })) as Team[],
    categories: (categories ?? []) as Category[],
    existing: new Set((existingResult.data ?? []).map((r) => existingKey(r.team_id, r.notion_id))),
    onlyTeamId,
  });
  return { supabase, rows, summary: summarizeMarkdownRows(rows), year: month.slice(0, 4) };
}

export async function previewMarkdownImport(formData: FormData) {
  await requireRole("PM");
  try {
    const { rows, summary } = await getMarkdownContext(formData, optional(formData, "onlyTeamId") ?? undefined);
    return { rows, summary };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid Markdown import" };
  }
}

export async function importMarkdownRequests(_state: { error?: string } | null, formData: FormData) {
  const pm = await requireRole("PM");
  const returnTo = safeReturnPath(formData, "/requests");
  // On a team page only that team's entries may be imported.
  const lockedTeam = teamIdFromReturnPath(returnTo) ?? undefined;
  let context: Awaited<ReturnType<typeof getMarkdownContext>>;
  try {
    context = await getMarkdownContext(formData, lockedTeam);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid Markdown import" };
  }
  const { supabase, rows, summary, year } = context;
  const newRows = rows.filter((row) => row.status === "new");
  if (!newRows.length) return { error: `No new requests to import (${summary.duplicateRows} duplicate, ${summary.invalidRows} invalid)` };
  const { error } = await supabase.from("requests").insert(newRows.map((row) => ({
    id: crypto.randomUUID(),
    request_code: `REQ-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    notion_id: row.notionId,
    title: row.title,
    team_id: row.teamId,
    category_id: row.categoryId,
    requester_id: pm.id,
    designer_id: null,
    request_date: row.date,
    deadline: row.date,
    completed_date: row.date,
    priority: "medium" as const,
    status: "done" as const,
    estimated_hours: 0,
    actual_hours: null,
    output_count: row.outputCount,
    description: `Source: Markdown import. Deadline reference: ${row.deadline}. Usage Location: ${row.usage}. Work Area: ${row.workArea}.`,
    figma_url: null,
    drive_url: null,
  })));
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/requests");
  revalidatePath("/teams");
  redirect(returnTo);
}

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
    date = dateForMonth(`${text(formData, "year")}-${text(formData, "month")}`);
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
