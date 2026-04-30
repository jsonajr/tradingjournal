import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvitesClient } from "./invites-client";

export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  await requireRole(["admin", "moderator"]);
  const sb = createAdminClient();
  const { data: invites } = await sb
    .from("invite_codes")
    .select("*, creator:created_by(email), usedBy:used_by(email)")
    .order("created_at", { ascending: false })
    .limit(200);
  return <InvitesClient invites={invites ?? []} />;
}