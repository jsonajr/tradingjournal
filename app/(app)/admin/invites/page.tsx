import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvitesClient } from "./invites-client";

export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  await requireRole(["admin", "moderator"]);
  const sb = createAdminClient();

  const [{ data: invites }, { data: profiles }] = await Promise.all([
    sb.from("invite_codes")
      .select("id, code, note, created_at, expires_at, creator:created_by(email)")
      .order("created_at", { ascending: false })
      .limit(200),
    // Count how many profiles used each invite code (stored in raw_user_meta_data)
    sb.from("profiles").select("id"),
  ]);

  // Count signups per invite code by checking auth users metadata
  const { data: authUsers } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const useCounts: Record<string, number> = {};
  (authUsers?.users ?? []).forEach(u => {
    const code = u.user_metadata?.invite_code;
    if (code) useCounts[code] = (useCounts[code] ?? 0) + 1;
  });

  const enriched = (invites ?? []).map(inv => ({
    ...inv,
    creator: Array.isArray(inv.creator) ? (inv.creator[0] ?? null) : inv.creator,
    useCount: useCounts[inv.code] ?? 0,
  }));

  return <InvitesClient invites={enriched} />;
}