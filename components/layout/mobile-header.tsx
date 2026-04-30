"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/auth";

export function MobileHeader({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = profile.role === "admin" || profile.role === "moderator";
  async function signOut() { await supabase.auth.signOut(); router.push("/"); router.refresh(); }
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur md:hidden"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">JsonTrades</div>
          <div className="text-[10px] uppercase tracking-wide text-primary leading-tight">{profile.role} · {profile.plan}</div>
        </div>
      </Link>
      <div className="flex items-center gap-1">
        {isAdmin && (
          <Button size="icon" variant="ghost" asChild>
            <Link href="/admin"><Shield className="h-4 w-4 text-amber-500" /></Link>
          </Button>
        )}
        <ThemeToggle />
        <Button size="icon" variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}