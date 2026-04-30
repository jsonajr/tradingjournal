"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PostTradeReflection } from "@/components/journal/post-trade-reflection";
import { TrendingUp, TrendingDown, Upload, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SYMBOLS = ["ES","NQ","MES","MNQ","CL","GC","RTY","YM","Other"];
const SETUPS = ["Trend Follow","Mean Reversion","Breakout","VWAP Reclaim","Opening Range","Supply/Demand","Other"];
const SESSIONS = ["London","NY Open","NY AM","NY PM","Asia"];
const GRADES = ["A+","A","B","C","D"];
const PLATFORM_INFO: Record<string, string> = {
  tradovate: "Tradovate: Account → Reports → Fills → Export CSV",
  projectx:  "ProjectX: Reports → Trade History → Download CSV",
  generic:   "Generic: date, symbol, direction, contracts, entry, exit, pnl, commission",
};

type Account = { id: string; name: string };

export function QuickTradeButtons({ accounts, userId, popupEnabled = true }: { accounts: Account[]; userId: string; popupEnabled?: boolean }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"manual" | "csv">("manual");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [postTradeOpen, setPostTradeOpen] = useState(false);
  const [lastTrade, setLastTrade] = useState<{ pnl: number; symbol: string; id?: string } | null>(null);

  // Manual form
  const [form, setForm] = useState({
    direction: "Long" as "Long" | "Short",
    trade_date: today,
    account_id: accounts[0]?.id ?? "",
    symbol: "ES", contracts: "1", pnl: "",
    entry_price: "", exit_price: "", stop_price: "",
    commission: "4.00", setup: "Trend Follow", session: "NY AM", grade: "A", notes: "",
  });

  // CSV import
  const [csvAccount, setCsvAccount] = useState(accounts[0]?.id ?? "");
  const [csvPlatform, setCsvPlatform] = useState("tradovate");
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function openFor(dir: "Long" | "Short") {
    setForm((f) => ({ ...f, direction: dir, trade_date: today }));
    setTab("manual");
    setOpen(true);
  }

  async function save() {
    if (!form.account_id) { toast.error("Select an account"); return; }
    if (!form.pnl) { toast.error("Enter P&L"); return; }
    const pnl = parseFloat(form.pnl) || 0;
    // Show popup immediately — save happens in background
    setLastTrade({ pnl, symbol: form.symbol, id: undefined });
    setOpen(false);
    if (popupEnabled) setPostTradeOpen(true);
    // Background save
    setSaving(true);
    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        contracts: parseInt(form.contracts) || 1,
        pnl,
        entry_price: parseFloat(form.entry_price) || null,
        exit_price: parseFloat(form.exit_price) || null,
        stop_price: parseFloat(form.stop_price) || null,
        commission: parseFloat(form.commission) || 0,
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Failed"); return; }
    const saved = await res.json();
    // Update trade id in lastTrade so reflection can link to it
    setLastTrade((prev) => prev ? { ...prev, id: saved?.trade?.id } : prev);
    router.refresh();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const lines = text.trim().split("\n");
      setCsvPreview(lines.slice(0, 3).join("\n") + (lines.length > 3 ? `\n...(${lines.length} rows)` : ""));
    };
    reader.readAsText(f);
  }

  async function runImport() {
    if (!csvAccount) { toast.error("Select an account"); return; }
    if (!csvText) { toast.error("Upload a CSV file first"); return; }
    setImporting(true);
    const res = await fetch("/api/import-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText, platform: csvPlatform, account_id: csvAccount }),
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) { toast.error(data.error ?? "Import failed"); return; }
    toast.success(`Imported ${data.imported} trades!`);
    setCsvText(""); setCsvPreview("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {/* Desktop inline */}
      <div className="hidden md:flex gap-2">
        <Button onClick={() => openFor("Long")} className="bg-green-600 hover:bg-green-500 text-white font-bold" size="sm">
          <TrendingUp className="mr-1.5 h-4 w-4" />Log Win
        </Button>
        <Button onClick={() => openFor("Short")} className="bg-red-600 hover:bg-red-500 text-white font-bold" size="sm">
          <TrendingDown className="mr-1.5 h-4 w-4" />Log Loss
        </Button>
      </div>

      {/* Mobile floating */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+60px)] right-3 z-50 flex flex-col gap-2 md:hidden">
        <button onClick={() => openFor("Long")}
          className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-green-600 text-white shadow-lg shadow-green-900/40 active:scale-95 transition-transform">
          <span className="text-xl leading-none">📈</span>
          <span className="text-[9px] font-bold mt-0.5">WIN</span>
        </button>
        <button onClick={() => openFor("Short")}
          className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-900/40 active:scale-95 transition-transform">
          <span className="text-xl leading-none">📉</span>
          <span className="text-[9px] font-bold mt-0.5">LOSS</span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${form.direction === "Long" ? "text-green-500" : "text-red-500"}`}>
              {form.direction === "Long" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              Log {form.direction === "Long" ? "Win" : "Loss"}
            </DialogTitle>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="flex gap-1 rounded-lg border bg-muted p-1 mb-1">
            <button onClick={() => setTab("manual")}
              className={cn("flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition-colors",
                tab === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <PenLine className="h-3.5 w-3.5" />Manual
            </button>
            <button onClick={() => setTab("csv")}
              className={cn("flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition-colors",
                tab === "csv" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Upload className="h-3.5 w-3.5" />Import CSV
            </button>
          </div>

          {tab === "manual" && (
            <>
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
            </>
          )}

          {tab === "csv" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Platform</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {["tradovate","projectx","generic"].map((p) => (
                    <button key={p} onClick={() => setCsvPlatform(p)}
                      className={cn("rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                        csvPlatform === p ? "border-primary bg-primary/15 text-primary" : "border-input text-muted-foreground hover:border-primary")}>
                      {p === "projectx" ? "ProjectX" : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">{PLATFORM_INFO[csvPlatform]}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Account</Label>
                <Select value={csvAccount} onValueChange={setCsvAccount}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CSV File</Label>
                <Input type="file" accept=".csv,text/csv" onChange={handleFile} />
              </div>
              {csvPreview && (
                <pre className="rounded-md border bg-muted p-2 text-[10px] font-mono overflow-auto max-h-24">{csvPreview}</pre>
              )}
              <div className="flex gap-2">
                <Button onClick={runImport} disabled={importing || !csvText} className="flex-1">
                  {importing ? "Importing..." : "Import Trades"}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {lastTrade && (
        <PostTradeReflection
          open={postTradeOpen}
          pnl={lastTrade.pnl}
          symbol={lastTrade.symbol}
          tradeId={lastTrade.id}
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