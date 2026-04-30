"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, Shield, LogOut, TrendingUp, PlusCircle, Upload, DollarSign, CalendarDays, List, BookOpen, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import type { Profile } from "@/lib/auth";

const NAV = [
  { href: "/dashboard",        label: "Dashboard",               icon: LayoutDashboard },
  { href: "/trades",           label: "Trades",                  icon: List },
  { href: "/trades/new",       label: "New Trade",               icon: PlusCircle },
  { href: "/import",           label: "Import CSV",              icon: Upload },
  { href: "/eval",             label: "Eval Expenses & Payouts", icon: DollarSign },
  { href: "/journal/calendar", label: "Playbook Calendar",       icon: CalendarDays },
  { href: "/strategies",       label: "Strategies",              icon: BookOpen },
  { href: "/insights",         label: "Insights",                icon: BarChart2 },
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tj_sidebar");
    if (stored === "collapsed") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("tj_sidebar", next ? "collapsed" : "expanded");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className={cn(
      "hidden shrink-0 flex-col border-r bg-card transition-all duration-200 md:flex",
      collapsed ? "w-14" : "w-60"
    )}>
      {/* Header - no logo, just collapse toggle */}
      <div className={cn("flex items-center border-b", collapsed ? "justify-center p-3" : "justify-between p-4")}>
        {!collapsed && (
          <span className="text-sm font-bold text-foreground">jsontrades</span>
        )}
        <button onClick={toggleCollapse} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/trades/new" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "gap-3 px-3",
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}>
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <>
            {!collapsed && <div className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</div>}
            {collapsed && <div className="my-1 border-t border-border" />}
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                    collapsed ? "justify-center" : "gap-3 px-3",
                    active ? "bg-destructive/15 text-destructive" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className={cn("border-t p-2", collapsed ? "flex flex-col items-center gap-1" : "p-3")}>
        {!collapsed && (
          <div className="mb-2 px-2">
            <div className="truncate text-sm font-medium">{profile.full_name || profile.email}</div>
            <div className="text-xs uppercase tracking-wide text-primary">{profile.role} · {profile.plan}</div>
          </div>
        )}
        <div className={cn("flex", collapsed ? "flex-col gap-1" : "items-center justify-between")}>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}