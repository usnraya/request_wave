import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User, UserRole } from "@/types/user";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, role, initials")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return profile as User | null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireRole(role: UserRole): Promise<User> {
  const user = await requireUser();
  if (user.role !== role) throw new Error("Forbidden");
  return user;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
