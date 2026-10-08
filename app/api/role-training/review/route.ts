import {boundedForm} from '../../../../lib/bounded-form';
import {roleTrainingEnabled,roleTrainingSession} from '../../../../lib/role-training-server';
import {trustedWorkspaceMutation,isUuid} from '../../../../lib/workspace-sandbox';
import {createAdminSupabase} from '../../../../lib/admin';
import {validScores,competencyProfile,type CompetencyEvidence,type JobProfile} from '../../../../lib/competency-matrix';
import {consumeRateLimit} from '../../../../lib/rate-limit';
import {readWorkspacePages} from '../../../../lib/workspace-pages';
export async function POST(req:Request){
 if(!roleTrainingEnabled())return new Response(null,{status:404});if(!trustedWorkspaceMutation(req))return new Response(null,{status:403});
 const session=await roleTrainingSession();if(!session)return new Response(null,{status:401});
 const rate=await consumeRateLimit('training-review:'+session.user.id,30,600);if(!rate.allowed)return new Response(null,{status:429});
 let f:FormData;try{f=await boundedForm(req,20000);}catch{return new Response(null,{status:413});}
 const id=f.get('submission_id'),expected=String(f.get('expected')??'')||null;
 if(!isUuid(id)||(expected&&!isUuid(expected)))return new Response(null,{status:400});
 // Read through the user's RLS unless the verified platform administrator is reviewing.
 const admin=createAdminSupabase(),privileged=['owner','admin'].includes(session.profile.role);
 const reader=privileged?admin:session.supabase;
 const {data:s,error:readError}=await reader.from('learning_practice_submissions').select('id,user_id,organization_id,activity_id').eq('id',id).single();
 if(readError||!s)return new Response(null,{status:403});
 const {data:a}=await reader.from('learning_activity_catalog').select('competencies').eq('id',s.activity_id).single();if(!a)return new Response(null,{status:400});
 if(a.competencies.some((k:string)=>!f.has('score_'+k)))return new Response(null,{status:400});
 const scores=Object.fromEntries(a.competencies.map((k:string)=>[k,Number(f.get('score_'+k))]));if(!validScores(scores))return new Response(null,{status:400});
 const stageText=f.get('stage'),stage=stageText===null?null:Number(stageText),decision=String(f.get('decision')??'approve');
 if(stage!==null&&(!Number.isInteger(stage)||stage<0||stage>7)||!['approve','request_changes'].includes(decision))return new Response(null,{status:400});
 const {error}=await admin.rpc('review_training_practice',{p_actor:session.user.id,p_submission:id,p_scores:scores,p_feedback:String(f.get('feedback')??''),p_errors:f.getAll('errors').map(String),p_expected:expected,p_assistance:String(f.get('assistance')),p_stage:stage,p_decision:decision});
 if(error)return Response.json({error:'REVIEW_FAILED',detail:'Revisa alcance, rúbrica y versión de la revisión.'},{status:409});
 const {data:run,error:runError}=await admin.from('learning_project_review_runs').select('state,authorizer_id').eq('submission_id',id).maybeSingle();
 if(runError)return Response.json({error:'REVIEW_SAVED_STATUS_PENDING'},{status:503});
 if(run&&run.state!=='approved')return Response.redirect(new URL('/role-training/review?organization_id='+s.organization_id,req.url),303);
 if(s.organization_id){
  const [h,m,profiles]=await Promise.all([
   readWorkspacePages<CompetencyEvidence>((start,end)=>admin.from('learning_evidence_history').select('id,user_id,organization_id,activity_key,independent_key,kind,competency_scores,assistance,review_source,observed_at,reevaluation_of,critical_errors').eq('organization_id',s.organization_id).eq('user_id',s.user_id).order('observed_at').order('id').range(start,end)),
   admin.from('organization_memberships').select('learning_position_key').eq('organization_id',s.organization_id).eq('user_id',s.user_id).single(),
   readWorkspacePages<JobProfile>((a,b)=>admin.from('learning_job_profiles').select('position_key,version,weights,expected').order('version',{ascending:false}).order('position_key').range(a,b)),
  ]);
  if(h.error||m.error||profiles.error)return Response.json({error:'REVIEW_SAVED_SNAPSHOT_PENDING'},{status:503});
  const profile=(profiles.data??[]).find(p=>p.position_key===m.data?.learning_position_key) as JobProfile|undefined;
  const summary=competencyProfile(h.data as CompetencyEvidence[],profile??null);
  const after={observed_at:new Date().toISOString(),profile_version:profile?.version??null,competencies:summary.competencies.map(c=>({key:c.key,level:c.level,count:c.count}))};
  const {error:snapshotError}=await admin.rpc('complete_training_reinforcement',{p_actor:run?.authorizer_id??session.user.id,p_org:s.organization_id,p_user:s.user_id,p_activity:s.activity_id,p_after:after});
  if(snapshotError)return Response.json({error:'REVIEW_SAVED_SNAPSHOT_PENDING'},{status:503});
 }
 return Response.redirect(new URL('/role-training/review'+(s.organization_id?'?organization_id='+s.organization_id:''),req.url),303);
}
