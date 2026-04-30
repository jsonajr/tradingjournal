"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ban, Shield, Trash2, LogOut, Clock, PauseCircle, PlayCircle, Trash } from "lucide-react";
import { toast } from "sonner";

type User = { id: string; email: string; role: string; plan: string; banned: boolean; suspended?: boolean };

export function UserActions({ user, isSuspended }: { user: User; isSuspended?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cooldownOpen, setCooldownOpen] = useState(false);
  const [banConfirmOpen, setBanConfirmOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [hours, setHours] = useState("2");
  const [reason, setReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [suspendHours, setSuspendHours] = useState("24");
  const [suspendReason, setSuspendReason] = useState("");

  function call(action: string, body: Record<string, unknown> = {}) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success(data.message ?? "Done");
      router.refresh();
    });
  }

  function deleteUser() {
    if (!confirm(`Permanently delete ${user.email}? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Failed"); return; }
      toast.success("User deleted");
      router.push("/admin/users");
    });
  }

  function clearUserTrades() {
    if (!confirm(`Delete ALL trades for ${user.email}? This cannot be undone.`)) return;
    call("clear_trades");
  }

  function applyCooldown() {
    const h = parseFloat(hours);
    if (!h || h <= 0) { toast.error("Enter valid hours"); return; }
    call("set_cooldown", { hours: h, reason: reason || "Admin override" });
    setCooldownOpen(false); setReason("");
  }

  function confirmBan() {
    call(user.banned ? "unban" : "ban", { reason: banReason || "Admin action" });
    setBanConfirmOpen(false); setBanReason("");
  }

  function applySuspend() {
    const h = parseFloat(suspendHours);
    if (!h || h <= 0) { toast.error("Enter valid hours"); return; }
    if (!suspendReason.trim()) { toast.error("Reason is required"); return; }
    call("suspend", { hours: h, reason: suspendReason });
    setSuspendOpen(false); setSuspendReason("");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Role selector — admin role blocked, only SQL */}
      <Select
        value={user.role === "admin" ? "admin" : user.role}
        onValueChange={(role) => {
          if (role === "admin") { toast.error("Admin role can only be assigned via SQL"); return; }
          call("set_role", { role });
        }}
        disabled={isPending}
      >
        <SelectTrigger className="w-[140px]"><Shield className="mr-2 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="moderator">Moderator</SelectItem>
          <SelectItem value="admin" disabled>Admin (SQL only)</SelectItem>
        </SelectContent>
      </Select>

      {/* Plan selector */}
      <Select value={user.plan} onValueChange={(plan) => call("set_plan", { plan })} disabled={isPending}>
        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="premium">Premium</SelectItem>
        </SelectContent>
      </Select>

      {/* Cooldown */}
      <Dialog open={cooldownOpen} onOpenChange={setCooldownOpen}>
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => setCooldownOpen(true)}>
          <Clock className="mr-1 h-3.5 w-3.5" />Cooldown
        </Button>
        <DialogContent>
          <DialogHeader><DialogTitle>Force Cooldown</DialogTitle><DialogDescription>Lock {user.email} from trading.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Hours</Label><Input type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCooldownOpen(false)}>Cancel</Button>
            <Button onClick={applyCooldown}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend / Unsuspend */}
      {isSuspended ? (
        <Button variant="outline" size="sm" disabled={isPending} onClick={() => call("unsuspend")}
          className="border-green-500/50 text-green-500 hover:bg-green-500/10">
          <PlayCircle className="mr-1 h-3.5 w-3.5" />Unsuspend
        </Button>
      ) : (
        <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
          <Button variant="outline" size="sm" disabled={isPending} onClick={() => setSuspendOpen(true)}
            className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10">
            <PauseCircle className="mr-1 h-3.5 w-3.5" />Suspend
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend Account</DialogTitle>
              <DialogDescription>The user can still log in but will see a suspension screen with your reason.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Reason shown to user <span className="text-destructive">*</span></Label>
                <Input value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="e.g. Violation of trading rules..." autoFocus />
                <p className="text-xs text-muted-foreground">This message will be displayed on the user&apos;s screen.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (hours)</Label>
                <Input type="number" min="1" step="1" value={suspendHours} onChange={(e) => setSuspendHours(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSuspendOpen(false)}>Cancel</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={applySuspend} disabled={!suspendReason.trim()}>
                Suspend Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Force logout */}
      <Button variant="outline" size="sm" onClick={() => call("force_logout")} disabled={isPending}>
        <LogOut className="mr-1 h-3.5 w-3.5" />Force Logout
      </Button>

      {/* Clear trades */}
      <Button variant="outline" size="sm" onClick={clearUserTrades} disabled={isPending} className="border-destructive/50 text-destructive hover:bg-destructive/10">
        <Trash className="mr-1 h-3.5 w-3.5" />Clear Trades
      </Button>

      {/* Ban with confirm */}
      <Dialog open={banConfirmOpen} onOpenChange={setBanConfirmOpen}>
        <Button variant={user.banned ? "outline" : "destructive"} size="sm" disabled={isPending} onClick={() => setBanConfirmOpen(true)}>
          <Ban className="mr-1 h-3.5 w-3.5" />{user.banned ? "Unban" : "Ban"}
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user.banned ? "Unban" : "Ban"} {user.email}?</DialogTitle>
            <DialogDescription>
              {user.banned
                ? "This will restore the user's access to the platform."
                : "This will permanently block the user and revoke all their sessions."}
            </DialogDescription>
          </DialogHeader>
          {!user.banned && (
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="e.g. Violation of terms of service" />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBanConfirmOpen(false)}>Cancel</Button>
            <Button variant={user.banned ? "default" : "destructive"} onClick={confirmBan}>
              {user.banned ? "Confirm Unban" : "Confirm Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Button variant="destructive" size="sm" onClick={deleteUser} disabled={isPending}>
        <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
      </Button>
    </div>
  );
}