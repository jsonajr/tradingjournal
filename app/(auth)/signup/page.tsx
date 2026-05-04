"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Lock } from "lucide-react";
import { toast } from "sonner";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(searchParams.get("invite") ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) { toast.error("An invite code is required"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);

    const { data: invite, error: inviteErr } = await supabase
      .from("invite_codes")
      .select("id, used_at, expires_at")
      .eq("code", inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (inviteErr || !invite) {
      toast.error("Invalid invite code. Please check and try again.");
      setLoading(false);
      return;
    }
    if (invite.used_at) {
      toast.error("This invite code has already been used.");
      setLoading(false);
      return;
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      toast.error("This invite code has expired.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, invite_code: inviteCode.trim().toUpperCase() } },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }

    if (data.user) {
      await supabase.from("invite_codes").update({ used_at: new Date().toISOString(), used_by: data.user.id }).eq("id", invite.id);
      await supabase.from("profiles").update({ plan: "premium" }).eq("id", data.user.id);
      await supabase.from("subscriptions").upsert({ user_id: data.user.id, plan: "premium", status: "active" }, { onConflict: "user_id" });
    }

    if (data.user && !data.session) {
      toast.success("Check your email to confirm your account!");
      router.push("/login");
    } else {
      toast.success("Welcome! Your account is ready.");
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <TrendingUp className="h-4 w-4 text-primary" /> Tradiator
        </Link>
        <CardTitle>Create your account</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-amber-500" />
          Invite-only — you need a code to sign up
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              autoComplete="off"
              className="font-mono tracking-widest uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Benjamin Netanyahu" autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying & creating account..." : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 50%, #000000 100%)" }}>
      <Suspense fallback={<div className="w-full max-w-md animate-pulse rounded-lg bg-muted h-96" />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}