import { requireRole } from "@/lib/auth";
import { EvalClient } from "./eval-client";

export const dynamic = "force-dynamic";

export default async function EvalPage() {
  await requireRole(["user", "moderator", "admin"]);
  return <EvalClient />;
}