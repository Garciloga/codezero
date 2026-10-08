import 'server-only';
import {roleTrainingEnabled} from './role-training-policy';
export {roleTrainingEnabled} from './role-training-policy';
import {workspaceUser} from './workspace-server';
import {readWorkspacePages} from './workspace-pages';
import {competencyProfile,type CompetencyEvidence,type JobProfile} from './competency-matrix';
export async function roleTrainingSession(){return roleTrainingEnabled()?workspaceUser():null;}
export async function trainingPerson(userId:string,org:string|null){
 const session=await roleTrainingSession();if(!session)return null;
 if(userId!==session.user.id){
  if(!org)return null;
  const {data}=await session.supabase.from('organization_memberships').select('user_id').eq('organization_id',org).eq('user_id',userId).eq('active',true).maybeSingle();
  if(!data)return null;
 }
 const history=await readWorkspacePages<CompetencyEvidence>((a,b)=>{
  let q=session.supabase.from('learning_evidence_history').select('id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,observed_at,reevaluation_of,critical_errors,feedback').eq('user_id',userId);
  q=org?q.eq('organization_id',org):q.is('organization_id',null);return q.order('observed_at').order('id').range(a,b);
 });
 const position=org?await session.supabase.from('organization_memberships').select('learning_position_key').eq('organization_id',org).eq('user_id',userId).eq('active',true).maybeSingle()
  :await session.supabase.from('profiles').select('learning_position_key').eq('id',userId).maybeSingle();
 const profiles=await readWorkspacePages<JobProfile>((a,b)=>session.supabase.from('learning_job_profiles').select('position_key,version,weights,expected').order('version',{ascending:false}).order('position_key').range(a,b));
 const selected=position.data?.learning_position_key;
 const profile=(profiles.data??[]).find(p=>p.position_key===selected) as JobProfile|undefined;
 if(history.error||position.error||profiles.error)throw Error('TRAINING_DATA_UNAVAILABLE');
 return {session,evidence:history.data??[],profile:profile??null,summary:competencyProfile(history.data??[],profile??null),profiles:profiles.data as JobProfile[]};
}
