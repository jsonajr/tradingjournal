import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDate } from "@/lib/utils";
import { CooldownRules } from "./rules";

export const dynamic = "force-dynamic";

export default async function AdminCooldownsPage() {
  const sb = createAdminClient();
  const { data: cooldowns } = await sb
    .from("cooldowns")
    .select("*")
    .eq("is_active", true)
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: true })
    .limit(100);
  const ids = [...new Set((cooldowns ?? []).map((c) => c.user_id))];
  const { data: profiles } = await sb.from("profiles").select("id, email").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const m = new Map((profiles ?? []).map((p) => [p.id, p.email]));
  const { data: rules } = await sb.from("cooldown_rules").select("*").order("created_at");

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Cooldowns</h1>
        <p className="text-sm text-muted-foreground">Active locks and global rules</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Active ({cooldowns?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Reason</TableHead><TableHead>Ends</TableHead><TableHead>Time Left</TableHead></TableRow></TableHeader>
              <TableBody>
                {(cooldowns ?? []).map((c) => {
                  const left = Math.max(0, new Date(c.ends_at).getTime() - Date.now());
                  const h = Math.floor(left / 3600000);
                  const min = Math.floor((left % 3600000) / 60000);
                  return (
                    <TableRow key={c.id}>
                      <TableCell><Link href={`/admin/users/${c.user_id}`} className="text-xs hover:text-primary hover:underline">{m.get(c.user_id) ?? c.user_id.slice(0, 8)}</Link></TableCell>
                      <TableCell className="text-xs">{c.reason ?? "—"}</TableCell>
                      <TableCell className="text-xs">{fmtDate(c.ends_at)}</TableCell>
                      <TableCell><Badge variant="warning">{h}h {min}m</Badge></TableCell>
                    </TableRow>
                  );
                })}
                {(!cooldowns || cooldowns.length === 0) && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No active cooldowns</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <CooldownRules initialRules={rules ?? []} />
      </div>
    </div>
  );
}
