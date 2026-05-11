import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StrategiesClient } from "./strategies-client";

export const dynamic = "force-dynamic";

export default async function StrategiesPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: strategies }, { data: playbook }] = await Promise.all([
    sb.from("strategies").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    sb.from("playbook_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  return <StrategiesClient initialStrategies={strategies ?? []} initialPlaybook={playbook ?? []} />;
}