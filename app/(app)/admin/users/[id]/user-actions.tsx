"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ban, Shield, Trash2, LogOut, Clock } from "lucide-react";
import { toast } from "sonner";

type User = { id: string; email: string; role: string; plan: string; banned: boolean };

export function UserActions({ user }: { user: User }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cooldownOpen, setCooldownOpen] = useState(false);
  const [hours, setHours] = useState("2");
  const [reason, setReason] = useState("");

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
    if (!confirm(`Permanently delete ${user.email}?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Failed"); return; }
      toast.success("User deleted");
      router.push("/admin/users");
    });
  }

  function applyCooldown() {
    const h = parseFloat(hours);
    if (!h || h <= 0) { toast.error("Enter valid hours"); return; }
    call("set_cooldown", { hours: h, reason: reason || "Admin override" });
    setCooldownOpen(false); setReason("");
  }

  function clearUserTrades() {
    if (!confirm(`Delete ALL trades for ${user.email}? This cannot be undone.`)) return;
    call("clear_trades");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={user.role} onValueChange={(role) => call("set_role", { role })} disabled={isPending}>
        <SelectTrigger className="w-[140px]"><Shield className="mr-2 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="moderator">Moderator</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Select value={user.plan} onValueChange={(plan) => call("set_plan", { plan })} disabled={isPending}>
        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="premium">Premium</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={clearUserTrades} disabled={isPending} className="border-destructive/50 text-destructive hover:bg-destructive/10">
        <Trash2 className="mr-1 h-3.5 w-3.5" />Clear Trades
      </Button>
      <Dialog open={cooldownOpen} onOpenChange={setCooldownOpen}>
        <DialogTrigger asChild><Button variant="outline" size="sm" disabled={isPending}><Clock className="mr-1 h-3.5 w-3.5" />Cooldown</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Force Cooldown</DialogTitle><DialogDescription>Locks {user.email} from trading.</DialogDescription></DialogHeader>
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
      <Button variant="outline" size="sm" onClick={() => call("force_logout")} disabled={isPending}><LogOut className="mr-1 h-3.5 w-3.5" />Force Logout</Button>
      <Button variant={user.banned ? "outline" : "destructive"} size="sm" onClick={() => call(user.banned ? "unban" : "ban")} disabled={isPending}><Ban className="mr-1 h-3.5 w-3.5" />{user.banned ? "Unban" : "Ban"}</Button>
      <Button variant="destructive" size="sm" onClick={deleteUser} disabled={isPending}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
    </div>
  );
}