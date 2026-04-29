import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calcRMultiple } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const r_multiple = calcRMultiple(
    parseFloat(body.entry_price) || 0,
    parseFloat(body.exit_price) || 0,
    parseFloat(body.stop_price) || 0,
    body.direction,
  );

  const { data, error } = await supabase.from("trades").insert({
    user_id: user.id,
    account_id: body.account_id || null,
    trade_date: body.trade_date,
    symbol: body.symbol,
    direction: body.direction,
    contracts: body.contracts || 1,
    entry_price: body.entry_price || null,
    exit_price: body.exit_price || null,
    stop_price: body.stop_price || null,
    pnl: body.pnl || 0,
    commission: body.commission || 0,
    r_multiple,
    setup: body.setup || null,
    session: body.session || null,
    grade: body.grade || null,
    notes: body.notes || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trade: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  const { error } = await supabase.from("trades").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
