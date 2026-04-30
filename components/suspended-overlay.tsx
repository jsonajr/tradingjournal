"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuspendedOverlayProps {
  reason: string;
  endsAt: string;
}

export function SuspendedOverlay({ reason, endsAt }: SuspendedOverlayProps) {
  const router = useRouter();
  const supabase = createClient();
  const endsDate = new Date(endsAt);
  const now = new Date();
  const msLeft = endsDate.getTime() - now.getTime();
  const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
  const minutesLeft = Math.ceil(msLeft / (1000 * 60));

  const timeLeft = hoursLeft >= 1
    ? `${hoursLeft} hour${hoursLeft > 1 ? "s" : ""}`
    : `${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}`;

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Strip the "SUSPENDED: " prefix from reason
  const displayReason = reason.replace(/^SUSPENDED:\s*/i, "");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-zinc-900 shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 bg-amber-500/15 px-6 py-6">
          <PauseCircle className="h-10 w-10 text-amber-400" />
        </div>

        <div className="px-8 py-6 text-center space-y-3">
          <h2 className="text-2xl font-black text-amber-400">Account Suspended</h2>
          <p className="text-sm text-zinc-400">
            Your account has been temporarily suspended by an administrator.
          </p>

          {displayReason && (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3">
              <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Reason</div>
              <div className="text-sm text-zinc-300">{displayReason}</div>
            </div>
          )}

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="text-xs text-amber-500/70 uppercase tracking-wide mb-1">Suspension Ends</div>
            <div className="text-base font-bold text-amber-400">
              {endsDate.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">~{timeLeft} remaining</div>
          </div>

          <p className="text-xs text-zinc-500">
            If you believe this is a mistake, please contact support.
          </p>
        </div>

        <div className="px-8 pb-8">
          <Button onClick={signOut} variant="outline" className="w-full border-zinc-700 text-zinc-400 hover:text-foreground">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}