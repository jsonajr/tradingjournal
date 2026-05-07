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
import { Plus, Trash2, User, Wallet, Settings as SettingsIcon, CreditCard, AlertTriangle, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Profile } from "@/lib/auth";

type Account = { id: string; user_id: string; name: string; type: string; firm: string | null; size: string | null; platform: string | null; status: string | null; balance: string | null; start_date: string | null; notes: string | null };
type UserSettings = { user_id: string; timezone: string; default_currency: string; show_commissions: boolean; accent_color: string; notification_email: boolean; notification_in_app: boolean; post_trade_popup_enabled: boolean; auto_commission: number | null } | null;
type Subscription = { plan: string; status: string; current_period_end: string | null; cancel_at_period_end: boolean } | null;

export function SettingsClient({ profile, accounts: initialAccounts, settings, subscription }: { profile: Profile; accounts: Account[]; settings: UserSettings; subscription: Subscription }) {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<"profile" | "accounts" | "preferences" | "subscription" | "danger" | "sessions">("profile");
  const [clearingTrades, setClearingTrades] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<Account>>({});

  // Profile state
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function changePassword() {
    if (!newPassword || newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message); return; }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated successfully");
  }

  // Settings state
  const [tz, setTz] = useState(settings?.timezone ?? "America/New_York");
  const [currency, setCurrency] = useState(settings?.default_currency ?? "USD");
  const [language, setLanguage] = useState((settings as any)?.language ?? "en");
  const [postTradePopup, setPostTradePopup] = useState(settings?.post_trade_popup_enabled ?? true);
  const [autoCommission, setAutoCommission] = useState<string>(settings?.auto_commission != null ? String(settings.auto_commission) : "");

  async function saveProfile() {
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    router.refresh();
  }

  async function savePreferences() {
    const commVal = autoCommission !== "" ? parseFloat(autoCommission) : null;
    const { error } = await supabase.from("user_settings").upsert({ user_id: profile.id, timezone: tz, default_currency: currency, post_trade_popup_enabled: postTradePopup, language, auto_commission: commVal });
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

  async function toggleAccountBlown(id: string, currentlyBlown: boolean) {
    const newStatus = currentlyBlown ? "active" : "failed";
    const { error } = await supabase.from("accounts").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    setAccounts(accounts.map((a) => a.id === id ? { ...a, status: newStatus } : a));
    toast.success(currentlyBlown ? "Account restored to active" : "Account marked as blown 💥");
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
        <TabBtn active={tab === "sessions"} onClick={() => setTab("sessions")}><Shield className="mr-1 h-3.5 w-3.5" />Sessions</TabBtn>
        <TabBtn active={tab === "danger"} onClick={() => setTab("danger")}><AlertTriangle className="mr-1 h-3.5 w-3.5 text-destructive" /><span className="text-destructive">Danger Zone</span></TabBtn>
      </div>

      {tab === "profile" && (
        <div className="space-y-4">
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

        <Card>
          <CardHeader><CardTitle className="text-sm">Change Password</CardTitle><CardDescription>Update your account password</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
            {newPassword && newPassword.length < 8 && (
              <p className="text-xs text-destructive">Password must be at least 8 characters</p>
            )}
            <Button
              onClick={changePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? "Updating…" : "Update Password"}
            </Button>
          </CardContent>
        </Card>
        </div>
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
                    <div className="relative">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold",
                        a.status === "failed" ? "bg-red-500/15 text-red-500 opacity-60" :
                        a.type === "funded" ? "bg-green-500/15 text-green-500" :
                        a.type === "eval"   ? "bg-blue-500/15 text-blue-500"   :
                        a.type === "live"   ? "bg-amber-500/15 text-amber-500" :
                        "bg-primary/15 text-primary",
                      )}>
                        {a.status === "failed" ? "💥" : a.type === "funded" ? "F" : a.type === "eval" ? "E" : a.type === "live" ? "L" : "PA"}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{[a.firm, a.size, a.platform].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                    {a.balance && <span className="text-sm font-bold text-green-500">{a.balance}</span>}
                    <Badge variant={a.status === "active" ? "success" : a.status === "passed" ? "default" : a.status === "failed" ? "destructive" : "secondary"}>{a.status ?? "active"}</Badge>
                    {(a.type === "eval" || a.type === "funded") && (
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={a.status === "failed"}
                          onChange={() => toggleAccountBlown(a.id, a.status === "failed")}
                          className="h-4 w-4 rounded border-input accent-red-500"
                        />
                        <span className="text-xs text-muted-foreground">Blown</span>
                      </label>
                    )}
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
                    <SelectItem value="Pacific/Midway">Midway Island</SelectItem>
                    <SelectItem value="Pacific/Honolulu">Hawaii (HST)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska (AKST/AKDT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time – Los Angeles (PT)</SelectItem>
                    <SelectItem value="America/Vancouver">Pacific Time – Vancouver (PT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time – Denver (MT)</SelectItem>
                    <SelectItem value="America/Phoenix">Mountain Time – Arizona (no DST)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time – Chicago (CT)</SelectItem>
                    <SelectItem value="America/Mexico_City">Central Time – Mexico City</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time – New York (ET)</SelectItem>
                    <SelectItem value="America/Toronto">Eastern Time – Toronto (ET)</SelectItem>
                    <SelectItem value="America/Detroit">Eastern Time – Detroit (ET)</SelectItem>
                    <SelectItem value="America/Halifax">Atlantic Time – Halifax (AT)</SelectItem>
                    <SelectItem value="America/Puerto_Rico">Atlantic Time – Puerto Rico (no DST)</SelectItem>
                    <SelectItem value="America/St_Johns">Newfoundland – St. John's (NST)</SelectItem>
                    <SelectItem value="America/Sao_Paulo">Brasília – São Paulo (BRT)</SelectItem>
                    <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (ART, no DST)</SelectItem>
                    <SelectItem value="America/Santiago">Santiago (CLT)</SelectItem>
                    <SelectItem value="America/Bogota">Bogotá / Lima / Quito (COT, no DST)</SelectItem>
                    <SelectItem value="America/Caracas">Caracas (VET)</SelectItem>
                    <SelectItem value="Atlantic/Azores">Azores (AZOT)</SelectItem>
                    <SelectItem value="Atlantic/Cape_Verde">Cape Verde (CVT, no DST)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Lisbon">Lisbon (WET/WEST)</SelectItem>
                    <SelectItem value="Africa/Casablanca">Casablanca (WET)</SelectItem>
                    <SelectItem value="Africa/Abidjan">Abidjan / Accra (GMT, no DST)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris / Berlin / Rome (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Amsterdam">Amsterdam (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Madrid">Madrid (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Zurich">Zurich / Geneva (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Stockholm">Stockholm (CET/CEST)</SelectItem>
                    <SelectItem value="Africa/Lagos">Lagos / West Africa (WAT, no DST)</SelectItem>
                    <SelectItem value="Europe/Helsinki">Helsinki / Tallinn (EET/EEST)</SelectItem>
                    <SelectItem value="Europe/Athens">Athens (EET/EEST)</SelectItem>
                    <SelectItem value="Europe/Bucharest">Bucharest (EET/EEST)</SelectItem>
                    <SelectItem value="Europe/Kiev">Kyiv (EET/EEST)</SelectItem>
                    <SelectItem value="Africa/Cairo">Cairo (EET, no DST)</SelectItem>
                    <SelectItem value="Africa/Johannesburg">Johannesburg (SAST, no DST)</SelectItem>
                    <SelectItem value="Europe/Istanbul">Istanbul (TRT, no DST)</SelectItem>
                    <SelectItem value="Asia/Riyadh">Riyadh / Bahrain / Kuwait (AST, no DST)</SelectItem>
                    <SelectItem value="Africa/Nairobi">Nairobi / East Africa (EAT, no DST)</SelectItem>
                    <SelectItem value="Europe/Moscow">Moscow (MSK, no DST)</SelectItem>
                    <SelectItem value="Asia/Tehran">Tehran (IRST/IRDT)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai / Abu Dhabi (GST, no DST)</SelectItem>
                    <SelectItem value="Asia/Baku">Baku (AZT)</SelectItem>
                    <SelectItem value="Asia/Kabul">Kabul (AFT, no DST)</SelectItem>
                    <SelectItem value="Asia/Karachi">Karachi (PKT, no DST)</SelectItem>
                    <SelectItem value="Asia/Tashkent">Tashkent (UZT, no DST)</SelectItem>
                    <SelectItem value="Asia/Kolkata">India – Mumbai / Delhi (IST, no DST)</SelectItem>
                    <SelectItem value="Asia/Colombo">Colombo / Sri Lanka (SLST, no DST)</SelectItem>
                    <SelectItem value="Asia/Kathmandu">Kathmandu (NPT, no DST)</SelectItem>
                    <SelectItem value="Asia/Dhaka">Dhaka (BST, no DST)</SelectItem>
                    <SelectItem value="Asia/Almaty">Almaty (ALMT, no DST)</SelectItem>
                    <SelectItem value="Asia/Rangoon">Yangon (MMT, no DST)</SelectItem>
                    <SelectItem value="Asia/Bangkok">Bangkok / Jakarta / Hanoi (ICT, no DST)</SelectItem>
                    <SelectItem value="Asia/Shanghai">China – Beijing / Shanghai (CST, no DST)</SelectItem>
                    <SelectItem value="Asia/Hong_Kong">Hong Kong (HKT, no DST)</SelectItem>
                    <SelectItem value="Asia/Singapore">Singapore (SGT, no DST)</SelectItem>
                    <SelectItem value="Asia/Taipei">Taipei (CST, no DST)</SelectItem>
                    <SelectItem value="Asia/Kuala_Lumpur">Kuala Lumpur (MYT, no DST)</SelectItem>
                    <SelectItem value="Australia/Perth">Perth (AWST, no DST)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST, no DST)</SelectItem>
                    <SelectItem value="Asia/Seoul">Seoul (KST, no DST)</SelectItem>
                    <SelectItem value="Australia/Adelaide">Adelaide (ACST/ACDT)</SelectItem>
                    <SelectItem value="Australia/Darwin">Darwin (ACST, no DST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney / Melbourne (AEST/AEDT)</SelectItem>
                    <SelectItem value="Australia/Brisbane">Brisbane (AEST, no DST)</SelectItem>
                    <SelectItem value="Pacific/Guam">Guam / Saipan (ChST, no DST)</SelectItem>
                    <SelectItem value="Pacific/Noumea">Noumea (NCT, no DST)</SelectItem>
                    <SelectItem value="Pacific/Auckland">Auckland (NZST/NZDT)</SelectItem>
                    <SelectItem value="Pacific/Fiji">Fiji (FJT)</SelectItem>
                    <SelectItem value="Pacific/Tongatapu">Tonga (TOT, no DST)</SelectItem>
                    <SelectItem value="Pacific/Apia">Apia / Samoa (WST)</SelectItem>
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
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español (Spanish)</SelectItem>
                    <SelectItem value="fr">Français (French)</SelectItem>
                    <SelectItem value="de">Deutsch (German)</SelectItem>
                    <SelectItem value="pt">Português (Portuguese)</SelectItem>
                    <SelectItem value="it">Italiano (Italian)</SelectItem>
                    <SelectItem value="nl">Nederlands (Dutch)</SelectItem>
                    <SelectItem value="pl">Polski (Polish)</SelectItem>
                    <SelectItem value="ru">Русский (Russian)</SelectItem>
                    <SelectItem value="tr">Türkçe (Turkish)</SelectItem>
                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    <SelectItem value="zh">中文 (Chinese Simplified)</SelectItem>
                    <SelectItem value="zh-TW">中文繁體 (Chinese Traditional)</SelectItem>
                    <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                    <SelectItem value="ko">한국어 (Korean)</SelectItem>
                    <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="id">Bahasa Indonesia</SelectItem>
                    <SelectItem value="ms">Bahasa Melayu (Malay)</SelectItem>
                    <SelectItem value="th">ภาษาไทย (Thai)</SelectItem>
                    <SelectItem value="vi">Tiếng Việt (Vietnamese)</SelectItem>
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
            {/* Auto Commission */}
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <div className="text-sm font-semibold">Auto Commission</div>
                <div className="text-xs text-muted-foreground mt-0.5">Pre-fills commission on every new trade. Leave blank to enter manually.</div>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={autoCommission}
                  onChange={(e) => setAutoCommission(e.target.value)}
                  placeholder="e.g. 3.50"
                  className="w-28 text-right"
                />
                <span className="text-xs text-muted-foreground">per trade</span>
                {autoCommission !== "" && (
                  <Button size="sm" variant="ghost" className="text-xs px-2" onClick={() => setAutoCommission("")}>Clear</Button>
                )}
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
          <DialogFooter className="flex sm:justify-between">
            {editingAccount.id && (editingAccount.type === "eval" || editingAccount.type === "funded") && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingAccount.status === "failed"}
                  onChange={() => setEditingAccount({ ...editingAccount, status: editingAccount.status === "failed" ? "active" : "failed" })}
                  className="h-4 w-4 rounded border-input accent-red-500"
                />
                <span className="text-sm text-muted-foreground">Blown</span>
              </label>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="ghost" onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveAccount}>{editingAccount.id ? "Save" : "Add"}</Button>
            </div>
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