"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/auth";

export function MobileHeader({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();
  async function signOut() { await supabase.auth.signOut(); router.push("/"); router.refresh(); }
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur md:hidden"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <Link href={profile.role === "admin" || profile.role === "moderator" ? "/admin" : "/dashboard"} className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><TrendingUp className="h-4 w-4" /></div>
        <div>
          <div className="text-sm font-bold leading-tight">jsontrades</div>
          <div className="text-[10px] uppercase tracking-wide text-primary leading-tight">{profile.role} · {profile.plan}</div>
        </div>
      </Link>
      <Button size="icon" variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
    </header>
  );
}
