import {deliverCompanyInvitation} from "../../../../lib/company-invitation-delivery";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "../../../../lib/admin";
import { workspaceUser } from "../../../../lib/workspace-server";
import { isUuid, isTestInvitationEmail, validInvitationEmail, workspaceProductionEnabled, trustedWorkspaceMutation, workspaceEnabled } from "../../../../lib/workspace-sandbox";
import { parseAssignedActivity } from "../../../../lib/team-report";
import { boundedForm } from "../../../../lib/bounded-form";
export async function POST(req: Request) {
  if (!workspaceEnabled()) return new Response(null,{status:404});
  if (!trustedWorkspaceMutation(req,process.env.NEXT_PUBLIC_APP_URL)) return new Response(null,{status:403});
  const context = await workspaceUser();
  if (!context) return new Response(null,{status:401});
  let form: FormData;
  try { form = await boundedForm(req,8192); }
  catch(error) { return new Response(null,{status:error instanceof Error && error.message==="FORM_TOO_LARGE" ? 413 : 400}); }
  const action = String(form.get("action"));
  const admin = createAdminSupabase();
  if (action === "create") {
    return NextResponse.redirect(new URL("/admin/companies",process.env.NEXT_PUBLIC_APP_URL??req.url),303);
  }
  const org = String(form.get("organization_id") ?? "");
  if (!isUuid(org)) return new Response(null,{status:400});
  const {data:membership,error:memberError} = await context.supabase.from("organization_memberships").select("role").eq("organization_id",org).eq("user_id",context.user.id).eq("active",true).single();
  if (memberError || !membership) return new Response(null,{status:403});
  const manager = ["owner","admin"].includes(membership.role);
  let failed = false;
  if (action === "refresh") {
    failed = Boolean((await admin.rpc("refresh_workspace_evidence",{p_org:org,p_actor:context.user.id})).error);
  } else if (action === "member" && manager) {
    const target = String(form.get("user_id"));
    const role = String(form.get("role"));
    const reports = String(form.get("reports_to") ?? "") || null;
    const jobTitle = String(form.get("job_title")??"").trim();
    if (!isUuid(target) || jobTitle.length>120 || (reports && !isUuid(reports)) || !["owner","admin","manager","supervisor","learner"].includes(role)) return new Response(null,{status:400});
    failed = Boolean((await admin.rpc("update_workspace_member_details",{p_org:org,p_actor:context.user.id,p_target:target,p_role:role,p_reports:reports,p_active:form.get("active")==="1",p_job_title:jobTitle})).error);
  } else if (action === "invite") {
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const role = String(form.get("role"));
    const reports = String(form.get("reports_to") ?? "") || null;
    if (!(workspaceProductionEnabled() ? validInvitationEmail(email) : isTestInvitationEmail(email)) || (reports && !isUuid(reports)) || !["admin","manager","supervisor","learner"].includes(role)) return new Response(null,{status:400});
    const teamId=String(form.get("team_id")??"")||null;
    if(teamId&&!isUuid(teamId))return new Response(null,{status:400});
    const {data:invite,error} = await admin.rpc("create_company_invitation",{p_org:org,p_actor:context.user.id,p_email:email,p_role:role,p_reports:reports,p_team:teamId});
    failed = Boolean(error);
    // Auth email delivery is restricted to a locally captured test SMTP service.
    // A hosted sandbox can prepare invitations but cannot send mail via this path.
    if (!error && process.env.CODEZERO_TEST_MAIL_CAPTURE === "1" && process.env.CODEZERO_SANDBOX_PROJECT_REF === "local") {
      const result = await admin.auth.admin.inviteUserByEmail(email,{redirectTo:new URL(`/auth/invite?invitation_id=${invite}`,process.env.NEXT_PUBLIC_APP_URL ?? req.url).toString()});
      return NextResponse.redirect(new URL(`/teams/${org}?result=${result.error ? "mail_failed" : "mail_requested"}`,process.env.NEXT_PUBLIC_APP_URL ?? req.url),303);
    }
    if (!error){const delivery=await deliverCompanyInvitation(invite,context.user.id);return NextResponse.redirect(new URL(`/teams/${org}/invite?result=${delivery==='queued'?'mail_queued':delivery==='failed'?'mail_failed':'invitation_pending'}`,process.env.NEXT_PUBLIC_APP_URL ?? req.url),303);}
  } else if (action === "assign" && ["owner","admin","manager","supervisor"].includes(membership.role)) {
    const target = String(form.get("user_id"));
    const selected = parseAssignedActivity(form.get("activity_key"));
    const type = selected?.type;
    const activity = selected?.id;
    const competency = String(form.get("competency") ?? "").trim();
    if (!isUuid(target) || !selected || !competency || competency.length>80) return new Response(null,{status:400});
    failed = Boolean((await admin.rpc("assign_workspace_activity",{p_org:org,p_actor:context.user.id,p_user:target,p_type:type,p_id:activity,p_competency:competency})).error);
  } else {return new Response(null,{status:403});}
  return NextResponse.redirect(new URL(`/teams/${org}?result=${failed?"failed":"saved"}`,process.env.NEXT_PUBLIC_APP_URL ?? req.url),303);
}

