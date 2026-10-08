import 'server-only';
import {organizationView} from './organization-server';
import {readWorkspacePages} from './workspace-pages';
import {monthlyReport,monthlyBounds,monthlyCompletions} from './monthly-team-report';
import type {CompetencyEvidence,JobProfile} from './competency-matrix';
export async function loadMonthlyReport(org:string,month:string,team:string|null=null){
 monthlyBounds(month);const d=await organizationView(org,['owner','admin','manager','supervisor']);if(!d||!['owner','admin','manager','supervisor'].includes(d.own.role))return null;
 const [history,profiles,positions,assignments,teamMembers,legacy]=await Promise.all([
 readWorkspacePages<CompetencyEvidence>((a,b)=>d.supabase.from('learning_evidence_history').select('*').eq('organization_id',org).order('observed_at').order('id').range(a,b)),
 readWorkspacePages<JobProfile>((a,b)=>d.supabase.from('learning_job_profiles').select('*').order('version',{ascending:false}).order('position_key').range(a,b)),
 readWorkspacePages<{user_id:string;learning_position_key:string|null}>((a,b)=>d.supabase.from('organization_memberships').select('user_id,learning_position_key').eq('organization_id',org).order('user_id').range(a,b)),
 readWorkspacePages<{user_id:string;activity_key:string;activity_id:number;due_at:string|null}>((a,b)=>d.supabase.from('learning_assignments').select('user_id,activity_key,activity_id,due_at').eq('organization_id',org).order('user_id').order('activity_key').range(a,b)),
 team?readWorkspacePages<{user_id:string}>((a,b)=>d.supabase.from('organization_team_members').select('user_id').eq('organization_id',org).eq('team_id',team).order('user_id').range(a,b)):Promise.resolve({data:[],error:null}),
 readWorkspacePages<{user_id:string;activity_key:string;completed:boolean;observed_at:string}>((a,b)=>d.supabase.from('learning_evidence').select('user_id,activity_key,completed,observed_at').eq('organization_id',org).order('user_id').order('activity_key').range(a,b)),
 ]);if([history,profiles,positions,assignments,teamMembers,legacy].some(r=>r.error))throw Error('MONTHLY_REPORT_UNAVAILABLE');
 const people=d.people.filter(p=>p.user_id!==d.user.id&&(!team||teamMembers.data?.some(m=>m.user_id===p.user_id))).map(p=>({...p,profile:profiles.data?.find(f=>f.position_key===positions.data?.find(m=>m.user_id===p.user_id)?.learning_position_key)??null}));
 // Convert numeric assignment IDs using the same catalog, and only count human reviewed results.
 const ids=[...new Set([...(assignments.data??[]).filter(a=>a.activity_key.startsWith('route_unit:')).map(a=>a.activity_id),...(legacy.data??[]).filter(e=>e.activity_key.startsWith('route_unit:')).map(e=>Number(e.activity_key.slice(11)))])].filter(Number.isSafeInteger);
 const {data:catalog,error}=ids.length?await d.supabase.from('learning_activity_catalog').select('id,content_key').in('id',ids):{data:[],error:null};if(error)throw Error('MONTHLY_REPORT_UNAVAILABLE');
 const mapped=(assignments.data??[]).map(a=>({...a,activity_key:catalog?.find(c=>c.id===a.activity_id)?.content_key??a.activity_key}));
 const report=monthlyReport(month,people,history.data??[],mapped),bounds=monthlyBounds(month),cutoff=Math.min(Date.now(),bounds.end.getTime()-1);
 for(const row of report.rows)Object.assign(row,monthlyCompletions(row.user_id,history.data??[],legacy.data??[],mapped,catalog??[],bounds.start.getTime(),cutoff));
 report.completed=report.rows.reduce((s,r)=>s+r.completed,0);report.overdue=report.rows.reduce((s,r)=>s+r.overdue,0);const teams=await d.supabase.from('organization_teams').select('id,name').eq('organization_id',org).order('name');if(teams.error)throw Error('MONTHLY_REPORT_UNAVAILABLE');return {d,report,teams:teams.data??[]};
}
