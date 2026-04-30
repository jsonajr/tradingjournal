"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Trash2, Link as LinkIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Invite = {
  id: string; code: string; note: string | null;
  created_at: string; used_at: string | null; expires_at: string | null;
  creator: { email: string } | null;
  usedBy: { email: string } | null;
};

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${seg()}-${seg()}`;
}

export function InvitesClient({ invites: initial }: { invites: Invite[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [invites, setInvites] = useState(initial);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [expires, setExpires] = useState("");
  const [count, setCount] = useState("1");
  const [saving, setSaving] = useState(false);

  async function generate() {
    setSaving(true);
    const n = Math.min(Math.max(parseInt(count) || 1, 1), 50);
    const rows = Array.from({ length: n }, () => ({
      code: randomCode(),
      note: note || null,
      expires_at: expires || null,
    }));
    const { data, error } = await supabase.from("invite_codes").insert(rows).select();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setInvites((prev) => [...(data ?? []), ...prev]);
    toast.success(`${n} invite code${n > 1 ? "s" : ""} generated`);
    setOpen(false);
    setNote(""); setExpires(""); setCount("1");
    router.refresh();
  }

  async function deleteInvite(id: string) {
    if (!confirm("Delete this invite code?")) return;
    const { error } = await supabase.from("invite_codes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setInvites((prev) => prev.filter((i) => i.id !== id));
    toast.success("Deleted");
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/signup?invite=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  }

  const unused = invites.filter((i) => !i.used_at);
  const used = invites.filter((i) => i.used_at);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Invite Codes</h1>
          <p className="text-sm text-muted-foreground">{unused.length} unused · {used.length} used</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Generate Codes</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">All Codes</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((inv) => {
                const expired = inv.expires_at && new Date(inv.expires_at) < new Date();
                const status = inv.used_at ? "used" : expired ? "expired" : "active";
                return (
                  <TableRow key={inv.id} className={inv.used_at ? "opacity-50" : ""}>
                    <TableCell>
                      <code className="font-mono font-bold text-sm tracking-widest">{inv.code}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status === "used" ? "secondary" : status === "expired" ? "destructive" : "success"}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.note ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.usedBy?.email ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!inv.used_at && (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyCode(inv.code)} title="Copy code">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(inv.code)} title="Copy invite link">
                              <LinkIcon className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteInvite(inv.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {invites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No invite codes yet — generate some to let people sign up
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Invite Codes</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Number of codes</Label>
              <Input type="number" min="1" max="50" value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Note <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Discord giveaway, beta users..." />
            </div>
            <div className="space-y-1.5">
              <Label>Expires <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={generate} disabled={saving}>{saving ? "Generating..." : "Generate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}