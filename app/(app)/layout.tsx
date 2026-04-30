import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SuspendedOverlay } from "@/components/suspended-overlay";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  // Check for active suspension (cooldown with SUSPENDED: prefix)
  const now = new Date().toISOString();
  const { data: suspension } = await sb
    .from("cooldowns")
    .select("reason, ends_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .gt("ends_at", now)
    .ilike("reason", "SUSPENDED:%")
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex h-screen flex-col bg-background md:flex-row">
      <AppSidebar profile={profile} />
      <MobileHeader profile={profile} />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      <MobileTabBar profile={profile} />
      {suspension && (
        <SuspendedOverlay
          reason={suspension.reason ?? ""}
          endsAt={suspension.ends_at}
        />
      )}
    </div>
  );
}