import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function RootPage() {
  const profile = await getCurrentProfile();
  if (profile && !profile.banned) {
    redirect(profile.role === "admin" || profile.role === "moderator" ? "/admin" : "/dashboard");
  }
  redirect("/signup");
}