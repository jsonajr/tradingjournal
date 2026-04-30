import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  // Delete all user data
  await adminClient.from("trades").delete().eq("user_id", userId);
  await adminClient.from("accounts").delete().eq("user_id", userId);
  await adminClient.from("user_settings").delete().eq("user_id", userId);
  await adminClient.from("profiles").delete().eq("id", userId);

  // Delete the auth user entirely
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}