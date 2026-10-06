import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../../lib/supabase-server";
import { createAdminSupabase, requireAdmin } from "../../../../../lib/admin";

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url), 303);

  try {
    await requireAdmin(user.id);
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const formData = await req.formData();
  const targetUserId = String(formData.get("user_id") ?? "");
  const planName = String(formData.get("plan_name") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!targetUserId || !["free","starter","pro","enterprise"].includes(planName) || !["active","suspended","cancelled"].includes(status)) {
    return NextResponse.json({ error: "INVALID_UPDATE" }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("profiles")
    .update({
      plan_name: planName,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/admin?updated=1", req.url), 303);
}
