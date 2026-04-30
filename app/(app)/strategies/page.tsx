import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StrategiesClient } from "./strategies-client";

export const dynamic = "force-dynamic";

export default async function StrategiesPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const { data: strategies } = await sb
    .from("strategies")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return <StrategiesClient initialStrategies={strategies ?? []} />;
}