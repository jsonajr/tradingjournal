import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ImportClient } from "./import-client";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const { data: accounts } = await sb.from("accounts").select("id, name, firm").eq("user_id", user.id).order("name");
  return <ImportClient accounts={accounts ?? []} />;
}