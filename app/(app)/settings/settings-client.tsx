"use client";
import { useState, useEffect } from "react";
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
type UserSettings = { user_id: string; timezone: string; default_currency: string; show_commissions: boolean; accent_color: string; notification_email: boolean; notification_in_app: boolean; post_trade_popup_enabled: boolean } | null;
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
  const [postTradePopup, setPostTradePopup] = useState(settings?.post_trade_popup_enabled ?? true);

  async function saveProfile() {
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    router.refresh();
  }

  async function savePreferences() {
    const { error } = await supabase.from("user_settings").upsert({ user_id: profile.id, timezone: tz, default_currency: currency, post_trade_popup_enabled: postTradePopup });
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
                  <SelectContent className="max-h-72">
                    <SelectItem value="Pacific/Midway">UTC-11 – Midway Island</SelectItem>
                    <SelectItem value="Pacific/Honolulu">UTC-10 – Hawaii (HST)</SelectItem>
                    <SelectItem value="America/Anchorage">UTC-9 – Alaska (AKST)</SelectItem>
                    <SelectItem value="America/Los_Angeles">UTC-8 – Pacific (PT)</SelectItem>
                    <SelectItem value="America/Denver">UTC-7 – Mountain (MT)</SelectItem>
                    <SelectItem value="America/Phoenix">UTC-7 – Arizona (no DST)</SelectItem>
                    <SelectItem value="America/Chicago">UTC-6 – Central (CT)</SelectItem>
                    <SelectItem value="America/New_York">UTC-5 – Eastern (ET)</SelectItem>
                    <SelectItem value="America/Toronto">UTC-5 – Toronto</SelectItem>
                    <SelectItem value="America/Halifax">UTC-4 – Atlantic (AT)</SelectItem>
                    <SelectItem value="America/Sao_Paulo">UTC-3 – São Paulo</SelectItem>
                    <SelectItem value="America/Argentina/Buenos_Aires">UTC-3 – Buenos Aires</SelectItem>
                    <SelectItem value="Atlantic/Azores">UTC-1 – Azores</SelectItem>
                    <SelectItem value="Europe/London">UTC+0 – London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Lisbon">UTC+0 – Lisbon</SelectItem>
                    <SelectItem value="Africa/Casablanca">UTC+0 – Casablanca</SelectItem>
                    <SelectItem value="Europe/Paris">UTC+1 – Paris / Berlin (CET)</SelectItem>
                    <SelectItem value="Europe/Amsterdam">UTC+1 – Amsterdam</SelectItem>
                    <SelectItem value="Europe/Madrid">UTC+1 – Madrid</SelectItem>
                    <SelectItem value="Europe/Rome">UTC+1 – Rome</SelectItem>
                    <SelectItem value="Africa/Lagos">UTC+1 – Lagos</SelectItem>
                    <SelectItem value="Europe/Helsinki">UTC+2 – Helsinki (EET)</SelectItem>
                    <SelectItem value="Europe/Athens">UTC+2 – Athens</SelectItem>
                    <SelectItem value="Europe/Bucharest">UTC+2 – Bucharest</SelectItem>
                    <SelectItem value="Africa/Cairo">UTC+2 – Cairo</SelectItem>
                    <SelectItem value="Africa/Johannesburg">UTC+2 – Johannesburg</SelectItem>
                    <SelectItem value="Europe/Istanbul">UTC+3 – Istanbul</SelectItem>
                    <SelectItem value="Asia/Riyadh">UTC+3 – Riyadh</SelectItem>
                    <SelectItem value="Africa/Nairobi">UTC+3 – Nairobi</SelectItem>
                    <SelectItem value="Europe/Moscow">UTC+3 – Moscow</SelectItem>
                    <SelectItem value="Asia/Tehran">UTC+3:30 – Tehran</SelectItem>
                    <SelectItem value="Asia/Dubai">UTC+4 – Dubai</SelectItem>
                    <SelectItem value="Asia/Baku">UTC+4 – Baku</SelectItem>
                    <SelectItem value="Asia/Kabul">UTC+4:30 – Kabul</SelectItem>
                    <SelectItem value="Asia/Karachi">UTC+5 – Karachi (PKT)</SelectItem>
                    <SelectItem value="Asia/Tashkent">UTC+5 – Tashkent</SelectItem>
                    <SelectItem value="Asia/Kolkata">UTC+5:30 – India (IST)</SelectItem>
                    <SelectItem value="Asia/Colombo">UTC+5:30 – Sri Lanka</SelectItem>
                    <SelectItem value="Asia/Kathmandu">UTC+5:45 – Kathmandu</SelectItem>
                    <SelectItem value="Asia/Dhaka">UTC+6 – Dhaka</SelectItem>
                    <SelectItem value="Asia/Almaty">UTC+6 – Almaty</SelectItem>
                    <SelectItem value="Asia/Rangoon">UTC+6:30 – Yangon</SelectItem>
                    <SelectItem value="Asia/Bangkok">UTC+7 – Bangkok (ICT)</SelectItem>
                    <SelectItem value="Asia/Jakarta">UTC+7 – Jakarta</SelectItem>
                    <SelectItem value="Asia/Ho_Chi_Minh">UTC+7 – Ho Chi Minh</SelectItem>
                    <SelectItem value="Asia/Shanghai">UTC+8 – China (CST)</SelectItem>
                    <SelectItem value="Asia/Hong_Kong">UTC+8 – Hong Kong</SelectItem>
                    <SelectItem value="Asia/Singapore">UTC+8 – Singapore</SelectItem>
                    <SelectItem value="Asia/Taipei">UTC+8 – Taipei</SelectItem>
                    <SelectItem value="Australia/Perth">UTC+8 – Perth</SelectItem>
                    <SelectItem value="Asia/Tokyo">UTC+9 – Tokyo (JST)</SelectItem>
                    <SelectItem value="Asia/Seoul">UTC+9 – Seoul</SelectItem>
                    <SelectItem value="Australia/Adelaide">UTC+9:30 – Adelaide</SelectItem>
                    <SelectItem value="Australia/Darwin">UTC+9:30 – Darwin</SelectItem>
                    <SelectItem value="Australia/Sydney">UTC+10 – Sydney (AEST)</SelectItem>
                    <SelectItem value="Australia/Brisbane">UTC+10 – Brisbane</SelectItem>
                    <SelectItem value="Pacific/Guam">UTC+10 – Guam</SelectItem>
                    <SelectItem value="Australia/Lord_Howe">UTC+10:30 – Lord Howe</SelectItem>
                    <SelectItem value="Pacific/Noumea">UTC+11 – Noumea</SelectItem>
                    <SelectItem value="Pacific/Auckland">UTC+12 – Auckland (NZST)</SelectItem>
                    <SelectItem value="Pacific/Fiji">UTC+12 – Fiji</SelectItem>
                    <SelectItem value="Pacific/Tongatapu">UTC+13 – Tonga</SelectItem>
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
            <div className="col-span-1 md:col-span-2 flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="text-sm font-medium">Post-Trade Reflection Popup</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Show a reflection checklist after every logged trade</div>
                </div>
                <button
                  onClick={() => setPostTradePopup((v) => !v)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                    postTradePopup ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform",
                    postTradePopup ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
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

      {tab === "sessions" && <SessionsTab timezone={tz} />}

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

  // Auto font size based on viewport
  useEffect(() => {
    function applyAutoFont() {
      const w = window.innerWidth;
      const size = w < 375 ? "13px" : w < 768 ? "15px" : w < 1280 ? "15px" : "16px";
      document.documentElement.style.fontSize = size;
    }
    applyAutoFont();
    window.addEventListener("resize", applyAutoFont);
    return () => window.removeEventListener("resize", applyAutoFont);
  }, []);

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

    </div>
  );
}