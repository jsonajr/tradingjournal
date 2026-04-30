import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const { data, error } = await sb
    .from("eval_payouts")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const body = await req.json();
  const { data, error } = await sb
    .from("eval_payouts")
    .insert({ user_id: user.id, date: body.date, firm: body.firm || null, amount: body.amount, note: body.note || null })
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
    .from("eval_payouts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}