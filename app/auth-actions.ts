"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
type LoginRole = "PM" | "VIEWER";

async function resolveAccountEmails(): Promise<Record<LoginRole, string>> {
  const admin = createSupabaseAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, role")
    .in("role", ["PM", "VIEWER"]);
  if (error || !profiles || profiles.length !== 2) {
    throw new Error("Invalid credentials");
  }

  const emails = {} as Record<LoginRole, string>;
  for (const profile of profiles) {
    const role = profile.role as LoginRole;
    if (role !== "PM" && role !== "VIEWER") {
      throw new Error("Invalid credentials");
    }
    if (emails[role]) throw new Error("Invalid credentials");

    const { data, error: authError } = await admin.auth.admin.getUserById(
      profile.id,
    );
    if (authError || !data.user?.email) throw new Error("Invalid credentials");
    emails[role] = data.user.email;
  }

  if (!emails.PM || !emails.VIEWER) throw new Error("Invalid credentials");
  return emails;
}

export async function signIn(password: string): Promise<boolean> {
  if (typeof password !== "string" || !password) return false;

  try {
    const emails = await resolveAccountEmails();
    const supabase = await createSupabaseServerClient();
    const attempts = await Promise.all(
      (["VIEWER", "PM"] as const).map(async (role) => {
        const { error } = await supabase.auth.signInWithPassword({
          email: emails[role],
          password,
        });
        return !error;
      }),
    );
    return attempts.some(Boolean);
  } catch {
    return false;
  }
}
