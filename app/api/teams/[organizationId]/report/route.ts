import { workspaceUser } from "../../../../../lib/workspace-server";
import { workspaceEnabled, isUuid } from "../../../../../lib/workspace-sandbox";
import { readWorkspacePages } from "../../../../../lib/workspace-pages";
import { teamReportCsv } from "../../../../../lib/team-report";
import type { ReportMember, ReportAssignment, ReportEvidence } from "../../../../../lib/team-report";
export async function GET(_req: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  if (!workspaceEnabled()) return new Response(null,{status:404});
  const { organizationId: org } = await params;
  if (!isUuid(org)) return new Response(null,{status:404});
  const session = await workspaceUser();
  if (!session) return new Response(null,{status:401});
  const { data: membership, error: memberError } = await session.supabase.from("organization_memberships").select("user_id").eq("organization_id",org).eq("user_id",session.user.id).eq("active",true).maybeSingle();
  if (memberError || !membership) return new Response(null,{status:404});
  // Never use the service client for export. Existing database RLS limits all rows.
  const [members, assignments, evidence] = await Promise.all([
    readWorkspacePages<ReportMember>((start,end)=>session.supabase.from("organization_memberships").select("user_id,display_name,role,active").eq("organization_id",org).order("user_id").range(start,end)),
    readWorkspacePages<ReportAssignment>((start,end)=>session.supabase.from("learning_assignments").select("user_id,activity_key,title,competency").eq("organization_id",org).order("user_id").order("activity_key").range(start,end)),
    readWorkspacePages<ReportEvidence>((start,end)=>session.supabase.from("learning_evidence").select("user_id,activity_key,completed,score,observed_at").eq("organization_id",org).order("user_id").order("activity_key").range(start,end)),
  ]);
  if (!members.data || !assignments.data || !evidence.data) return new Response("No pudimos generar el reporte completo",{status:503,headers:{"Cache-Control":"no-store"}});
  return new Response(teamReportCsv(members.data,assignments.data,evidence.data), { headers: {
    "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="codezero-team-report.csv"',
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  }});
}
