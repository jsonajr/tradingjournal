"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Globe, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";

type Session = {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent?: string;
  ip?: string;
  isCurrent?: boolean;
};

function parseDevice(ua?: string) {
  if (!ua) return { label: "Unknown Device", icon: Globe };
  if (/iPhone|iPad|Android|Mobile/i.test(ua)) return { label: "Mobile Device", icon: Smartphone };
  if (/Windows|Macintosh|Linux/i.test(ua)) return { label: "Desktop Browser", icon: Monitor };
  return { label: "Browser", icon: Globe };
}

function parseBrowser(ua?: string) {
  if (!ua) return "Unknown";
  if (/Chrome/i.test(ua) && !/Chromium|Edge|OPR/i.test(ua)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/Edge/i.test(ua)) return "Edge";
  if (/OPR|Opera/i.test(ua)) return "Opera";
  return "Browser";
}

function parseOS(ua?: string) {
  if (!ua) return "";
  if (/iPhone/i.test(ua)) return "iOS";
  if (/iPad/i.test(ua)) return "iPadOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Macintosh/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "";
}

export function SessionsTab({ timezone }: { timezone?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { session: current } } = await supabase.auth.getSession();
      // Supabase doesn't expose other sessions via client SDK
      // We show the current session and allow signing out all others
      if (current) {
        setSessions([{
          id: current.access_token.slice(-8),
          created_at: new Date(current.user.created_at).toISOString(),
          updated_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          isCurrent: true,
        }]);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function signOutAll() {
    if (!confirm("Sign out of all other devices? You will stay logged in on this device.")) return;
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) { toast.error(error.message); return; }
    toast.success("Signed out of all other devices");
    router.refresh();
  }

  async function signOutCurrent() {
    if (!confirm("Sign out of this device?")) return;
    await supabase.auth.signOut({ scope: "local" });
    router.push("/login");
  }

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading sessions...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Active Sessions</CardTitle>
              <CardDescription className="mt-1">Devices currently signed in to your account.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={signOutAll} className="border-destructive/50 text-destructive hover:bg-destructive/10">
              <LogOut className="mr-1 h-3.5 w-3.5" />Sign out all other devices
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.map((s) => {
            const { label, icon: Icon } = parseDevice(s.user_agent);
            const browser = parseBrowser(s.user_agent);
            const os = parseOS(s.user_agent);
            return (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{label}</span>
                      {s.isCurrent && <Badge className="bg-green-500/15 text-green-500 text-xs">This device</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {browser}{os ? ` · ${os}` : ""}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last active: {new Date(s.updated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: timezone || undefined })}
                    </div>
                  </div>
                </div>
                {s.isCurrent && (
                  <Button variant="ghost" size="sm" onClick={signOutCurrent} className="text-muted-foreground hover:text-destructive">
                    <LogOut className="mr-1 h-3.5 w-3.5" />Sign out
                  </Button>
                )}
              </div>
            );
          })}

          <div className="rounded-lg border border-dashed border-zinc-700 p-4 text-center">
            <p className="text-xs text-muted-foreground">Other active sessions are not visible here due to security restrictions, but you can sign them all out using the button above.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}