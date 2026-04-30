import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { SuspendedOverlay } from "@/components/suspended-overlay";
import { FreeBanner } from "@/components/free-banner";
import { headers } from "next/headers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? hdrs.get("x-invoke-path") ?? "";

  // Block free users from all pages except dashboard and settings
  const FREE_ALLOWED = ["/dashboard", "/settings"];
  const isFree = profile.plan === "free";
  const isBlocked = isFree && !FREE_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Check for active suspension
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
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {isFree && <FreeBanner />}
        {isBlocked ? <UpgradeRequired /> : children}
      </main>
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

function UpgradeRequired() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="text-4xl mb-4">🔒</div>
      <h2 className="text-2xl font-bold mb-2">Upgrade Required</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        This feature is not available on the free plan. Contact your admin to get your account upgraded.
      </p>
      <a href="/settings" className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
        Go to Settings
      </a>
    </div>
  );
}