import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole, logAdminAction } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const auth = await apiRequireRole(["admin"]);
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const sb = createAdminClient();
  const { error } = await sb.from("cooldown_rules").insert({
    name: body.name, trigger_type: body.trigger_type, threshold: body.threshold,
    duration_minutes: body.duration_minutes, is_enabled: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAdminAction(auth.profile.id, "create_cooldown_rule", undefined, body);
  return NextResponse.json({ message: "Rule added" });
}

export async function PATCH(request: NextRequest) {
  const auth = await apiRequireRole(["admin"]);
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const sb = createAdminClient();
  await sb.from("cooldown_rules").update({ is_enabled: body.is_enabled }).eq("id", body.id);
  await logAdminAction(auth.profile.id, "toggle_cooldown_rule", undefined, body);
  return NextResponse.json({ message: "Rule updated" });
}

export async function DELETE(request: NextRequest) {
  const auth = await apiRequireRole(["admin"]);
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const sb = createAdminClient();
  await sb.from("cooldown_rules").delete().eq("id", body.id);
  await logAdminAction(auth.profile.id, "delete_cooldown_rule", undefined, { id: body.id });
  return NextResponse.json({ message: "Rule deleted" });
}
