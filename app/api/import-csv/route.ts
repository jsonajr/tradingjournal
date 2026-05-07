import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCSV, type Platform } from "@/lib/csv";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { csv, platform, account_id } = await request.json();
  if (!csv || !platform) return NextResponse.json({ error: "Missing csv or platform" }, { status: 400 });
  if (!account_id) return NextResponse.json({ error: "Account ID is required" }, { status: 400 });

  const parsed = parseCSV(csv, platform as Platform);
  if (!parsed.length) return NextResponse.json({ error: "No trades parsed. Check the CSV format." }, { status: 400 });

  // Fetch auto_commission setting — used as fallback when CSV has no commission
  const { data: userSettings } = await supabase
    .from("user_settings")
    .select("auto_commission")
    .eq("user_id", user.id)
    .maybeSingle();
  const autoCommission: number | null = userSettings?.auto_commission ?? null;

  const rows = parsed.map((t) => ({
    user_id: user.id,
    account_id,
    trade_date: t.trade_date,
    symbol: t.symbol,
    direction: t.direction,
    contracts: t.contracts,
    entry_price: t.entry_price || null,
    exit_price: t.exit_price || null,
    stop_price: t.stop_price || null,
    pnl: t.pnl,
    // Use CSV commission if present, fall back to auto_commission setting
    commission: t.commission > 0 ? t.commission : (autoCommission ?? 0),
    r_multiple: t.r_multiple,
    setup: t.setup,
    grade: t.grade,
  }));

  const { error } = await supabase.from("trades").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, imported: rows.length });
}