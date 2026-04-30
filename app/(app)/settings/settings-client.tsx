"use client";
import { useState } from "react";
import { SessionsTab } from "./sessions-tab";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, User, Wallet, Settings as SettingsIcon, CreditCard, AlertTriangle, Palette, Shield } from "lucide-react";
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
  const [tab, setTab] = useState<"profile" | "accounts" | "preferences" | "subscription" | "danger" | "theme" | "sessions">("profile");
  const [clearingTrades, setClearingTrades] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
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

  async function clearAllTrades() {
    if (!confirm("Are you sure you want to delete ALL your trades? This cannot be undone.")) return;
    if (!confirm("Final confirmation — this will permanently delete every trade in your account.")) return;
    setClearingTrades(true);
    const { error } = await supabase.from("trades").delete().eq("user_id", profile.id);
    setClearingTrades(false);
    if (error) { toast.error(error.message); return; }
    toast.success("All trades deleted");
    router.refresh();
  }

  async function deleteUserAccount() {
    if (!confirm(
      "⚠️ Delete your account?\n\nThis will permanently delete:\n• All your trades and journal entries\n• All trading accounts\n• Your profile and preferences\n• Your login credentials\n\nThis action CANNOT be undone."
    )) return;
    if (!confirm(
      "🚨 Final warning\n\nYou are about to permanently erase everything tied to your account. There is no recovery option.\n\nAre you absolutely sure you want to continue?"
    )) return;
    const typed = prompt("Type DELETE to confirm:");
    if (typed !== "DELETE") { toast.error("Cancelled — you must type DELETE to confirm."); return; }
    setDeletingAccount(true);
    const res = await fetch("/api/delete-account", { method: "DELETE" });
    setDeletingAccount(false);
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "Failed to delete account");
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
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
        <TabBtn active={tab === "theme"} onClick={() => setTab("theme")}><Palette className="mr-1 h-3.5 w-3.5" />Theme</TabBtn>
        <TabBtn active={tab === "sessions"} onClick={() => setTab("sessions")}><Shield className="mr-1 h-3.5 w-3.5" />Sessions</TabBtn>
        <TabBtn active={tab === "danger"} onClick={() => setTab("danger")}><AlertTriangle className="mr-1 h-3.5 w-3.5 text-destructive" /><span className="text-destructive">Danger Zone</span></TabBtn>
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

      {tab === "danger" && (
        <div className="space-y-4">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" />Danger Zone</CardTitle>
              <CardDescription>These actions are irreversible. Please proceed with caution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div>
                  <div className="font-medium text-sm">Clear All Trades</div>
                  <div className="text-xs text-muted-foreground">Permanently delete all trades from your account. This cannot be undone.</div>
                </div>
                <Button variant="destructive" size="sm" onClick={clearAllTrades} disabled={clearingTrades}>
                  {clearingTrades ? "Deleting..." : "Clear All Trades"}
                </Button>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-sm">Delete Account</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Permanently and irreversibly deletes your account. Cannot be undone.</div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={deleteUserAccount} disabled={deletingAccount} className="shrink-0">
                    {deletingAccount ? "Deleting..." : "Delete Account"}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5 border-t border-destructive/20 pt-3">
                  <div className="font-medium text-destructive mb-1">The following will be permanently deleted:</div>
                  <div>• All trades and journal entries</div>
                  <div>• All trading accounts and their history</div>
                  <div>• Your profile, preferences, and settings</div>
                  <div>• Your login credentials and session data</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "theme" && (
        <ThemePanel profile={profile} />
      )}

      {tab === "sessions" && <SessionsTab />}

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

const ACCENT_COLORS = [
  { name: "Purple", value: "#8b5cf6" },
  { name: "Blue",   value: "#3b82f6" },
  { name: "Green",  value: "#22c55e" },
  { name: "Amber",  value: "#f59e0b" },
  { name: "Red",    value: "#ef4444" },
  { name: "Cyan",   value: "#06b6d4" },
  { name: "Pink",   value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
];

function ThemePanel({ profile: _profile }: { profile: Profile }) {
  function setAccent(hex: string) {
    const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h = 0, s = 0; const l = (max+min)/2;
    if (max !== min) {
      const d = max - min; s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch(max) { case r: h=(g-b)/d+(g<b?6:0); break; case g: h=(b-r)/d+2; break; case b: h=(r-g)/d+4; break; }
      h /= 6;
    }
    const hsl = `${Math.round(h*360)} ${Math.round(s*100)}% ${Math.round(l*100)}%`;
    document.documentElement.style.setProperty("--primary", hsl);
    try { localStorage.setItem("tj_accent", hex); } catch {}
  }

  function setFontSize(type: "desktop" | "mobile", size: string) {
    const key = type === "desktop" ? "tj_fontsize_desktop" : "tj_fontsize_mobile";
    try { localStorage.setItem(key, size); } catch {}
    const isMobile = window.innerWidth < 768;
    if ((type === "mobile" && isMobile) || (type === "desktop" && !isMobile)) {
      document.documentElement.style.fontSize = size;
    }
  }

  const SIZE_OPTS = [
    { label: "Small", size: "13px" },
    { label: "Default", size: "16px" },
    { label: "Large", size: "18px" },
    { label: "XL", size: "20px" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" />Accent Color</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Choose your accent color. Applied immediately and saved.</p>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((c) => (
              <button key={c.value} onClick={() => setAccent(c.value)} className="flex flex-col items-center gap-1.5 group">
                <div className="h-10 w-10 rounded-full border-2 border-white/20 shadow-lg transition-transform group-hover:scale-110" style={{ background: c.value }} />
                <span className="text-[10px] text-muted-foreground">{c.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" />Desktop Text Size</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Adjust base font size for desktop. Applied immediately.</p>
          <div className="flex gap-2 flex-wrap">
            {SIZE_OPTS.map((o) => (
              <button key={o.size} onClick={() => setFontSize("desktop", o.size)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                {o.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" />Mobile Text Size</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Adjust base font size for mobile. Applied immediately.</p>
          <div className="flex gap-2 flex-wrap">
            {SIZE_OPTS.map((o) => (
              <button key={o.size} onClick={() => setFontSize("mobile", o.size)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                {o.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}