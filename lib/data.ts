import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Category } from "@/types/category";
import type { Request } from "@/types/request";
import type { Team } from "@/types/team";
import type { User } from "@/types/user";
import type { ManagedUser } from "@/types/managed-user";

function mapRequest(row: Record<string, unknown>): Request {
  return {
    id: String(row.id),
    requestCode: String(row.request_code),
    notionId: String(row.notion_id),
    title: String(row.title),
    teamId: String(row.team_id),
    categoryId: String(row.category_id),
    requesterId: String(row.requester_id),
    designerId: row.designer_id ? String(row.designer_id) : undefined,
    requestDate: String(row.request_date),
    deadline: String(row.deadline),
    completedDate: row.completed_date ? String(row.completed_date) : undefined,
    priority: row.priority as Request["priority"],
    status: row.status as Request["status"],
    estimatedHours: Number(row.estimated_hours),
    actualHours: row.actual_hours == null ? undefined : Number(row.actual_hours),
    description: row.description ? String(row.description) : undefined,
    figmaUrl: row.figma_url ? String(row.figma_url) : undefined,
    driveUrl: row.drive_url ? String(row.drive_url) : undefined,
  };
}

export async function getTeams(): Promise<Team[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, short_name")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    shortName: row.short_name,
  }));
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUsers(): Promise<User[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role, initials")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as User[];
}

export async function getRequests(): Promise<Request[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("requests").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRequest);
}

export async function getRequest(id: string): Promise<Request | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRequest(data) : null;
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const admin = createSupabaseAdminClient();
  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, username, name, role, initials")
    .order("name");
  if (profileError) throw new Error(profileError.message);
  return (profiles ?? []) as ManagedUser[];
}
