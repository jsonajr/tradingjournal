import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDate } from "@/lib/utils";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q ?? "";
  const sb = createAdminClient();

  let query = sb.from("profiles").select("*").order("created_at", { ascending: false });
  if (q) {
    if (q.match(/^[0-9a-f-]{36}$/i)) query = query.eq("id", q);
    else query = query.ilike("email", `%${q}%`);
  }
  const { data: users } = await query.limit(100);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Users</h1>
        <p className="text-sm text-muted-foreground">{users?.length ?? 0} users shown</p>
      </div>
      <Card>
        <CardHeader>
          <form className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={q} placeholder="Search by email or user ID..." className="pl-9" />
            </div>
          </form>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead>Last Seen</TableHead><TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell><Link href={`/admin/users/${u.id}`} className="font-medium hover:text-primary hover:underline">{u.email}</Link></TableCell>
                  <TableCell className="text-muted-foreground">{u.full_name ?? "—"}</TableCell>
                  <TableCell><Badge variant={u.role === "admin" ? "default" : u.role === "moderator" ? "warning" : "outline"}>{u.role}</Badge></TableCell>
                  <TableCell><Badge variant={u.plan === "premium" ? "default" : u.plan === "pro" ? "warning" : "secondary"}>{u.plan}</Badge></TableCell>
                  <TableCell>{u.banned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="success">Active</Badge>}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(u.last_seen)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(u.created_at)}</TableCell>
                </TableRow>
              ))}
              {(!users || users.length === 0) && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No users found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
