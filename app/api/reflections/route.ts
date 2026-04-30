import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { error } = await supabase.from("post_trade_reflections").insert({
    user_id: user.id,
    trade_id: body.trade_id ?? null,
    trade_result: body.trade_result,
    followed_setup: body.followed_setup,
    emotional_trade: body.emotional_trade,
    revenge_trade: body.revenge_trade,
    needs_break: body.needs_break,
    executed_plan: body.executed_plan,
    checklist: body.checklist,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}