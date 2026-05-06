"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const SYMBOLS = ["ES","NQ","MES","MNQ","CL","GC","RTY","YM","Other"];
const SETUPS = ["Trend Follow","Mean Reversion","Breakout","VWAP Reclaim","Opening Range","Supply/Demand","Liquidity Sweep","Fair Value Gap","News Play","Scalp","Other"];
const SESSIONS = ["London","NY Open","NY AM","NY PM","Asia"];
const GRADES = ["A+","A","B","C","D"];

type Account = { id: string; name: string; firm: string | null; type: string | null };

export function NewTradeClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [saving, setSaving] = useState(false);
  const [blownAccount, setBlownAccount] = useState(false);
  const [form, setForm] = useState({
    trade_date: today,
    account_id: accounts[0]?.id ?? "",
    symbol: "ES",
    direction: "Long" as "Long" | "Short",
    contracts: "1",
    pnl: "",
    entry_price: "",
    exit_price: "",
    stop_price: "",
    commission: "4.00",
    setup: "Trend Follow",
    session: "NY AM",
    grade: "A",
    notes: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selectedAccount = accounts.find((a) => a.id === form.account_id);
  const showBlownToggle = selectedAccount?.type === "eval" || selectedAccount?.type === "funded";

  async function saveTrade() {
    if (!form.account_id) { toast.error("Select an account"); return; }
    if (!form.pnl) { toast.error("Enter P&L"); return; }
    setSaving(true);
    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        contracts: parseInt(form.contracts) || 1,
        pnl: parseFloat(form.pnl) || 0,
        entry_price: parseFloat(form.entry_price) || null,
        exit_price: parseFloat(form.exit_price) || null,
        stop_price: parseFloat(form.stop_price) || null,
        commission: parseFloat(form.commission) || 0,
        blown_account: blownAccount,
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Failed"); return; }

    // If blown, also mark the account as failed
    if (blownAccount && form.account_id) {
      await fetch("/api/accounts/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.account_id, status: "failed" }),
      });
    }

    toast.success(blownAccount ? "Trade saved — account marked blown 💥" : "Trade saved!");
    router.push("/trades");
    router.refresh();
  }

  if (accounts.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-6"><Link href="/trades" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back</Link></div>
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-600">
          You need to <Link href="/settings" className="font-medium underline">add a trading account in Settings</Link> before logging trades.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/trades" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back</Link>
        <div>
          <h1 className="text-2xl font-bold">New Trade</h1>
          <p className="text-sm text-muted-foreground">Log a new futures trade</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Trade Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date"><Input type="date" value={form.trade_date} onChange={(e) => set("trade_date", e.target.value)} /></Field>
            <Field label="Account">
              <Select value={form.account_id} onValueChange={(v) => { set("account_id", v); setBlownAccount(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}{a.firm ? ` (${a.firm})` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Symbol">
              <Select value={form.symbol} onValueChange={(v) => set("symbol", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SYMBOLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Direction">
              <Select value={form.direction} onValueChange={(v) => set("direction", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Long">Long</SelectItem><SelectItem value="Short">Short</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="Contracts"><Input type="number" min="1" value={form.contracts} onChange={(e) => set("contracts", e.target.value)} /></Field>
            <Field label="P&L ($)"><Input type="number" step="0.01" value={form.pnl} onChange={(e) => set("pnl", e.target.value)} placeholder="0.00" /></Field>
            <Field label="Entry Price"><Input type="number" step="0.25" value={form.entry_price} onChange={(e) => set("entry_price", e.target.value)} placeholder="0.00" /></Field>
            <Field label="Exit Price"><Input type="number" step="0.25" value={form.exit_price} onChange={(e) => set("exit_price", e.target.value)} placeholder="0.00" /></Field>
            <Field label="Stop Price"><Input type="number" step="0.25" value={form.stop_price} onChange={(e) => set("stop_price", e.target.value)} placeholder="0.00" /></Field>
            <Field label="Commission ($)"><Input type="number" step="0.01" value={form.commission} onChange={(e) => set("commission", e.target.value)} /></Field>
            <Field label="Setup">
              <Select value={form.setup} onValueChange={(v) => set("setup", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SETUPS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Session">
              <Select value={form.session} onValueChange={(v) => set("session", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SESSIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Grade">
              <Select value={form.grade} onValueChange={(v) => set("grade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Execution notes, mistakes, what you did well..." className="min-h-[80px]" /></Field>
            </div>

            {/* Blown account checkbox — only shown for eval/funded accounts */}
            {showBlownToggle && (
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={blownAccount}
                    onChange={(e) => setBlownAccount(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-red-500"
                  />
                  <span className="text-sm text-muted-foreground">This trade blew the account <span className="text-xs">(marks account as Failed)</span></span>
                </label>
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={saveTrade} disabled={saving} className="flex-1 sm:flex-none">
              {saving ? "Saving..." : "Save Trade"}
            </Button>
            <Button variant="outline" asChild><Link href="/trades">Cancel</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}