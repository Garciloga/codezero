import { NextResponse } from "next/server";
import { workspaceUser } from "../../../../lib/workspace-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { workspaceEnabled, trustedWorkspaceMutation, isUuid } from "../../../../lib/workspace-sandbox";
import { boundedForm, FORM_LIMIT_BYTES } from "../../../../lib/bounded-form";
export async function POST(req: Request) {
  if (!workspaceEnabled()) return new Response(null,{status:404});
  if (!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL)) return new Response(null,{status:403});
  const context = await workspaceUser();
  if (!context?.user.email || !context.user.email_confirmed_at) return new Response(null,{status:401});
  const form = await boundedForm(req, FORM_LIMIT_BYTES).catch(() => null);
  if (!form) return new Response(null, { status: 413 });
  const invite = form.get("invitation_id");
  const name = String(form.get("display_name") ?? "").trim();
  if (!isUuid(invite) || name.length<1 || name.length>120) return new Response(null,{status:400});
  const {data,error} = await createAdminSupabase().rpc("accept_workspace_invitation",{p_invite:invite,p_actor:context.user.id,p_verified_email:context.user.email,p_name:name});
  return NextResponse.redirect(new URL(error?"/teams?result=invite_failed":`/teams/${data}`,process.env.NEXT_PUBLIC_APP_URL ?? req.url),303);
}
