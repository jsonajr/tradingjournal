"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, User, Wallet, Settings as SettingsIcon, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Profile } from "@/lib/auth";

type Account = { id: string; user_id: string; name: string; type: string; firm: string | null; size: string | null; platform: string | null; status: string | null; balance: string | null; start_date: string | null; notes: string | null };
type UserSettings = { user_id: string; timezone: string; default_currency: string; show_commissions: boolean; accent_color: string; notification_email: boolean; notification_in_app: boolean } | null;
type Subscription = { plan: string; status: string; current_period_end: string | null; cancel_at_period_end: boolean } | null;

export function SettingsClient({ profile, accounts: initialAccounts, settings, subscription }: { profile: Profile; accounts: Account[]; settings: UserSettings; subscription: Subscription }) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<"profile" | "accounts" | "preferences" | "subscription">("profile");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<Account>>({});

  // Profile state
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Settings state
  const [tz, setTz] = useState(settings?.timezone ?? "America/New_York");
  const [currency, setCurrency] = useState(settings?.default_currency ?? "USD");

  async function saveProfile() {
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    router.refresh();
  }

  async function savePreferences() {
    const { error } = await supabase.from("user_settings").upsert({ user_id: profile.id, timezone: tz, default_currency: currency });
    if (error) { toast.error(error.message); return; }
    toast.success("Preferences saved");
    router.refresh();
  }

  function openNewAccount() {
    setEditingAccount({ type: "eval", status: "active" });
    setAccountDialogOpen(true);
  }
  function openEditAccount(a: Account) {
    setEditingAccount(a);
    setAccountDialogOpen(true);
  }
  async function saveAccount() {
    if (!editingAccount.name) { toast.error("Name required"); return; }
    if (editingAccount.id) {
      const { error } = await supabase.from("accounts").update({
        name: editingAccount.name, type: editingAccount.type, firm: editingAccount.firm,
        size: editingAccount.size, platform: editingAccount.platform, status: editingAccount.status,
        balance: editingAccount.balance, start_date: editingAccount.start_date, notes: editingAccount.notes,
      }).eq("id", editingAccount.id);
      if (error) { toast.error(error.message); return; }
      setAccounts(accounts.map((a) => a.id === editingAccount.id ? { ...a, ...editingAccount } as Account : a));
      toast.success("Account updated");
    } else {
      const { data, error } = await supabase.from("accounts").insert({
        user_id: profile.id,
        name: editingAccount.name, type: editingAccount.type ?? "eval", firm: editingAccount.firm,
        size: editingAccount.size, platform: editingAccount.platform, status: editingAccount.status ?? "active",
        balance: editingAccount.balance, start_date: editingAccount.start_date, notes: editingAccount.notes,
      }).select().single();
      if (error) { toast.error(error.message); return; }
      setAccounts([data as Account, ...accounts]);
      toast.success("Account added");
    }
    setAccountDialogOpen(false);
    router.refresh();
  }
  async function deleteAccount(id: string) {
    if (!confirm("Remove this account? Its trades will be unlinked but not deleted.")) return;
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setAccounts(accounts.filter((a) => a.id !== id));
    toast.success("Account removed");
    router.refresh();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b">
        <TabBtn active={tab === "profile"} onClick={() => setTab("profile")}><User className="mr-1 h-3.5 w-3.5" />Profile</TabBtn>
        <TabBtn active={tab === "accounts"} onClick={() => setTab("accounts")}><Wallet className="mr-1 h-3.5 w-3.5" />Accounts</TabBtn>
        <TabBtn active={tab === "preferences"} onClick={() => setTab("preferences")}><SettingsIcon className="mr-1 h-3.5 w-3.5" />Preferences</TabBtn>
        <TabBtn active={tab === "subscription"} onClick={() => setTab("subscription")}><CreditCard className="mr-1 h-3.5 w-3.5" />Subscription</TabBtn>
      </div>

      {tab === "profile" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Personal Info</CardTitle><CardDescription>Shown in dashboard and reports</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5"><Label>Email</Label><Input value={profile.email} disabled /></div>
              <div className="space-y-1.5"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Role</Label><Input value={profile.role.toUpperCase()} disabled /></div>
              <div className="space-y-1.5"><Label>Plan</Label><Input value={profile.plan.toUpperCase()} disabled /></div>
            </div>
            <Button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Profile"}</Button>
          </CardContent>
        </Card>
      )}

      {tab === "accounts" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle className="text-sm">Trading Accounts</CardTitle><CardDescription>Funded, evaluation, live, or PA accounts</CardDescription></div>
            <Button size="sm" onClick={openNewAccount}><Plus className="mr-1 h-4 w-4" />Add Account</Button>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="rounded-md border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                No accounts yet. Add one to start logging trades.
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold",
                      a.type === "funded" ? "bg-green-500/15 text-green-500" :
                      a.type === "eval"   ? "bg-blue-500/15 text-blue-500"   :
                      a.type === "live"   ? "bg-amber-500/15 text-amber-500" :
                      "bg-primary/15 text-primary",
                    )}>
                      {a.type === "funded" ? "F" : a.type === "eval" ? "E" : a.type === "live" ? "L" : "PA"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{[a.firm, a.size, a.platform].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                    {a.balance && <span className="text-sm font-bold text-green-500">{a.balance}</span>}
                    <Badge variant={a.status === "active" ? "success" : a.status === "passed" ? "default" : a.status === "failed" ? "destructive" : "secondary"}>{a.status ?? "active"}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => openEditAccount(a)}>Edit</Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteAccount(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "preferences" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={tz} onValueChange={setTz}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Default Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={savePreferences}>Save Preferences</Button>
          </CardContent>
        </Card>
      )}

      {tab === "subscription" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Your Subscription</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={subscription?.plan === "premium" ? "default" : subscription?.plan === "pro" ? "warning" : "secondary"} className="text-sm">{(subscription?.plan ?? profile.plan).toUpperCase()}</Badge>
              <Badge variant={subscription?.status === "active" || subscription?.status === "trialing" ? "success" : "outline"}>{subscription?.status ?? "inactive"}</Badge>
              {subscription?.current_period_end && (
                <span className="text-sm text-muted-foreground">Renews {new Date(subscription.current_period_end).toLocaleDateString()}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Want to upgrade or change your plan? View pricing and switch plans on our pricing page.
            </p>
            <Button asChild><Link href="/pricing">View Pricing</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Account dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAccount.id ? "Edit" : "Add"} Account</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>Account Name</Label><Input value={editingAccount.name ?? ""} onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })} placeholder="e.g. Apex 50K" /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={editingAccount.type ?? "eval"} onValueChange={(v) => setEditingAccount({ ...editingAccount, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="funded">Funded</SelectItem>
                  <SelectItem value="eval">Evaluation</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="pa">PA / Profit Split</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editingAccount.status ?? "active"} onValueChange={(v) => setEditingAccount({ ...editingAccount, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Firm</Label><Input value={editingAccount.firm ?? ""} onChange={(e) => setEditingAccount({ ...editingAccount, firm: e.target.value })} placeholder="e.g. Apex, Topstep" /></div>
            <div className="space-y-1.5"><Label>Size</Label><Input value={editingAccount.size ?? ""} onChange={(e) => setEditingAccount({ ...editingAccount, size: e.target.value })} placeholder="$50,000" /></div>
            <div className="space-y-1.5"><Label>Platform</Label><Input value={editingAccount.platform ?? ""} onChange={(e) => setEditingAccount({ ...editingAccount, platform: e.target.value })} placeholder="Tradovate" /></div>
            <div className="space-y-1.5"><Label>Balance</Label><Input value={editingAccount.balance ?? ""} onChange={(e) => setEditingAccount({ ...editingAccount, balance: e.target.value })} placeholder="$52,400" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveAccount}>{editingAccount.id ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
