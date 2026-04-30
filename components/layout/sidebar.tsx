"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, Shield, LogOut, TrendingUp, PlusCircle, Upload, DollarSign, CalendarDays, List, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Profile } from "@/lib/auth";

const NAV = [
  { href: "/dashboard",        label: "Dashboard",               icon: LayoutDashboard },
  { href: "/trades",           label: "Trades",                  icon: List },
  { href: "/trades/new",       label: "New Trade",               icon: PlusCircle },
  { href: "/import",           label: "Import CSV",              icon: Upload },
  { href: "/eval",             label: "Eval Expenses & Payouts", icon: DollarSign },
  { href: "/journal/calendar", label: "Playbook Calendar",       icon: CalendarDays },
  { href: "/strategies",       label: "Strategies",              icon: BookOpen },
  { href: "/settings",         label: "Settings",                icon: Settings },
];

const ADMIN_NAV = [
  { href: "/admin",        label: "Admin Home", icon: Shield },
  { href: "/admin/users",  label: "Users",      icon: Shield },
  { href: "/admin/trades", label: "All Trades", icon: TrendingUp },
];

export function AppSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = profile.role === "admin" || profile.role === "moderator";

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
      <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2 border-b p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold">JsonTrades</div>
          <div className="text-xs text-muted-foreground">Trading Platform</div>
        </div>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/trades/new" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}>
              <Icon className="h-4 w-4" />{item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <>
            <div className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</div>
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-destructive/15 text-destructive" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}>
                  <Icon className="h-4 w-4" />{item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <div>
            <div className="truncate text-sm font-medium">{profile.full_name || profile.email}</div>
            <div className="text-xs uppercase tracking-wide text-primary">{profile.role} · {profile.plan}</div>
          </div>
          <ThemeToggle />
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}