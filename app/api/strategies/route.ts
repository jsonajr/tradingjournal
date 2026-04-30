import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const { data, error } = await sb
    .from("strategies")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const body = await req.json();

  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await sb
    .from("strategies")
    .insert({
      user_id:     user.id,
      name:        body.name.trim(),
      description: body.description || null,
      conditions:  body.conditions  || null,
      confluences: body.confluences || null,
      notes:       body.notes       || null,
      sessions:    body.sessions    || [],
      timeframes:  body.timeframes  || [],
      tags:        body.tags        || [],
      color:       body.color       || "#8b5cf6",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const body = await req.json();

  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await sb
    .from("strategies")
    .update({
      name:        body.name.trim(),
      description: body.description || null,
      conditions:  body.conditions  || null,
      confluences: body.confluences || null,
      notes:       body.notes       || null,
      sessions:    body.sessions    || [],
      timeframes:  body.timeframes  || [],
      tags:        body.tags        || [],
      color:       body.color       || "#8b5cf6",
    })
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const { id } = await req.json();
  const { error } = await sb
    .from("strategies")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}