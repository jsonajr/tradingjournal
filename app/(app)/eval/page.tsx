import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EvalClient } from "./eval-client";

export const dynamic = "force-dynamic";

export default async function EvalPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: expenses }, { data: payouts }] = await Promise.all([
    sb.from("eval_expenses").select("*").eq("user_id", user.id).order("date", { ascending: false }),
    sb.from("eval_payouts").select("*").eq("user_id", user.id).order("date", { ascending: false }),
  ]);

  return (
    <EvalClient
      initialExpenses={expenses ?? []}
      initialPayouts={payouts ?? []}
    />
  );
}