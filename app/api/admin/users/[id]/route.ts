import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole, logAdminAction } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await apiRequireRole(["admin"]);
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const action = body.action as string;
  const sb = createAdminClient();

  switch (action) {
    case "ban":
      await sb.from("profiles").update({ banned: true, banned_at: new Date().toISOString(), banned_reason: body.reason ?? "Admin action" }).eq("id", id);
      await sb.auth.admin.signOut(id, "global");
      await logAdminAction(auth.profile.id, "ban_user", id, { reason: body.reason });
      return NextResponse.json({ message: "User banned" });
    case "unban":
      await sb.from("profiles").update({ banned: false, banned_at: null, banned_reason: null }).eq("id", id);
      await logAdminAction(auth.profile.id, "unban_user", id);
      return NextResponse.json({ message: "User unbanned" });
    case "set_role": {
      const role = body.role as string;
      if (!["user", "moderator", "admin"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      await sb.from("profiles").update({ role }).eq("id", id);
      await logAdminAction(auth.profile.id, "set_role", id, { role });
      return NextResponse.json({ message: `Role updated to ${role}` });
    }
    case "set_plan": {
      const plan = body.plan as string;
      if (!["free", "pro", "premium"].includes(plan)) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      await sb.from("profiles").update({ plan }).eq("id", id);
      await sb.from("subscriptions").upsert({ user_id: id, plan, status: plan === "free" ? "inactive" : "active" }, { onConflict: "user_id" });
      await logAdminAction(auth.profile.id, "set_plan", id, { plan });
      return NextResponse.json({ message: `Plan updated to ${plan}` });
    }
    case "force_logout":
      await sb.auth.admin.signOut(id, "global");
      await logAdminAction(auth.profile.id, "force_logout", id);
      return NextResponse.json({ message: "Sessions revoked" });
    case "set_cooldown": {
      const hours = parseFloat(body.hours);
      if (!hours || hours <= 0) return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
      const endsAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      await sb.from("cooldowns").insert({
        user_id: id, reason: body.reason ?? "Admin override", ends_at: endsAt,
        created_by: auth.profile.id, is_active: true,
      });
      await logAdminAction(auth.profile.id, "force_cooldown", id, { hours, reason: body.reason });
      return NextResponse.json({ message: `Cooldown until ${endsAt}` });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await apiRequireRole(["admin"]);
  if ("error" in auth) return auth.error;
  if (id === auth.profile.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  const sb = createAdminClient();
  const { error } = await sb.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAdminAction(auth.profile.id, "delete_user", id);
  return NextResponse.json({ message: "User deleted" });
}
