import { createServerSupabase } from "../../../../lib/supabase-server";
import { NextResponse } from "next/server";
import { isTrustedBrowserRequest } from "../../../../lib/security";

export async function POST(req: Request) {
  if (!isTrustedBrowserRequest(req)) {
    return new Response("Invalid request origin", { status: 403 });
  }

  const supabase = await createServerSupabase();
  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? req.url),
    303
  );
}
