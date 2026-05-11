"use client";
import { useState } from "react";
import { PlaybookSection, type PlaybookEntry } from "./playbook-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Strategy = {
  id: string;
  name: string;
  description: string | null;
  conditions: string | null;
  confluences: string | null;
  notes: string | null;
  sessions: string[];
  timeframes: string[];
  tags: string[];
  color: string;
};

type FormState = {
  id: string;
  name: string;
  description: string;
  conditions: string;
  confluences: string;
  notes: string;
  sessions: string[];
  timeframes: string[];
  tags: string[];
  color: string;
};

const SESSION_OPTIONS  = ["London", "NY Open", "NY AM", "NY PM", "Asia"];
const TIMEFRAME_OPTIONS = ["1m", "3m", "5m", "15m", "30m", "1h", "4h", "Daily"];
const COLORS = ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#f97316"];

const EMPTY: FormState = {
  id: "", name: "", description: "", conditions: "", confluences: "",
  notes: "", sessions: [], timeframes: [], tags: [], color: COLORS[0],
};

function toForm(s: Strategy): FormState {
  return {
    id:          s.id,
    name:        s.name,
    description: s.description ?? "",
    conditions:  s.conditions  ?? "",
    confluences: s.confluences ?? "",
    notes:       s.notes       ?? "",
    sessions:    s.sessions,
    timeframes:  s.timeframes,
    tags:        s.tags,
    color:       s.color,
  };
}

export function StrategiesClient({ initialStrategies, initialPlaybook }: { initialStrategies: Strategy[]; initialPlaybook: PlaybookEntry[] }) {
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies);
  const [activeTab, setActiveTab] = useState<"strategies"|"setups"|"mistakes"|"winners">("strategies");
  const [dialogOpen, setDialogOpen]  = useState(false);
  const [editing, setEditing]        = useState<FormState>(EMPTY);
  const [saving, setSaving]          = useState(false);
  const [search, setSearch]          = useState("");

  function openNew()          { setEditing({ ...EMPTY }); setDialogOpen(true); }
  function openEdit(s: Strategy) { setEditing(toForm(s)); setDialogOpen(true); }

  function toggleArr(key: "sessions" | "timeframes", val: string) {
    const arr = editing[key];
    setEditing({ ...editing, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] });
  }

  async function saveStrategy() {
    if (!editing.name.trim()) { toast.error("Strategy name required"); return; }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const res = await fetch("/api/strategies", {
        method:  isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          id:          editing.id,
          name:        editing.name.trim(),
          description: editing.description || null,
          conditions:  editing.conditions  || null,
          confluences: editing.confluences || null,
          notes:       editing.notes       || null,
          sessions:    editing.sessions,
          timeframes:  editing.timeframes,
          tags:        editing.tags,
          color:       editing.color,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to save"); return; }
      setStrategies((prev) =>
        isNew ? [...prev, data] : prev.map((s) => s.id === data.id ? data : s)
      );
      setDialogOpen(false);
      toast.success(isNew ? "Strategy added!" : "Strategy updated!");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStrategy(id: string) {
    if (!confirm("Delete this strategy?")) return;
    const res = await fetch("/api/strategies", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setStrategies((prev) => prev.filter((s) => s.id !== id));
    toast.success("Strategy deleted");
  }

  const filtered = strategies.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const tabs = [
    { id: "strategies" as const, label: "Strategies", emoji: "📚" },
    { id: "setups"     as const, label: "Setups",     emoji: "📋" },
    { id: "mistakes"   as const, label: "Mistakes",   emoji: "❌" },
    { id: "winners"    as const, label: "Winners",    emoji: "🏆" },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Tab bar */}
      <div className="mb-6 flex items-center gap-1.5 flex-wrap border-b border-border pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <span>{tab.emoji}</span>{tab.label}
            {tab.id !== "strategies" && (
              <span className="ml-1 text-xs opacity-60">
                {initialPlaybook.filter(e => e.type === tab.id.slice(0,-1) as any || (tab.id === "setups" && e.type === "setup") || (tab.id === "mistakes" && e.type === "mistake") || (tab.id === "winners" && e.type === "winner")).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "setups"    && <PlaybookSection type="setup"   entries={initialPlaybook.filter(e => e.type === "setup")} />}
      {activeTab === "mistakes"  && <PlaybookSection type="mistake" entries={initialPlaybook.filter(e => e.type === "mistake")} />}
      {activeTab === "winners"   && <PlaybookSection type="winner"  entries={initialPlaybook.filter(e => e.type === "winner")} />}

      {activeTab === "strategies" && <div className="p-4 md:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Strategies</h1>
          <p className="text-sm text-muted-foreground">{strategies.length} strategies defined</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />Add Strategy</Button>
      </div>

      {strategies.length > 1 && (
        <div className="mb-4">
          <Input placeholder="Search strategies..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <div className="text-lg font-semibold">No strategies yet</div>
            <p className="mt-1 text-sm text-muted-foreground">Document your trading setups, conditions, and confluences.</p>
            <Button className="mt-4" onClick={openNew}><Plus className="mr-1 h-4 w-4" />Add Your First Strategy</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-1" style={{ background: s.color }} />
              <CardHeader className="pl-5 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    {s.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(s)} className="h-7 w-7"><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteStrategy(s.id)} className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pl-5 space-y-2 text-sm">
                <div className="flex flex-wrap gap-1">
                  {s.sessions.map((sess) => <Badge key={sess} variant="secondary" className="text-xs">{sess}</Badge>)}
                  {s.timeframes.map((tf) => <Badge key={tf} className="text-xs bg-primary/15 text-primary">{tf}</Badge>)}
                </div>
                {s.conditions && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Conditions</div>
                    <p className="text-xs text-foreground/70 line-clamp-3 whitespace-pre-line">{s.conditions}</p>
                  </div>
                )}
                {s.confluences && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Confluences</div>
                    <p className="text-xs text-foreground/70 line-clamp-2 whitespace-pre-line">{s.confluences}</p>
                  </div>
                )}
                {s.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {s.tags.map((t) => <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing.id ? "Edit" : "New"} Strategy</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Strategy Name *</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. VWAP Reclaim Long" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Brief overview..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Sessions</Label>
              <div className="flex flex-wrap gap-1.5">
                {SESSION_OPTIONS.map((s) => (
                  <button key={s} onClick={() => toggleArr("sessions", s)}
                    className={cn("rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      editing.sessions.includes(s) ? "border-primary bg-primary/15 text-primary" : "border-input text-muted-foreground hover:border-primary")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Timeframes</Label>
              <div className="flex flex-wrap gap-1.5">
                {TIMEFRAME_OPTIONS.map((t) => (
                  <button key={t} onClick={() => toggleArr("timeframes", t)}
                    className={cn("rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                      editing.timeframes.includes(t) ? "border-primary bg-primary/15 text-primary" : "border-input text-muted-foreground hover:border-primary")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Entry Conditions</Label>
              <Textarea value={editing.conditions} onChange={(e) => setEditing({ ...editing, conditions: e.target.value })} placeholder="List your entry rules line by line..." rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Confluences Required</Label>
              <Textarea value={editing.confluences} onChange={(e) => setEditing({ ...editing, confluences: e.target.value })} placeholder="e.g. VWAP above, higher high on 5m, volume surge..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Additional Notes</Label>
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Anything else about this strategy..." rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Tags (comma separated)</Label>
              <Input
                value={editing.tags.join(", ")}
                onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                placeholder="momentum, reversal, high-prob"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Color</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setEditing({ ...editing, color: c })}
                    className={cn("h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                      editing.color === c ? "border-white scale-110" : "border-transparent")}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveStrategy} disabled={saving}>
              {saving ? "Saving…" : editing.id ? "Save Changes" : "Add Strategy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>}
    </div>
  );
}