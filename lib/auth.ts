import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export type Role = "user" | "moderator" | "admin";
export type Plan = "free" | "pro" | "premium";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  plan: Plan;
  banned: boolean;
  banned_reason: string | null;
  last_seen: string | null;
  created_at: string;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data as Profile | null;
}

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { user, supabase };
}

export async function requireRole(allowed: Role[]) {
  const { user, supabase } = await requireAuth();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login?error=no_profile");
  if (profile.banned) redirect("/login?error=banned");
  if (!allowed.includes(profile.role as Role)) redirect("/dashboard?error=forbidden");
  // touch last_seen
  await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", user.id);
  return { user, profile: profile as Profile, supabase };
}

// API-route version: returns NextResponse on failure instead of redirecting
export async function apiRequireRole(allowed: Role[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return { error: NextResponse.json({ error: "No profile" }, { status: 403 }) };
  if (profile.banned) return { error: NextResponse.json({ error: "Banned" }, { status: 403 }) };
  if (!allowed.includes(profile.role as Role)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user, profile: profile as Profile, supabase };
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId?: string,
  details?: Record<string, unknown>,
) {
  const sb = createAdminClient();
  await sb.from("admin_logs").insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId ?? null,
    details: details ?? {},
  });
}
