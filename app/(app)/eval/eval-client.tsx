"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Trophy, Pencil } from "lucide-react";

type Expense = { id: string; date: string; type: string; firm: string | null; amount: number; note: string | null };
type Payout  = { id: string; date: string; firm: string | null; amount: number; note: string | null };

const EXPENSE_TYPES = ["Evaluation Fee", "Reset Fee", "Monthly Fee", "Platform Fee", "Other"];

const BLANK_EXP = (today: string) => ({ date: today, type: "Evaluation Fee", firm: "", amount: "", note: "" });
const BLANK_PAY = (today: string) => ({ date: today, firm: "", amount: "", note: "" });

function fmt(v: number) { return "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtSigned(v: number) { return (v < 0 ? "-" : "") + fmt(v); }

export function EvalClient({
  initialExpenses,
  initialPayouts,
}: {
  initialExpenses: Expense[];
  initialPayouts: Payout[];
}) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [payouts,  setPayouts]  = useState<Payout[]>(initialPayouts);
  const [saving, setSaving] = useState(false);
  const [congrats, setCongrats] = useState<{ amount: number; firm: string } | null>(null);
  const congratsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = new Date().toISOString().split("T")[0];

  // Expense dialog state
  const [expDialog, setExpDialog]       = useState(false);
  const [editingExp, setEditingExp]     = useState<Expense | null>(null);
  const [expForm, setExpForm]           = useState(BLANK_EXP(today));

  // Payout dialog state
  const [payDialog, setPayDialog]       = useState(false);
  const [editingPay, setEditingPay]     = useState<Payout | null>(null);
  const [payForm, setPayForm]           = useState(BLANK_PAY(today));

  function openNewExpense() {
    setEditingExp(null);
    setExpForm(BLANK_EXP(today));
    setExpDialog(true);
  }

  function openEditExpense(e: Expense) {
    setEditingExp(e);
    setExpForm({ date: e.date, type: e.type, firm: e.firm ?? "", amount: String(e.amount), note: e.note ?? "" });
    setExpDialog(true);
  }

  function openNewPayout() {
    setEditingPay(null);
    setPayForm(BLANK_PAY(today));
    setPayDialog(true);
  }

  function openEditPayout(p: Payout) {
    setEditingPay(p);
    setPayForm({ date: p.date, firm: p.firm ?? "", amount: String(p.amount), note: p.note ?? "" });
    setPayDialog(true);
  }

  async function saveExpense() {
    const amt = parseFloat(expForm.amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const isEdit = !!editingExp;
      const res = await fetch("/api/eval-expenses", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: editingExp!.id } : {}),
          date: expForm.date, type: expForm.type,
          firm: expForm.firm, amount: amt, note: expForm.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      if (isEdit) {
        setExpenses(prev => prev.map(e => e.id === editingExp!.id ? data : e));
        toast.success("Expense updated!");
      } else {
        setExpenses(prev => [data, ...prev]);
        toast.success("Expense saved!");
      }
      setExpDialog(false);
    } finally {
      setSaving(false);
    }
  }

  async function savePayout() {
    const amt = parseFloat(payForm.amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const isEdit = !!editingPay;
      const res = await fetch("/api/eval-payouts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { id: editingPay!.id } : {}),
          date: payForm.date, firm: payForm.firm, amount: amt, note: payForm.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      if (isEdit) {
        setPayouts(prev => prev.map(p => p.id === editingPay!.id ? data : p));
        toast.success("Payout updated!");
      } else {
        setPayouts(prev => [data, ...prev]);
        toast.success("Payout saved!");
        if (congratsTimer.current) clearTimeout(congratsTimer.current);
        setCongrats({ amount: amt, firm: payForm.firm || "your firm" });
        congratsTimer.current = setTimeout(() => setCongrats(null), 5000);
      }
      setPayDialog(false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense?")) return;
    const res = await fetch("/api/eval-expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success("Expense deleted");
  }

  async function deletePayout(id: string) {
    if (!confirm("Delete this payout?")) return;
    const res = await fetch("/api/eval-payouts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setPayouts(prev => prev.filter(p => p.id !== id));
    toast.success("Payout deleted");
  }

  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPay = payouts.reduce((s, p) => s + p.amount, 0);
  const net = totalPay - totalExp;
  const roi = totalExp > 0 ? (net / totalExp * 100) : 0;
  const evalFees = expenses.filter(e => e.type === "Evaluation Fee");

  const months: Record<string, number> = {};
  payouts.forEach(p => { const m = p.date.slice(0, 7); months[m] = (months[m] || 0) + p.amount; });
  expenses.forEach(e => { const m = e.date.slice(0, 7); months[m] = (months[m] || 0) - e.amount; });
  let bestMonth = "No data", bestVal = -Infinity;
  Object.entries(months).forEach(([m, v]) => {
    if (v > bestVal) { bestVal = v; bestMonth = new Date(m + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
  });

  return (
    <div className="p-4 md:p-8">

      {/* 🏆 Congrats Banner */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
        congrats ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
      }`}>
        <div className="flex items-center gap-3 rounded-full border-2 border-yellow-400 bg-gradient-to-r from-yellow-950 via-yellow-900 to-yellow-950 px-6 py-3 shadow-2xl shadow-yellow-500/30 cursor-pointer"
          onClick={() => setCongrats(null)}>
          <Trophy className="h-5 w-5 text-yellow-400 shrink-0" />
          <div className="text-center">
            <span className="text-yellow-300 font-black text-sm tracking-wide">PAYOUT RECEIVED 🎉</span>
            <span className="mx-2 text-yellow-500">·</span>
            <span className="text-yellow-400 font-black text-sm">{congrats ? fmt(congrats.amount) : ""}</span>
            <span className="mx-2 text-yellow-600 text-xs">from</span>
            <span className="text-yellow-300 text-xs font-semibold">{congrats?.firm}</span>
          </div>
          <Trophy className="h-5 w-5 text-yellow-400 shrink-0" />
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Eval Expenses & Payouts</h1>
          <p className="text-sm text-muted-foreground">Track all evaluation costs and payouts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNewExpense}><Plus className="mr-1 h-4 w-4" />Add Expense</Button>
          <Button onClick={openNewPayout} className="bg-green-600 hover:bg-green-700"><Plus className="mr-1 h-4 w-4" />Add Payout</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Total Expenses", value: fmt(totalExp),        color: "text-red-500" },
          { label: "Total Payouts",  value: fmt(totalPay),        color: "text-green-500" },
          { label: "Net Profit",     value: fmtSigned(net),       color: net >= 0 ? "text-green-500" : "text-red-500" },
          { label: "Best Month",     value: bestVal > 0 ? fmt(bestVal) : "—", color: "text-green-500" },
          { label: "ROI on Evals",   value: `${roi.toFixed(2)}%`, color: "text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">

        {/* Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Expenses</CardTitle>
            <span className="text-sm font-semibold text-red-500">{fmt(totalExp)}</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[420px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-card z-10">Date</TableHead>
                    <TableHead className="sticky top-0 bg-card z-10">Firm</TableHead>
                    <TableHead className="sticky top-0 bg-card z-10">Type</TableHead>
                    <TableHead className="sticky top-0 bg-card z-10">Amount</TableHead>
                    <TableHead className="sticky top-0 bg-card z-10 w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...expenses].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{e.date}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.firm || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{e.type}</Badge></TableCell>
                      <TableCell className="font-semibold text-red-500">{fmt(e.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditExpense(e)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteExpense(e.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No expenses yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Payouts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Payouts</CardTitle>
            <span className="text-sm font-semibold text-green-500">{fmt(totalPay)}</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[420px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-card z-10">Date</TableHead>
                    <TableHead className="sticky top-0 bg-card z-10">Firm</TableHead>
                    <TableHead className="sticky top-0 bg-card z-10">Amount</TableHead>
                    <TableHead className="sticky top-0 bg-card z-10">Note</TableHead>
                    <TableHead className="sticky top-0 bg-card z-10 w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...payouts].sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{p.date}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.firm || "—"}</TableCell>
                      <TableCell className="font-bold text-green-500">{fmt(p.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.note || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPayout(p)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deletePayout(p.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payouts.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No payouts yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="mt-6 max-w-sm">
        <CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            ["Evaluations Started", evalFees.length.toString(), ""],
            ["Payouts Received",    payouts.length.toString(),  "text-green-500"],
            ["Total Expenses",      fmt(totalExp),               "text-red-500"],
            ["Total Payouts",       fmt(totalPay),               "text-green-500"],
            ["Net Profit",          fmtSigned(net),              net >= 0 ? "text-green-500 font-bold" : "text-red-500 font-bold"],
            ["ROI",                 `${roi.toFixed(2)}%`,        "text-primary"],
            ["Avg Cost / Eval",     evalFees.length ? fmt(totalExp / evalFees.length) : "—", ""],
            ["Avg Payout",          payouts.length  ? fmt(totalPay / payouts.length)  : "—", ""],
          ].map(([label, value, color]) => (
            <div key={label} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className={color}>{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Expense Dialog (Add + Edit) */}
      <Dialog open={expDialog} onOpenChange={setExpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExp ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={expForm.type} onValueChange={v => setExpForm({ ...expForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Firm</Label>
              <Input placeholder="e.g. Apex" value={expForm.firm} onChange={e => setExpForm({ ...expForm, firm: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount ($)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input placeholder="Optional notes" value={expForm.note} onChange={e => setExpForm({ ...expForm, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpDialog(false)}>Cancel</Button>
            <Button onClick={saveExpense} disabled={saving}>
              {saving ? "Saving…" : editingExp ? "Save Changes" : "Save Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Dialog (Add + Edit) */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPay ? "Edit Payout" : "Add Payout"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Firm</Label>
              <Input placeholder="e.g. Apex" value={payForm.firm} onChange={e => setPayForm({ ...payForm, firm: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount ($)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Input placeholder="e.g. 1st Payout" value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(false)}>Cancel</Button>
            <Button onClick={savePayout} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? "Saving…" : editingPay ? "Save Changes" : "Save Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}