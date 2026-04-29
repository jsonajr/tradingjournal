import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile && !profile.banned) {
    redirect(profile.role === "admin" || profile.role === "moderator" ? "/admin" : "/dashboard");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <LoginForm />
    </div>
  );
}