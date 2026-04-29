import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { user, profile } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: accounts }, { data: settings }, { data: subscription }] = await Promise.all([
    sb.from("accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    sb.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    sb.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return <SettingsClient profile={profile} accounts={accounts ?? []} settings={settings} subscription={subscription} />;
}
