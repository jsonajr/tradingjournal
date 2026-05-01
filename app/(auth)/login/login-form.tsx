"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const error = params.get("error");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoading(false); toast.error(error.message); return; }
    let dest = "/dashboard";
    if (signInData.user) {
      const { data: profile } = await supabase.from("profiles").select("role, banned").eq("id", signInData.user.id).maybeSingle();
      if (profile?.banned) {
        await supabase.auth.signOut();
        setLoading(false);
        router.push("/login?error=banned");
        return;
      }
      if (profile?.role === "admin" || profile?.role === "moderator") dest = "/admin";
    }
    setLoading(false);
    toast.success("Welcome back!");
    router.push(dest);
    router.refresh();
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) { toast.error("Enter your email address"); return; }
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset email sent! Check your inbox.");
    setShowForgot(false);
    setForgotEmail("");
  }

  if (showForgot) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" /> Tradiator
          </Link>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" autoFocus />
            </div>
            <Button type="submit" className="w-full" disabled={sendingReset}>
              {sendingReset ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          <button onClick={() => setShowForgot(false)} className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground">
            ← Back to sign in
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <TrendingUp className="h-4 w-4 text-primary" /> Tradiator
        </Link>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {error === "banned" && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            This account has been suspended. Contact support.
          </div>
        )}
        {error === "no_profile" && (
          <div className="mb-4 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-600">
            Profile not found. Please sign up.
          </div>
        )}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" onClick={() => { setForgotEmail(email); setShowForgot(true); }} className="text-xs text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="flex items-center gap-2">
            <input id="stay-logged-in" type="checkbox" checked={stayLoggedIn} onChange={(e) => setStayLoggedIn(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
            <Label htmlFor="stay-logged-in" className="cursor-pointer text-sm font-normal text-muted-foreground">Stay logged in</Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}