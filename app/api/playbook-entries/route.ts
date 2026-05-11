import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { user } = await requireRole(["user","moderator","admin"]);
  const sb = await createClient();
  const { data, error } = await sb.from("playbook_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { user } = await requireRole(["user","moderator","admin"]);
  const sb = await createClient();
  const body = await req.json();
  const { data, error } = await sb.from("playbook_entries").insert({
    user_id: user.id,
    type: body.type,
    title: body.title,
    description: body.description || null,
    screenshot_url: body.screenshot_url || null,
    tags: body.tags ?? [],
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { user } = await requireRole(["user","moderator","admin"]);
  const sb = await createClient();
  const body = await req.json();
  const { data, error } = await sb.from("playbook_entries").update({
    title: body.title,
    description: body.description || null,
    screenshot_url: body.screenshot_url || null,
    tags: body.tags ?? [],
    updated_at: new Date().toISOString(),
  }).eq("id", body.id).eq("user_id", user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { user } = await requireRole(["user","moderator","admin"]);
  const sb = await createClient();
  const { id } = await req.json();
  const { error } = await sb.from("playbook_entries").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}