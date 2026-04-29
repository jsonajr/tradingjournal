import { requireRole } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { MobileHeader } from "@/components/layout/mobile-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Allow all roles into the app — admin pages have their own check
  const { profile } = await requireRole(["user", "moderator", "admin"]);
  return (
    <div className="flex h-screen flex-col bg-background md:flex-row">
      <AppSidebar profile={profile} />
      <MobileHeader profile={profile} />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>
      <MobileTabBar profile={profile} />
    </div>
  );
}
