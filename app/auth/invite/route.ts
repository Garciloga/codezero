import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../lib/supabase-server";
import { workspaceSandboxEnabled, isUuid } from "../../../lib/workspace-sandbox";
export async function GET(req: Request) {
  if (!workspaceSandboxEnabled()) return new Response(null,{status:404});
  const query = new URL(req.url).searchParams;
  const invitation = query.get("invitation_id");
  const tokenHash = query.get("token_hash");
  if (!isUuid(invitation) || !tokenHash || tokenHash.length>300) return new Response(null,{status:400});
  const supabase = await createServerSupabase();
  const {error} = await supabase.auth.verifyOtp({token_hash:tokenHash,type:"invite"});
  // Never echo, log or carry the token into the redirect target.
  const response = NextResponse.redirect(new URL(error?"/teams?result=invite_failed":`/teams/join?id=${invitation}`,process.env.NEXT_PUBLIC_APP_URL ?? req.url),303);
  response.headers.set("Referrer-Policy","no-referrer");
  response.headers.set("Cache-Control","private, no-store");
  return response;
}
