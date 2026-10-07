import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../../lib/supabase-server";
import { createAdminSupabase, requireAdmin } from "../../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../../lib/security";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }
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

  if (targetUserId === user.id && status !== "active") {
    return NextResponse.json({ error: "CANNOT_DISABLE_SELF" }, { status: 409 });
  }

  const admin = createAdminSupabase();

  const { data: before } = await admin
    .from("profiles")
    .select("plan_name,status")
    .eq("id", targetUserId)
    .single();

  const { error } = await admin
    .from("profiles")
    .update({
      plan_name: planName,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("admin_audit_log").insert({
    actor_user_id: user.id,
    action: "user_access_updated",
    target_type: "profile",
    target_id: targetUserId,
    metadata: {
      before: before ?? null,
      after: { plan_name: planName, status },
    },
  });

  return NextResponse.redirect(new URL("/admin?updated=1", req.url), 303);
}
