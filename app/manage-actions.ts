"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeUsername, usernamePattern } from "@/lib/username";
import type { UserRole } from "@/types/user";

const roles: UserRole[] = ["PM", "VIEWER"];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function parseRole(formData: FormData): UserRole {
  const role = value(formData, "role");
  if (!roles.includes(role as UserRole)) throw new Error("Invalid role");
  return role as UserRole;
}

function parseProfile(formData: FormData) {
  const name = value(formData, "name");
  const initials = value(formData, "initials").toUpperCase();
  if (!name) throw new Error("Name is required");
  if (!/^[A-Z0-9]{1,4}$/.test(initials)) {
    throw new Error("Initials must be 1–4 letters or numbers");
  }
  return { name, initials, role: parseRole(formData) };
}

function parseUsername(username: string) {
  const normalized = normalizeUsername(username);
  if (!usernamePattern.test(normalized)) {
    throw new Error("Username must be 3–32 characters: letters, numbers, _ or -");
  }
  return normalized;
}

function internalEmail(username: string) {
  return `${username}@users.requestwave.internal`;
}

function parsePassword(password: string, required: boolean) {
  if (!password && !required) return undefined;
  if (password.length < 8) throw new Error("Password must be at least 8 characters");
  return password;
}

function revalidateManagement() {
  revalidatePath("/manage");
  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath("/teams");
}

function categoryName(formData: FormData): string {
  const name = value(formData, "name");
  if (!name) throw new Error("Work area name is required");
  if (name.length > 80) throw new Error("Work area name must be 80 characters or fewer");
  return name;
}

function categoryId(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "category";
  return `${slug}-${crypto.randomUUID().slice(0, 8)}`;
}

function categoryError(error: { code?: string; message: string }): Error {
  return error.code === "23505"
    ? new Error("A work area with this name already exists")
    : new Error(error.message);
}

function teamName(formData: FormData): string {
  const name = value(formData, "name");
  if (!name) throw new Error("Team name is required");
  if (name.length > 80) throw new Error("Team name must be 80 characters or fewer");
  return name;
}

function teamId(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "team";
  return `${slug}-${crypto.randomUUID().slice(0, 8)}`;
}

function teamShortName(name: string): string {
  const short = name.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 4);
  return short || "TEAM";
}

function teamError(error: { code?: string; message: string }): Error {
  return error.code === "23505"
    ? new Error("A team with this name already exists")
    : new Error(error.message);
}

export async function createManagedUser(formData: FormData) {
  await requireRole("PM");
  const username = parseUsername(value(formData, "username"));
  const password = parsePassword(value(formData, "password"), true)!;
  const profile = parseProfile(formData);
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) throw new Error("Username is already taken");

  const { data, error } = await admin.auth.admin.createUser({
    email: internalEmail(username),
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(error?.message ?? "Could not create user");

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    username,
    ...profile,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(profileError.message);
  }
  revalidateManagement();
}

export async function updateManagedUser(formData: FormData) {
  const currentUser = await requireRole("PM");
  const id = value(formData, "id");
  if (!id) throw new Error("User ID is required");
  const profile = parseProfile(formData);
  const username = parseUsername(value(formData, "username"));
  const password = parsePassword(value(formData, "password"), false);
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing && existing.id !== id) throw new Error("Username is already taken");

  if (currentUser.id === id && profile.role !== "PM") {
    throw new Error("You cannot remove your own PM access");
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ ...profile, username })
    .eq("id", id);
  if (profileError) throw new Error(profileError.message);
  if (password) {
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) throw new Error(error.message);
  }
  revalidateManagement();
}

export async function deleteManagedUser(formData: FormData) {
  const currentUser = await requireRole("PM");
  const id = value(formData, "id");
  if (!id) throw new Error("User ID is required");
  if (currentUser.id === id) throw new Error("You cannot delete your own account");
  const supabase = await createSupabaseServerClient();
  const { count, error: requestError } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .or(`requester_id.eq.${id},designer_id.eq.${id}`);
  if (requestError) throw new Error(requestError.message);
  if (count) throw new Error("This user is referenced by existing requests");
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  revalidateManagement();
}

export async function createCategory(formData: FormData) {
  await requireRole("PM");
  const name = categoryName(formData);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").insert({
    id: categoryId(name),
    name,
  });
  if (error) throw categoryError(error);
  revalidateManagement();
}

export async function updateCategory(formData: FormData) {
  await requireRole("PM");
  const id = value(formData, "id");
  if (!id) throw new Error("Work area ID is required");
  const name = categoryName(formData);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").update({ name }).eq("id", id);
  if (error) throw categoryError(error);
  revalidateManagement();
}

export async function deleteCategory(formData: FormData) {
  await requireRole("PM");
  const id = value(formData, "id");
  if (!id) throw new Error("Work area ID is required");
  const supabase = await createSupabaseServerClient();
  const { count, error: requestError } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (requestError) throw new Error(requestError.message);
  if (count) throw new Error("This work area is referenced by existing requests");
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateManagement();
}

export async function createTeam(formData: FormData) {
  await requireRole("PM");
  const name = teamName(formData);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("teams").insert({
    id: teamId(name),
    name,
    short_name: teamShortName(name),
  });
  if (error) throw teamError(error);
  revalidateManagement();
}

export async function updateTeam(formData: FormData) {
  await requireRole("PM");
  const id = value(formData, "id");
  if (!id) throw new Error("Team ID is required");
  const name = teamName(formData);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("teams")
    .update({ name, short_name: teamShortName(name) })
    .eq("id", id);
  if (error) throw teamError(error);
  revalidateManagement();
}

export async function deleteTeam(formData: FormData) {
  await requireRole("PM");
  const id = value(formData, "id");
  if (!id) throw new Error("Team ID is required");
  const supabase = await createSupabaseServerClient();
  const { count, error: requestError } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("team_id", id);
  if (requestError) throw new Error(requestError.message);
  if (count) throw new Error("This team is referenced by existing requests");
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateManagement();
}
