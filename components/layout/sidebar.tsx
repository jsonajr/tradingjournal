"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, Shield, LogOut, TrendingUp, DollarSign, CalendarDays, List, BookOpen, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import type { Profile } from "@/lib/auth";

const NAV = [
  { href: "/dashboard",        label: "Dashboard",               icon: LayoutDashboard },
  { href: "/trades",           label: "Trades",                  icon: List },
  { href: "/journal/calendar", label: "Playbook Calendar",       icon: CalendarDays },
  { href: "/eval",             label: "Prop Expenses & Payouts", icon: DollarSign },
  { href: "/strategies",       label: "Strategies",              icon: BookOpen },
  { href: "/insights",         label: "Insights",                icon: BarChart2 },
  { href: "/settings",         label: "Settings",                icon: Settings },
];

const ADMIN_NAV = [
  { href: "/admin",         label: "Admin Home", icon: Shield },
  { href: "/admin/users",   label: "Users",      icon: Shield },
  { href: "/admin/trades",  label: "All Trades", icon: TrendingUp },
  { href: "/admin/invites", label: "Invites",    icon: Shield },
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
    if (!confirm("Are you sure you want to sign out?")) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className={cn(
      "hidden shrink-0 md:flex",
      collapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "flex flex-col m-3 rounded-2xl border bg-card shadow-lg transition-all duration-200 overflow-hidden flex-1",
        collapsed ? "w-14" : "w-full"
      )}>
      <div className={cn("flex items-center border-b", collapsed ? "justify-center p-3" : "justify-between p-4")}>
        {!collapsed && (
          <a href="https://www.tradiator.net" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="7" fill="#111827"/>
              <rect x="4" y="7" width="24" height="4.5" rx="1.5" fill="#FFDE28"/>
              <polygon points="16,5 23,14 19.5,14 19.5,27 12.5,27 12.5,14 9,14" fill="#FFDE28"/>
            </svg>
            <span className="text-sm font-black tracking-tight" style={{color:'#FFE133'}}>TRADIATOR</span>
          </a>
        )}
        {collapsed && (
          <a href="https://www.tradiator.net" className="hover:opacity-80 transition-opacity">
            <svg width="22" height="22" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="7" fill="#111827"/>
              <rect x="4" y="7" width="24" height="4.5" rx="1.5" fill="#FFDE28"/>
              <polygon points="16,5 23,14 19.5,14 19.5,27 12.5,27 12.5,14 9,14" fill="#FFDE28"/>
            </svg>
          </a>
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

        {/* Discord separator + button */}
        <div className="my-1 border-t border-border" />
        <a href="https://discord.gg/uuyAxCavGd" target="_blank" rel="noopener noreferrer"
          title={collapsed ? "Join Discord" : undefined}
          className={cn(
            "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors text-[#5865F2] hover:bg-[#5865F2]/10",
            collapsed ? "justify-center" : "gap-3 px-3"
          )}>
          <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          {!collapsed && "Join Discord"}
        </a>

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
            <div className="text-xs uppercase tracking-wide text-primary">{profile.plan}</div>
          </div>
        )}
        <div className={cn("flex", collapsed ? "flex-col gap-1" : "items-center justify-between")}>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
    </aside>
  );
}