import { NextResponse } from "next/server";
import { workspaceUser } from "../../../../lib/workspace-server";
import { createAdminSupabase } from "../../../../lib/admin";
import { workspaceEnabled, trustedWorkspaceMutation } from "../../../../lib/workspace-sandbox";
import { boundedForm, FORM_LIMIT_BYTES } from "../../../../lib/bounded-form";
export async function POST(req: Request) {
  if (!workspaceEnabled()) return new Response(null,{status:404});
  if (!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL)) return new Response(null,{status:403});
  const context = await workspaceUser();
  if (!context) return new Response(null,{status:401});
  const form = await boundedForm(req, FORM_LIMIT_BYTES).catch(() => null);
  if (!form) return new Response(null, { status: 413 });
  const level = Number(form.get("level"));
  if (!Number.isInteger(level) || level<1 || level>15) return new Response(null,{status:400});
  const {error} = await createAdminSupabase().rpc("issue_workspace_diploma",{p_user:context.user.id,p_level:level});
  return NextResponse.redirect(new URL(`/diplomas/${level}${error?"?saved=failed":""}`,process.env.NEXT_PUBLIC_APP_URL ?? req.url),303);
}
