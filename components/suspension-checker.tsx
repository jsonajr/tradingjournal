"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SuspendedOverlay } from "@/components/suspended-overlay";

export function SuspensionChecker({ userId, initialSuspension }: {
  userId: string;
  initialSuspension: { reason: string; ends_at: string } | null;
}) {
  const [suspension, setSuspension] = useState(initialSuspension);
  const supabase = createClient();

  useEffect(() => {
    // Poll every 30 seconds
    const check = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("cooldowns")
        .select("reason, ends_at")
        .eq("user_id", userId)
        .eq("is_active", true)
        .gt("ends_at", now)
        .ilike("reason", "SUSPENDED:%")
        .order("ends_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSuspension(data ?? null);
    };

    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (!suspension) return null;
  return <SuspendedOverlay reason={suspension.reason} endsAt={suspension.ends_at} />;
}