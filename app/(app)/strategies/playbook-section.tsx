"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, ImagePlus, X, ZoomIn, Tag } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type PlaybookEntry = {
  id: string;
  type: "setup" | "mistake" | "winner";
  title: string;
  description: string | null;
  screenshot_url: string | null;
  tags: string[];
  created_at: string;
};

const TYPE_CONFIG = {
  setup:   { label: "Setups",   emoji: "📋", color: "text-blue-500",  border: "border-blue-500/20",  bg: "bg-blue-500/5",  desc: "Document your trading setups — entry conditions, confluences, and rules." },
  mistake: { label: "Mistakes", emoji: "❌", color: "text-red-500",   border: "border-red-500/20",   bg: "bg-red-500/5",   desc: "Track recurring mistakes so you can identify and eliminate them." },
  winner:  { label: "Winners",  emoji: "🏆", color: "text-green-500", border: "border-green-500/20", bg: "bg-green-500/5", desc: "Document repeating winning patterns you want to replicate." },
};

function ScreenshotZone({ entryId, url, onUpdated }: {
  entryId: string; url: string | null; onUpdated: (u: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox]   = useState(false);
  const supabase = createClient();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `playbook-screenshots/${entryId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("trade-screenshots").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("trade-screenshots").getPublicUrl(path);
    const publicUrl = data.publicUrl + "?t=" + Date.now();
    await fetch("/api/playbook-entries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entryId, screenshot_url: publicUrl }),
    });
    onUpdated(publicUrl);
    setUploading(false);
    toast.success("Screenshot saved");
  }

  async function remove() {
    await fetch("/api/playbook-entries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entryId, screenshot_url: null }),
    });
    onUpdated(null);
  }

  if (url) return (
    <>
      <div className="relative group rounded-xl overflow-hidden border border-border mt-3">
        <img src={url} alt="screenshot" className="w-full object-contain max-h-[280px] bg-black/20 cursor-zoom-in" onClick={() => setLightbox(true)} />
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setLightbox(true)} className="rounded-md bg-black/70 p-1.5 text-white"><ZoomIn className="h-3.5 w-3.5" /></button>
          <label className="rounded-md bg-primary/90 p-1.5 text-primary-foreground cursor-pointer"><ImagePlus className="h-3.5 w-3.5" /><input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} /></label>
          <button onClick={remove} className="rounded-md bg-destructive/90 p-1.5 text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="h-8 w-8" /></button>
          <img src={url} alt="screenshot" className="max-h-screen max-w-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );

  return (
    <label className={cn("mt-3 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-5 cursor-pointer hover:border-primary/50 transition-colors", uploading && "opacity-50 pointer-events-none")}>
      <ImagePlus className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Add screenshot"}</span>
      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </label>
  );
}

function EntryCard({ entry, onEdit, onDelete, onScreenshotUpdated }: {
  entry: PlaybookEntry;
  onEdit: () => void;
  onDelete: () => void;
  onScreenshotUpdated: (url: string | null) => void;
}) {
  const cfg = TYPE_CONFIG[entry.type];
  return (
    <Card className={cn("border", cfg.border, cfg.bg)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg shrink-0">{cfg.emoji}</span>
            <h3 className={cn("font-bold text-base truncate", cfg.color)}>{entry.title}</h3>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
        </div>
        {entry.description && (
          <p className="mt-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-4">{entry.description}</p>
        )}
        {entry.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {entry.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px] px-1.5">{t}</Badge>)}
          </div>
        )}
        <ScreenshotZone entryId={entry.id} url={entry.screenshot_url} onUpdated={onScreenshotUpdated} />
      </CardContent>
    </Card>
  );
}

function EntryModal({ type, existing, onClose, onSaved }: {
  type: PlaybookEntry["type"];
  existing: PlaybookEntry | null;
  onClose: () => void;
  onSaved: (e: PlaybookEntry) => void;
}) {
  const cfg = TYPE_CONFIG[type];
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title:       existing?.title          ?? "",
    description: existing?.description   ?? "",
    tags:        existing?.tags.join(", ") ?? "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload = {
      ...(existing ? { id: existing.id } : {}),
      type,
      title:          form.title.trim(),
      description:    form.description.trim() || null,
      tags:           form.tags.split(",").map(t => t.trim()).filter(Boolean),
      screenshot_url: existing?.screenshot_url ?? null,
    };
    const res = await fetch("/api/playbook-entries", {
      method:  existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
    toast.success(existing ? "Updated!" : "Saved!");
    onSaved(data);
  }

  const placeholders = {
    setup:   { title: "e.g. ICT Fair Value Gap NY Open", desc: "Entry conditions, confluences, rules, what to look for..." },
    mistake: { title: "e.g. Chasing entries after missed setup", desc: "What triggers this? What does it cost you? How do you fix it?" },
    winner:  { title: "e.g. FVG fill at NY Open killzone", desc: "What makes this pattern work? Conditions? Why does it repeat?" },
  };

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {cfg.emoji} {existing ? "Edit" : "New"} {cfg.label.slice(0, -1)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Title *</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder={placeholders[type].title} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder={placeholders[type].desc} className="min-h-[120px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide flex items-center gap-1"><Tag className="h-3 w-3" />Tags (comma separated)</Label>
            <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="e.g. ICT, MES, London" />
          </div>
          <p className="text-xs text-muted-foreground">You can add a screenshot after saving.</p>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : existing ? "Save Changes" : `Add ${cfg.label.slice(0, -1)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PlaybookSection({ type, entries: initialEntries }: {
  type: PlaybookEntry["type"];
  entries: PlaybookEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<PlaybookEntry | null>(null);
  const cfg = TYPE_CONFIG[type];

  function openNew()                   { setEditing(null); setShowModal(true); }
  function openEdit(e: PlaybookEntry)  { setEditing(e);    setShowModal(true); }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    const res = await fetch("/api/playbook-entries", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setEntries(prev => prev.filter(e => e.id !== id));
    toast.success("Deleted");
  }

  function handleSaved(saved: PlaybookEntry) {
    setEntries(prev => editing ? prev.map(e => e.id === saved.id ? saved : e) : [saved, ...prev]);
    setShowModal(false);
  }

  function handleScreenshotUpdated(id: string, url: string | null) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, screenshot_url: url } : e));
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className={cn("text-xl font-black flex items-center gap-2", cfg.color)}>
            {cfg.emoji} {cfg.label}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{cfg.desc}</p>
        </div>
        <Button size="sm" onClick={openNew} className="shrink-0">
          <Plus className="mr-1.5 h-3.5 w-3.5" />Add {cfg.label.slice(0, -1)}
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className={cn("rounded-xl border-2 border-dashed p-12 text-center", cfg.border)}>
          <div className="text-5xl mb-3">{cfg.emoji}</div>
          <p className="text-sm font-semibold text-foreground/60">No {cfg.label.toLowerCase()} yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs mx-auto">{cfg.desc}</p>
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />Add your first {cfg.label.slice(0, -1).toLowerCase()}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(e => (
            <EntryCard
              key={e.id}
              entry={e}
              onEdit={() => openEdit(e)}
              onDelete={() => deleteEntry(e.id)}
              onScreenshotUpdated={url => handleScreenshotUpdated(e.id, url)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <EntryModal
          type={type}
          existing={editing}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}