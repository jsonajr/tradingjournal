import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calcRMultiple } from "@/lib/utils";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const entry_price = body.entry_price != null && body.entry_price !== "" ? parseFloat(body.entry_price) : null;
  const exit_price  = body.exit_price  != null && body.exit_price  !== "" ? parseFloat(body.exit_price)  : null;
  const stop_price  = body.stop_price  != null && body.stop_price  !== "" ? parseFloat(body.stop_price)  : null;
  const r_multiple  = calcRMultiple(
    entry_price ?? 0,
    exit_price  ?? 0,
    stop_price  ?? 0,
    body.direction ?? "Long",
  );

  const { data, error } = await supabase
    .from("trades")
    .update({
      trade_date:  body.trade_date,
      account_id:  body.account_id  || null,
      symbol:      body.symbol,
      direction:   body.direction,
      contracts:   parseInt(body.contracts)  || 1,
      pnl:         parseFloat(body.pnl)      || 0,
      commission:  parseFloat(body.commission) || 0,
      entry_price,
      exit_price,
      stop_price,
      r_multiple,
      setup:   body.setup   || null,
      session: body.session || null,
      grade:   body.grade   || null,
      notes:   body.notes   || null,
      blown_account: body.blown_account ?? false,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trade: data });
}