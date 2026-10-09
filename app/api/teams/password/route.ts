import { NextResponse } from "next/server";
import { workspaceUser } from "../../../../lib/workspace-server";
import { workspaceSandboxEnabled, trustedWorkspaceMutation, isTestInvitationEmail } from "../../../../lib/workspace-sandbox";
import { boundedForm, FORM_LIMIT_BYTES } from "../../../../lib/bounded-form";
export async function POST(req: Request) {
  if (!workspaceSandboxEnabled()) return new Response(null,{status:404});
  if (!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL)) return new Response(null,{status:403});
  const context = await workspaceUser();
  if (!context?.user.email || !context.user.email_confirmed_at || !isTestInvitationEmail(context.user.email)) return new Response(null,{status:401});
  const form = await boundedForm(req, FORM_LIMIT_BYTES).catch(() => null);
  if (!form) return new Response(null, { status: 413 });
  const password = String(form.get("password")??"");
  if (password.length<12 || password.length>128 || password !== form.get("password_confirmation")) return new Response(null,{status:400});
  const {error} = await context.supabase.auth.updateUser({password});
  return NextResponse.redirect(new URL(error?"/teams?result=password_failed":"/teams",process.env.NEXT_PUBLIC_APP_URL ?? req.url),303);
}
