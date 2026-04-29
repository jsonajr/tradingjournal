"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Settings, Shield, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/auth";

export function MobileTabBar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const isAdmin = profile.role === "admin" || profile.role === "moderator";
  const TABS = [
    { href: "/dashboard", label: "Home",     icon: LayoutDashboard },
    { href: "/journal",   label: "Journal",  icon: BookOpen },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
    { href: "/settings",  label: "Settings", icon: Settings },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-around">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = pathname === t.href || (t.href !== "/dashboard" && pathname.startsWith(t.href));
          return (
            <Link key={t.href} href={t.href} className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}>
              <Icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
              <span className="text-[10px]">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
