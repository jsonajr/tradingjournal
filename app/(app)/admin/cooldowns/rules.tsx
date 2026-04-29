"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Rule = { id: string; name: string; trigger_type: string; threshold: number; duration_minutes: number; is_enabled: boolean };

export function CooldownRules({ initialRules }: { initialRules: Rule[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("after_loss");
  const [threshold, setThreshold] = useState("1");
  const [duration, setDuration] = useState("120");

  function call(method: string, body: Record<string, unknown>) {
    startTransition(async () => {
      const res = await fetch("/api/admin/cooldowns", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error ?? "Failed"); return; }
      toast.success(d.message ?? "Saved");
      router.refresh();
    });
  }
  function addRule() {
    if (!name) { toast.error("Name required"); return; }
    call("POST", { name, trigger_type: trigger, threshold: parseInt(threshold), duration_minutes: parseInt(duration) });
    setAdding(false); setName(""); setThreshold("1"); setDuration("120");
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Global Rules ({initialRules.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}><Plus className="mr-1 h-3.5 w-3.5" />Add</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && (
          <div className="rounded-md border p-3 space-y-2">
            <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lock after a loss" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Trigger</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="after_loss">After a loss</SelectItem>
                  <SelectItem value="consecutive_losses">Consecutive losses</SelectItem>
                  <SelectItem value="daily_limit">Daily loss limit</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5"><Label className="text-xs">Threshold</Label><Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Duration (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
            </div>
            <div className="flex gap-2"><Button size="sm" onClick={addRule}>Save</Button><Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button></div>
          </div>
        )}
        {initialRules.length === 0 && !adding && <div className="py-6 text-center text-sm text-muted-foreground">No rules configured</div>}
        {initialRules.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">{r.name}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">{r.trigger_type}</Badge>
                <Badge variant="outline" className="text-xs">≥{r.threshold}</Badge>
                <Badge variant="outline" className="text-xs">{r.duration_minutes}min</Badge>
                {r.is_enabled ? <Badge variant="success" className="text-xs">on</Badge> : <Badge variant="secondary" className="text-xs">off</Badge>}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => call("PATCH", { id: r.id, is_enabled: !r.is_enabled })}>{r.is_enabled ? "Off" : "On"}</Button>
              <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) call("DELETE", { id: r.id }); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
