import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile && !profile.banned) {
    redirect(profile.role === "admin" || profile.role === "moderator" ? "/admin" : "/dashboard");
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 50%, #000000 100%)" }}>
      <LoginForm />
    </div>
  );
}