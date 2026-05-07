"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";

type Account = { id: string; name: string; firm: string | null };

const PLATFORM_INFO: Record<string, string> = {
  tradovate: "Tradovate: Go to Account → Reports → Performance → Export CSV. Use the Performance report — not Fills or Orders.",
  projectx:  "ProjectX: Reports → Trade History → Download CSV. Columns: Date, Instrument, Side, Quantity, AvgPrice, Pnl, Fee.",
  generic:   "Generic CSV headers: date, symbol, direction, contracts, entry, exit, pnl, commission, setup, grade.",
};

export function ImportClient({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [platform, setPlatform] = useState("tradovate");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState("");
  const [importing, setImporting] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const lines = text.trim().split("\n");
      setPreview(lines.slice(0, 4).join("\n") + (lines.length > 4 ? `\n...(${lines.length} rows)` : ""));
    };
    reader.readAsText(f);
  }

  async function runImport() {
    if (!accountId) { toast.error("Select an account first"); return; }
    if (!csvText) { toast.error("Upload a CSV file first"); return; }
    setImporting(true);
    const res = await fetch("/api/import-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText, platform, account_id: accountId }),
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) { toast.error(data.error ?? "Import failed"); return; }
    toast.success(`Imported ${data.imported} trades!`);
    setCsvText(""); setPreview("");
    router.push("/trades");
    router.refresh();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Import CSV</h1>
        <p className="text-sm text-muted-foreground">Import trades from Tradovate, ProjectX, or a generic CSV</p>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-600">
          You need to <Link href="/settings" className="font-medium underline">add a trading account in Settings</Link> before importing trades.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Import Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <div className="flex gap-2">
                  {["tradovate","projectx","generic"].map((p) => (
                    <Button key={p} size="sm" variant={platform === p ? "default" : "outline"} onClick={() => setPlatform(p)} className="capitalize">{p === "projectx" ? "ProjectX" : p.charAt(0).toUpperCase() + p.slice(1)}</Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{PLATFORM_INFO[platform]}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Assign to Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}{a.firm ? ` (${a.firm})` : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>CSV File</Label>
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center">
                  <div>
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Drop your CSV here or click to browse</p>
                    <Input type="file" accept=".csv,text/csv" onChange={handleFile} className="max-w-xs" />
                  </div>
                </div>
              </div>
              {csvText && (
                <Button onClick={runImport} disabled={importing} className="w-full">
                  {importing ? "Importing..." : "Import Trades"}
                </Button>
              )}
            </CardContent>
          </Card>

          {preview && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />Preview</CardTitle></CardHeader>
              <CardContent>
                <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-auto max-h-48">{preview}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}