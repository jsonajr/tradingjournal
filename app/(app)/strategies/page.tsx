import { requireRole } from "@/lib/auth";
import { StrategiesClient } from "./strategies-client";

export const dynamic = "force-dynamic";

export default async function StrategiesPage() {
  await requireRole(["user", "moderator", "admin"]);
  return <StrategiesClient />;
}