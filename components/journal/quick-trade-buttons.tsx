"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PostTradeModal } from "@/components/journal/post-trade-modal";
import { TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

const SYMBOLS = ["ES","NQ","MES","MNQ","CL","GC","RTY","YM","Other"];
const SETUPS = ["Trend Follow","Mean Reversion","Breakout","VWAP Reclaim","Opening Range","Supply/Demand","Other"];
const SESSIONS = ["London","NY Open","NY AM","NY PM","Asia"];
const GRADES = ["A+","A","B","C","D"];

type Account = { id: string; name: string };

interface QuickTradeButtonsProps {
  accounts: Account[];
  userId: string;
}

export function QuickTradeButtons({ accounts, userId }: QuickTradeButtonsProps) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postTradeOpen, setPostTradeOpen] = useState(false);
  const [lastTrade, setLastTrade] = useState<{ pnl: number; symbol: string } | null>(null);

  const [form, setForm] = useState({
    direction: "Long" as "Long" | "Short",
    trade_date: today,
    account_id: accounts[0]?.id ?? "",
    symbol: "ES",
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

  function openFor(dir: "Long" | "Short") {
    setForm((f) => ({ ...f, direction: dir, trade_date: today }));
    setOpen(true);
  }

  async function save() {
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
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Failed"); return; }
    const pnl = parseFloat(form.pnl) || 0;
    setLastTrade({ pnl, symbol: form.symbol });
    setOpen(false);
    setPostTradeOpen(true);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => openFor("Long")}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 md:px-6"
          size="sm"
        >
          <TrendingUp className="mr-1.5 h-4 w-4" />
          Log Win
        </Button>
        <Button
          onClick={() => openFor("Short")}
          className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 md:px-6"
          size="sm"
        >
          <TrendingDown className="mr-1.5 h-4 w-4" />
          Log Loss
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${form.direction === "Long" ? "text-green-500" : "text-red-500"}`}>
              {form.direction === "Long" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              Log {form.direction === "Long" ? "Win" : "Loss"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <F label="Date"><Input type="date" value={form.trade_date} onChange={(e) => set("trade_date", e.target.value)} /></F>
            <F label="Account">
              <Select value={form.account_id} onValueChange={(v) => set("account_id", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Symbol">
              <Select value={form.symbol} onValueChange={(v) => set("symbol", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SYMBOLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Direction">
              <Select value={form.direction} onValueChange={(v) => set("direction", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Long">Long</SelectItem><SelectItem value="Short">Short</SelectItem></SelectContent>
              </Select>
            </F>
            <F label="P&L ($)"><Input type="number" step="0.01" value={form.pnl} onChange={(e) => set("pnl", e.target.value)} placeholder="0.00" autoFocus /></F>
            <F label="Contracts"><Input type="number" min="1" value={form.contracts} onChange={(e) => set("contracts", e.target.value)} /></F>
            <F label="Entry"><Input type="number" step="0.25" value={form.entry_price} onChange={(e) => set("entry_price", e.target.value)} placeholder="0.00" /></F>
            <F label="Exit"><Input type="number" step="0.25" value={form.exit_price} onChange={(e) => set("exit_price", e.target.value)} placeholder="0.00" /></F>
            <F label="Stop"><Input type="number" step="0.25" value={form.stop_price} onChange={(e) => set("stop_price", e.target.value)} placeholder="0.00" /></F>
            <F label="Commission"><Input type="number" step="0.01" value={form.commission} onChange={(e) => set("commission", e.target.value)} /></F>
            <F label="Setup">
              <Select value={form.setup} onValueChange={(v) => set("setup", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SETUPS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Grade">
              <Select value={form.grade} onValueChange={(v) => set("grade", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <div className="col-span-2">
              <F label="Notes"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Quick notes..." className="min-h-[60px]" /></F>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Saving..." : "Save Trade"}</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {lastTrade && (
        <PostTradeModal
          open={postTradeOpen}
          pnl={lastTrade.pnl}
          symbol={lastTrade.symbol}
          onDismiss={() => { setPostTradeOpen(false); setLastTrade(null); }}
        />
      )}
    </>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}