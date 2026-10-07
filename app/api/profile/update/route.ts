import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { isTrustedBrowserRequest } from "../../../../lib/security";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url), 303);
  }

  const formData = await req.formData();
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (fullName.length < 2 || fullName.length > 100) {
    return NextResponse.redirect(new URL("/profile?updated=invalid", req.url), 303);
  }

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.redirect(new URL("/profile?updated=error", req.url), 303);
  }

  return NextResponse.redirect(new URL("/profile?updated=1", req.url), 303);
}
