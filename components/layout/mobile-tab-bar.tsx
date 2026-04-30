"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, CalendarDays, Settings, BookOpen, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/auth";

export function MobileTabBar({ profile: _ }: { profile: Profile }) {
  const pathname = usePathname();
  const TABS = [
    { href: "/dashboard",        label: "Home",       icon: LayoutDashboard },
    { href: "/trades",           label: "Trades",     icon: List },
    { href: "/journal/calendar", label: "Calendar",   icon: CalendarDays },
    { href: "/insights",         label: "Insights",   icon: BarChart2 },
    { href: "/strategies",       label: "Strategies", icon: BookOpen },
    { href: "/settings",         label: "Settings",   icon: Settings },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex justify-around overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = pathname === t.href || (t.href !== "/dashboard" && pathname.startsWith(t.href));
          return (
            <Link key={t.href} href={t.href} className={cn("flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              <Icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
              <span className="text-[9px] truncate w-full text-center px-0.5">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}