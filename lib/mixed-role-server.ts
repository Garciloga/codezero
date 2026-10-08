import 'server-only';
import {mixedRoleEnabled} from './mixed-role-policy';
import {createAdminSupabase} from './admin';
import {roleTrainingSession} from './role-training-server';
import {readWorkspacePages} from './workspace-pages';
import type {MixedArtifact} from './mixed-role-scenarios';
export async function mixedReleaseEnabled(){
 if(!mixedRoleEnabled())return false;
 const {data,error}=await createAdminSupabase().from('learning_mixed_release').select('enabled').eq('id',true).maybeSingle();
 return !error&&data?.enabled===true;
}
export async function mixedArtifacts(userId:string,org:string|null){
 const session=await roleTrainingSession();if(!session)return null;
 const rows=await readWorkspacePages<{submission_id:string;step_key:string;payload:Record<string,unknown>;learning_practice_submissions:unknown}>((a,b)=>{
  let query=session.supabase.from('learning_mixed_submission_steps').select('submission_id,step_key,payload,learning_practice_submissions!inner(user_id,organization_id,draft,created_at)').eq('learning_practice_submissions.user_id',userId);
  query=org?query.eq('learning_practice_submissions.organization_id',org):query.is('learning_practice_submissions.organization_id',null);
  return query.order('submission_id').range(a,b);
 });
 if(rows.error)throw Error('MIXED_DATA_UNAVAILABLE');
 return (rows.data??[]).map(row=>{const submission=row.learning_practice_submissions as {draft:string;created_at:string};return {submission_id:row.submission_id,step_key:row.step_key,payload:row.payload,draft:submission.draft,created_at:submission.created_at};}).sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.submission_id.localeCompare(a.submission_id)) as MixedArtifact[];
}
